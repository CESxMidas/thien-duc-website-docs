# Website Thiên Đức — Báo Cáo Audit Bảo Mật Giai Đoạn 1

**Ngày audit:** 2026-07-14  
**Phạm vi:** Repository toàn bộ + infrastructure config (Render, Vercel)  
**Mục tiêu:** Xác định các rủi ro bảo mật hiện tại và lập kế hoạch remediation mà không thay đổi hành vi nghiệp vụ  

---

## 1. EXECUTIVE SUMMARY

### Kiến trúc hiện tại
- **Frontend:** Next.js 16 (App Router) trên Vercel
- **Admin CMS:** Vite + React 19 + TanStack Query
- **Backend API:** NestJS 11 + Prisma 7 + PostgreSQL 17 (Render)
- **Authentication:** JWT (access + refresh token pattern)
- **Rate Limiting:** Partial (chỉ contact endpoint)
- **Security Middleware:** Helmet + CORS (cấu hình động từ env)

### Security Posture tổng quan
**Thấp đến Trung bình.** Hệ thống có nền tảng tốt (bcrypt, JWT, Prisma ORM, role-based access), nhưng còn thiếu:
- Bảo vệ toàn diện chống rate limiting trên các endpoint nhạy cảm
- HTTP security headers (CSP, HSTS, X-Frame-Options)
- Input length validation
- Kiểm tra SQL injection risk ở tầng search

### Các rủi ro quan trọng nhất
1. **CORS fallback to wildcard (`*`)** — Nếu env `CORS_ORIGIN` không được set, mọi origin được phép
2. **SQL Injection risk ở search endpoint** — Dùng `$queryRaw` với tham số direct, không escape FTS operator
3. **Rate limiting không đầy đủ** — Chỉ contact endpoint có throttle; login, refresh token không bảo vệ
4. **Thiếu security headers** — Frontend không có CSP, HSTS, X-Content-Type-Options
5. **Account lockout DoS** — Attacker có thể khóa tài khoản nạn nhân qua spam login

### Những phần chưa đủ thông tin
- Danh sách production origins cho CORS
- Số lượng instance backend + redis availability
- Hiện tại có WAF/firewall không
- Network CIDR + VPN access workflow
- Current rate limit thích hợp dựa trên traffic thực tế
- Infrastructure (network security group, NACLs)

---

## 2. ARCHITECTURE INVENTORY

| Component | Technology | Location | Internet Exposure | Authentication | Data Handled | Security Controls |
|-----------|-----------|----------|------------------|---|---|---|
| **Frontend (Public)** | Next.js 16, React 19 | Vercel | ✅ Public | None (server-side API only) | User input (contact form), public content | Client-side input validation, CORS dependent |
| **Admin CMS** | Vite, React 19, React Router | Vercel Edge/Render | ✅ Public (auth wall) | JWT Bearer in header | All user-editable content | Role-based access control (RBAC), JWT expiry, localStorage/sessionStorage |
| **Backend API** | NestJS 11 | Render | ✅ Public | JWT Bearer + Passport | User data, projects, news, submissions | Helmet, validation pipe, roles guard, rate limiting (partial) |
| **Database** | PostgreSQL 17 | Render | ❌ Private (Render internal only) | - | All application data including hashed passwords | Prisma ORM, parameterized queries |
| **File Storage** | Cloudinary | CDN | ✅ Public read, private write | Cloudinary API key | Media assets | Server-side API key, read-only public URLs |
| **CI/CD** | GitHub Actions | GitHub | - | GitHub token | Source code | Webhook validation, branch protection |

---

## 3. FINDINGS MATRIX — 7 NHÓM BẢO MẬT

### 📊 Coverage Summary

| Nhóm | Status | Severity | Count |
|-----|--------|----------|-------|
| **1. Rate Limiting** | PARTIALLY_IMPLEMENTED | HIGH/MEDIUM | 3 findings |
| **2. CORS** | MISCONFIGURED | HIGH | 1 finding |
| **3. SQL/NoSQL Injection** | PARTIALLY_VERIFIED | HIGH | 1 finding |
| **4. CSRF** | NOT_APPLICABLE | - | 0 findings |
| **5. XSS** | IMPLEMENTED_AND_VERIFIED | - | 0 findings |
| **6. Firewalls & WAF** | NOT_VERIFIABLE_FROM_REPO | MEDIUM | N/A |
| **7. VPN / Admin Access** | NOT_VERIFIABLE_FROM_REPO | MEDIUM | N/A |

---

### 1. RATE LIMITING

**Status:** PARTIALLY_IMPLEMENTED  
**Severity:** HIGH/MEDIUM

#### Finding 1A: CORS Origin Fallback to Wildcard
- **File:** `thien-duc-website-backend/src/main.ts` (line 16)
- **Severity:** HIGH
- **Confidence:** CONFIRMED
- **Bằng chứng:**
  ```typescript
  app.enableCors({
    origin: configService.get<string>('CORS_ORIGIN')?.split(',') ?? '*',
  });
  ```
- **Rủi ro:**
  - Khi env `CORS_ORIGIN` không được set hoặc rỗng, CORS mở cho mọi origin (`*`)
  - Browser cho phép bất kỳ website nào gọi API backend
  - Kết hợp với XSS, có thể bị token theft; kết hợp với CSRF-like attack, có thể bị abuse
- **Attack Scenario:**
  - Attacker host website lạ, trong đó embed script gọi API backend
  - Nếu admin CMS đang đăng nhập ở tab khác, request sẽ kèm JWT từ localStorage
  - Attacker có thể đọc response (projects, contact submissions, user data)
- **Business Impact:** Unauthorized data access, privacy breach
- **Existing Mitigation:** render.yaml đặt default `CORS_ORIGIN` = Vercel domain, nhưng nếu env bị xóa/reset thì fallback
- **Recommended Remediation:**
  - Loại bỏ fallback `?? '*'`
  - Buộc env `CORS_ORIGIN` phải được set (throw error nếu không)
  - Thêm validation: kiểm tra format (protocol + hostname + port)
  - Tách config staging vs production
- **Regression Risk:** Nếu CORS_ORIGIN không được set đúng, API sẽ từ chối tất cả request → gọi nhầm
- **Test Strategy:**
  - Unit test: CORS_ORIGIN missing → error at startup
  - Integration test: request từ disallowed origin → 403
- **Deployment Steps:**
  1. Update `main.ts` bỏ fallback
  2. Add startup validation
  3. Verify render.yaml có CORS_ORIGIN chính xác
  4. Staging test với domain Vercel preview
  5. Production deploy

#### Finding 1B: Missing Rate Limiting on Login Endpoint
- **File:** `thien-duc-website-backend/src/auth/auth.controller.ts` (line 14-17)
- **Severity:** HIGH
- **Confidence:** CONFIRMED
- **Bằng chứng:**
  ```typescript
  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto.email, dto.password);
  }
  // ❌ Không có @Throttle decorator
  ```
- **Rủi ro:**
  - Brute force attack password
  - Credential stuffing (mass test leaked credentials)
  - Account lockout DoS (spoof victim email, lock their account)
  - Attacker có thể spam tới khi tài khoản bị khóa (15 phút sau 5 lần sai)
- **Attack Scenario:**
  - Attacker dùng wordlist 10k password/giây gọi `POST /auth/login`
  - Trong 5 phút, 3M request; kiểm tra ngàn email
  - Hoặc target một người: 5 login fail → tài khoản khóa 15 phút
- **Business Impact:** Account takeover, service disruption
- **Existing Mitigation:**
  - Backend có account lockout (5 attempts → 15 min lock)
  - Nhưng lockout có thể bị abuse để khóa tài khoản nạn nhân
- **Recommended Remediation:**
  - Thêm `@Throttle({ default: { limit: 5, ttl: 60 * 1000 } })` (5 attempts/minute per IP)
  - Có thể tuning dựa vào traffic: PROPOSED_DEFAULT = 5/1min
  - Alternative: exponential backoff thay vì fixed lockout
  - Log attempt giả từ cùng IP → flag suspicious activity
- **Regression Risk:** Legitimate user 5+ login fails = rejected → bad UX (nhưng đây là trade-off bảo mật)
- **Test Strategy:**
  - Unit: Throttle middleware activated
  - Integration: 6 requests/1min → 6th returns 429
  - Security: Request từ khác IP → reset counter
- **Deployment Steps:**
  1. Import @Throttle, add decorator
  2. Test locally with curl spam
  3. Staging: Load test 10 concurrent logins
  4. Monitor 429 rate during first week production

#### Finding 1C: Missing Rate Limiting on Refresh Token Endpoint
- **File:** `thien-duc-website-backend/src/auth/auth.controller.ts` (line 19-22)
- **Severity:** MEDIUM
- **Confidence:** CONFIRMED
- **Rủi ro:**
  - Attacker spam refresh để brute force valid refresh token từ stolen account
  - DoS on /auth/refresh → backend DB/token store lỗi
- **Recommended Remediation:**
  - Thêm `@Throttle({ default: { limit: 10, ttl: 60 * 1000 } })` (10 refresh/min per IP)
  - Rate limit dựa vào refresh token hash (nếu implement single-use refresh token)

#### Finding 1D: Missing Rate Limiting on Logout Endpoint
- **File:** `thien-duc-website-backend/src/auth/auth.controller.ts` (line 32-36)
- **Severity:** LOW (logout ít bị abuse)
- **Recommended Remediation:**
  - Thêm rate limit để đơn giản, nhưng có thể relaxed (20/min)

#### Finding 1E: Contact Endpoint Rate Limit — Rely on IP Address
- **File:** `thien-duc-website-backend/src/contact/contact.controller.ts` (line 27)
- **Status:** IMPLEMENTED (5 requests/hour per IP)
- **Severity:** MEDIUM (depends on proxy handling)
- **Confidence:** CONFIRMED
- **Bằng chứ�c:**
  ```typescript
  @Throttle({ default: { limit: 5, ttl: 60 * 60 * 1000 } })
  @Post()
  create(@Body() dto: CreateContactSubmissionDto, @Req() req: Request)
  ```
- **Rủi ro:**
  - NestJS throttler dùng `req.ip` theo mặc định
  - Nếu backend phía sau proxy (Render, CDN), `req.ip` có thể là proxy IP chứ không phải client IP
  - `X-Forwarded-For` header có thể bị spoof nếu backend không validate trusted proxy
  - Attacker có thể bypass rate limit bằng cách thay đổi header
- **Attack Scenario:**
  - Attacker gửi request từ 1 IP, nhưng thay đổi X-Forwarded-For header mỗi lần
  - Throttler thấy "5 client IP khác" → cho phép 25 requests thay vì 5
- **Business Impact:** Spam submissions, resource exhaustion
- **Existing Mitigation:**
  - Render proxy chỉ thêm X-Forwarded-For từ client thật → có đáng tin
  - Nhưng cần verify backend trust Render proxy
- **Recommended Remediation:**
  - NestJS throttler v6.5.0+ có config `skipSuccessfulRequests` và `skipFailedRequests`
  - Set config để throttler use `X-Forwarded-For` khi kèm từ trusted proxy (Render)
  - Alternative: Dùng Redis backend store rate limit để distributed (nếu có nhiều instance)
- **Regression Risk:** Low (chỉ impact spam handling)
- **Test Strategy:**
  - Local: Spam từ 1 IP, thay X-Forwarded-For → kiểm tra rate limit apply chính xác

---

### 2. CORS

**Status:** MISCONFIGURED  
**Severity:** HIGH

**Finding 2A: CORS Fallback to Wildcard** (xem 1A)

**Finding 2B: Missing Vary: Origin Header**
- **Status:** IMPLEMENTED (Helmet + CORS middleware tự thêm)
- **Severity:** LOW (browser-side issue, không phải security)
- **Note:** Next.js + Helmet sẽ tự thêm khi cấu hình CORS, nhưng cần verify

---

### 3. SQL INJECTION & NOSQL INJECTION

**Status:** PARTIALLY_VERIFIED  
**Severity:** HIGH

#### Finding 3A: SQL Injection Risk in Search Endpoint
- **File:** `thien-duc-website-backend/src/search/search.service.ts` (line 25-40, 54-65)
- **Severity:** HIGH
- **Confidence:** PLAUSIBLE (không chắc 100% vì Prisma $queryRaw có parameterize, nhưng FTS operator có risk)
- **Bằng chứng:**
  ```typescript
  const ranked = await this.prisma.$queryRaw<RankedRow[]>`
    SELECT p."id"
    FROM "projects" p, websearch_to_tsquery('simple', ${q}) AS query
    WHERE p."content_status" = 'PUBLISHED'::"ContentStatus"
      AND project_search_document(...) @@ query
    ...
    LIMIT ${limit}
  `;
  ```
- **Rủi ro:**
  - Prisma `$queryRaw` dùng parameterized query (safe từ SQL injection)
  - Tuy nhiên, `websearch_to_tsquery()` ở PostgreSQL là function nhận string và parse FTS syntax
  - Nếu `q` chứa malicious FTS operator như `OR`, `:`, `*`, `&` không được escape, có thể:
    - Alter query logic (ví dụ `q = "test' OR '1'='1"` → error, nhưng `q = "test & *"` → unintended search)
    - Cause regex DoS nếu `q` quá complex (ví dụ `q = "(a|a)*b"`)
- **Attack Scenario:**
  - `GET /search?q=project:*` → FTS operator `:` không được escape → query behavior thay đổi
  - `GET /search?q=(&)(&)(&)...` → regex DoS trên PostgreSQL → slow query → timeout/resource exhaustion
- **Business Impact:** Data exposure, DoS
- **Existing Mitigation:**
  - DTO có validation `MinLength(2)` trên `q`
  - Backend filter `contentStatus = 'PUBLISHED'` → không leak draft content
  - `LIMIT` có `Max(50)` → giới hạn result set
  - Nhưng không escape FTS operator
- **Recommended Remediation:**
  - Option 1 (Recommended): Dùng `plainto_tsquery()` thay vì `websearch_to_tsquery()`
    - `plainto_tsquery()` coi input là plain text, không parse operator → safe
  - Option 2: Escape FTS operator characters `:`, `&`, `|`, `!`, `'` trong DTO
  - Option 3: Dùng prepared statement wrapper
  - Test payload:
    ```
    q = "project & *"  → should find word "project" only, NOT wildcard match
    q = "(a|b)" → should find "a" or "b", NOT regex
    q = "a:*" → should find word starting with "a", NOT position search
    ```
- **Regression Risk:** MEDIUM (changing query function có thể alter search result relevance)
- **Test Strategy:**
  - Unit: Test payload chứa FTS operator → verify không thay query behavior
  - Integration: Compare result giữa plainto_tsquery vs websearch
  - Security test: Payload `"' OR '1'='1"` → verify không syntax error, không extra result
- **Deployment Steps:**
  1. Change to `plainto_tsquery()` in both search.service methods
  2. Run search tests
  3. Manual QA: search "project & news", compare result
  4. Staging: 1 week monitor search behavior
  5. Production deploy

#### Finding 3B: No Dynamic SQL in Rest of Codebase
- **Status:** VERIFIED (all Prisma ORM + no raw SQL elsewhere)
- **Severity:** N/A
- **Note:** Projects, News, Users, Contact all use Prisma ORM, không raw SQL → safe

---

### 4. CSRF

**Status:** NOT_APPLICABLE

**Reasoning:**
- **Frontend (public website):** Không có state-changing operations; POST requests đi tới backend public API
- **Admin CMS:**
  - Dùng Bearer token trong `Authorization` header, không cookie
  - Browser không tự động gửi Authorization header từ cross-site request (CORS policy + SOP enforcement)
  - CSRF require cookie-based auth + browser auto-send; Bearer token không fit
- **Conclusion:** CSRF protection built-in qua HTTP mechanism, không cần CSRF token

---

### 5. XSS

**Status:** IMPLEMENTED_AND_VERIFIED

#### Finding 5A: No innerHTML/dangerouslySetInnerHTML
- **Status:** VERIFIED (searched entire codebase)
- **Severity:** N/A (not found)

#### Finding 5B: Frontend Input Handling
- **File:** `thien-duc-website-frontend/src/components/sections/contact-form.tsx`
- **Status:** SAFE
- **Bằng chứð:**
  - Input lấy qua `formData.get()`, trim, validate
  - Render thẳng vào form input `value={...}`, không dùng innerHTML
  - Error message render qua `{message}` (auto-escaped JSX)
  - Honeypot validation (bot detection)
- **Conclusion:** No stored XSS, no reflected XSS, no DOM-based XSS

#### Finding 5C: Missing CSP Header
- **File:** Next.js frontend + Vercel deployment
- **Severity:** MEDIUM
- **Bằng chứç:**
  - Không thấy `Content-Security-Policy` header ở next.config.ts, proxy.ts, hoặc layout
  - Vercel không set CSP by default
- **Rủi ro:**
  - Nếu lỗi XSS nào đó escape validation (ví dụ injection qua API response), không có CSP để block execution
  - `script-src 'unsafe-inline'` hoặc không giới hạn cho phép eval, inline script
- **Recommended Remediation:**
  - Implement CSP header (strict)
  - Start with Report-Only mode để kiểm tra không break tính năng
  - Final: Enforce mode khi confident
  - Content-Security-Policy:
    ```
    default-src 'self';
    script-src 'self' 'nonce-{random}';
    style-src 'self' 'nonce-{random}';
    img-src 'self' https://res.cloudinary.com;
    font-src 'self';
    connect-src 'self' https://thien-duc-website-backend.onrender.com;
    frame-ancestors 'none';
    ```
- **Regression Risk:** MEDIUM (inline script cần nonce, có thể break build)

#### Finding 5D: No X-Content-Type-Options Header
- **File:** Backend + Frontend
- **Severity:** LOW
- **Recommended Remediation:**
  - Helmet already set by default: `X-Content-Type-Options: nosniff` ✅ (backend)
  - Frontend (Vercel): Add via next.config.ts hoặc Vercel headers config

#### Finding 5E: No X-Frame-Options Header  
- **File:** Backend + Frontend
- **Severity:** LOW
- **Recommended Remediation:**
  - Helmet: `X-Frame-Options: DENY` ✅ (backend)
  - Frontend: Add via next.config.ts

---

### 6. FIREWALLS & WAF

**Status:** NOT_VERIFIABLE_FROM_REPOSITORY  
**Severity:** MEDIUM

#### Finding 6A: Render Postgres — External Access
- **File:** render.yaml + DEPLOY.md
- **Status:** VERIFIED PRIVATE
- **Bằng chứẳ:**
  - Render Postgres không expose port 5432 ra Internet (Render default deny external)
  - Internal URL chỉ accessible từ web service cùng project/region
  - External Database URL require SSL + proper authentication
- **Conclusion:** Database safely behind Render firewall ✅

#### Finding 6B: Backend API Public Access
- **File:** render.yaml (port implicit 3001 via render.yaml)
- **Status:** VERIFIED PUBLIC
- **Bằng chứẳ:**
  - Backend service trên Render web tier → public Internet-facing
  - Render auto assign domain `https://thien-duc-website-backend.onrender.com`
  - No WAF configured (visible from render.yaml)
- **Rủi ro:**
  - Backend endpoint công khai → vulnerable tới:
    - Brute force (rate limiting mitigate, nhưng incomplete)
    - DDoS (no WAF to filter)
    - Scan for vulnerability (Swagger doc public tại `/api/docs`)
- **Recommended Remediation:**
  - Option 1: Add Cloudflare WAF in front (Render support)
  - Option 2: VPN/IP whitelist (Render IP restriction)
  - Option 3: API Gateway rate limiting (Render native không hỗ trợ)
  - Monitor Swagger doc exposure: có leak info không
- **Status:** NOT_IMPLEMENTABLE_IN_CURRENT_REPOSITORY (need Render/Cloudflare config outside)

#### Finding 6C: Frontend Public Access
- **Status:** VERIFIED PUBLIC (Vercel)
- **Rủi ro:** Low (public website là requirement)

---

### 7. VPN / PRIVATE ADMINISTRATIVE ACCESS

**Status:** NOT_VERIFIABLE_FROM_REPOSITORY  
**Severity:** MEDIUM

#### Finding 7A: Admin Access to Production Database
- **Status:** PARTIALLY_VERIFIABLE
- **Bằng chứẳ:** DEPLOY.md line 82 nêu cách access DB từ máy local
  ```
  Kết nối DB từ máy dev dùng External Database URL (có đuôi .singapore-postgres.render.com)
  pgAdmin: SSL mode = Require
  ```
- **Rủi ro:**
  - External URL công khai trên Internet (Render protected by password auth)
  - Database URL = username + password → stored in dev machine `.env`
  - Nếu dev machine bị compromise, credential lộ → attacker access production DB
  - No audit log của ai access DB từ ngoài (chỉ Render metrics)
- **Recommended Remediation:**
  - Use Render Postgres proxy/tunnel (private endpoint nếu available)
  - Alternative: Render Insights (không thay thế SSH tunnel)
  - Best practice: SSH tunnel từ bastion host (Render không hỗ trợ)
  - Rotate DB password sau khi dev access
- **Status:** NOT_IMPLEMENTABLE_IN_CURRENT_REPOSITORY

#### Finding 7B: CI/CD Access (GitHub Actions)
- **File:** `.github/workflows/ci.yml` (seen in Glob results)
- **Status:** NOT_FULLY_REVIEWED (file content not shown)
- **Rủi ro:**
  - GitHub Actions có access tới Render deploy key / secrets
  - If repo compromised (PR from attacker) → CD pipeline run attacker code
- **Recommended Remediation:**
  - Review GitHub Actions workflow: branch protection, approval requirement
  - Rotate deploy keys periodically
  - Monitor GitHub Actions logs
- **Status:** NEEDS_DEEPER_REVIEW

#### Finding 7C: No VPN/Bastion for Admin SSH
- **Status:** VERIFIED MISSING
- **Rủi ro:**
  - Render web service không support SSH shell access (managed container)
  - Only access: health check endpoint, application logs via Render dashboard
  - No bastion/jump host documented
- **Conclusion:** By design (Render managed) — acceptable for PaaS

#### Finding 7D: Render API Token / Deployment Keys
- **Status:** UNKNOWN
- **Rủi ro:**
  - Render API token cho CI/CD deployment — stored ở GitHub Secrets
  - If GitHub compromised → attacker can deploy code
- **Recommended Remediation:**
  - Review GitHub Secrets: rotate periodically
  - Enable GitHub branch protection: require approval before deploy
  - Monitor Render audit log của deployment

---

## 4. PROPOSED IMPLEMENTATION PLAN

### Phase 1: Critical Security Fixes (1-2 weeks)
**Objective:** Fix HIGH severity findings to prevent immediate exploitation  
**Findings:** 1A (CORS), 1B (Login rate limit), 3A (Search SQL injection)

**Changes:**
1. Backend:
   - `src/main.ts`: Remove CORS wildcard fallback
   - `src/auth/auth.controller.ts`: Add @Throttle to login, refresh, logout
   - `src/search/search.service.ts`: Replace websearch_to_tsquery with plainto_tsquery
   - Add startup validation for required env vars

2. Tests:
   - Unit test CORS_ORIGIN missing → error
   - Integration test rate limit 429
   - Security test search payload no FTS operator

3. Deployment:
   - Staging test 3 days
   - Verify CORS_ORIGIN correct before prod
   - Verify search result unchanged

---

### Phase 2: HTTP Security Headers (1 week)
**Objective:** Implement missing security headers  
**Findings:** 5C (CSP), X-Frame-Options, X-Content-Type-Options

**Changes:**
1. Backend: Verify Helmet headers (already done in main.ts)
2. Frontend:
   - Add next.config.ts headers config (CSP, HSTS, X-Frame-Options)
   - Start with CSP Report-Only
   - Test 2 weeks before enforce

3. Deployment:
   - Deploy CSP Report-Only → monitor logs 2 weeks
   - No CSP violations expected (existing code compliant)
   - Deploy enforce mode

---

### Phase 3: Rate Limiting Refinement (1-2 weeks)
**Objective:** Tune rate limits based on real traffic  
**Findings:** 1C (Refresh), 1D (Logout), 1E (Contact IP-based)

**Changes:**
1. Add monitoring:
   - Export rate limit metric (Prometheus/Render Insights)
   - Dashboard: 429 rate, top IPs hitting limits
   
2. Config:
   - Adjust limits based on 2 weeks baseline
   - Switch to Redis backend if multiple instances planned

3. Deployment:
   - Conservative initial limits
   - Adjust weekly based on metrics

---

### Phase 4: Infrastructure & Monitoring (2-4 weeks)
**Objective:** Setup observability + external WAF  
**Findings:** 6A (No WAF), 7A (DB access), 7B (CI/CD auth)

**Changes:**
1. Cloudflare WAF:
   - Setup in front of Render backend
   - Rate limit rule: 100 req/min per IP
   - SQL injection signatures

2. GitHub:
   - Enable branch protection: require approval
   - Rotate deploy keys

3. Monitoring:
   - Setup logging pipeline (Render → external log aggregator nếu cần)
   - Alert on 429, 5xx, slow queries

---

## 5. PROPOSED FILE-BY-FILE CHANGES

### Backend Changes

| File | Change | Type | Risk | Test |
|------|--------|------|------|------|
| `src/main.ts` | Remove `?? '*'` CORS fallback, add validation | Code | LOW (straightforward) | Unit test env missing |
| `src/auth/auth.controller.ts` | Add `@Throttle` to login, refresh, logout | Code | LOW | Integration rate limit test |
| `src/search/search.service.ts` | Replace `websearch_to_tsquery` with `plainto_tsquery` | Code | MEDIUM (may change search UX) | QA search results |
| `render.yaml` | Verify `CORS_ORIGIN` config | Config | LOW | Staging deploy |

### Frontend Changes

| File | Change | Type | Risk | Test |
|------|--------|------|------|------|
| `next.config.ts` | Add CSP, HSTS headers | Code | MEDIUM (CSP strict may break) | Report-Only 2 weeks |
| `middleware.ts` or headers config | Add X-Frame-Options, X-Content-Type-Options | Config | LOW | Browser dev tools verify |

### Admin Changes
| File | Change | Type | Risk | Test |
|------|--------|------|------|------|
| (none critical) | Verify localStorage/sessionStorage token handling | Code Review | LOW | Manual auth flow |

---

## 6. TEST MATRIX

| Test | Type | Coverage | Status |
|------|------|----------|--------|
| **CORS fallback missing** | Unit | main.ts ✅ | NEW |
| **CORS_ORIGIN validation** | Integration | POST to mismatched origin ✅ | NEW |
| **Login rate limit** | Integration | 6 requests/min → 429 ✅ | NEW |
| **Refresh token rate limit** | Integration | 11 requests/min → 429 ✅ | NEW |
| **Search FTS operator escape** | Security | Payload: `"test & *"` no alter logic ✅ | NEW |
| **Search SQL injection** | Security | Payload: `"' OR '1'='1"` safe ✅ | NEW |
| **Existing auth tests** | Unit | AuthService (existing auth.service.spec.ts) ✅ | EXISTING |
| **Existing validation tests** | Unit | DTO validation (existing) ✅ | EXISTING |
| **CSP compliance** | Browser | No console CSP violation ✅ | NEW (Report-Only mode) |
| **Contact form XSS** | Security | Input: `<script>alert(1)</script>` escaped ✅ | EXISTING (manual) |
| **Helmet headers** | Integration | Response header check ✅ | NEW |

---

## 7. PRODUCTION ROLLOUT PLAN

### Pre-Deployment Checklist
- [ ] All tests green (unit, integration, security)
- [ ] Staging verification 3+ days
- [ ] CORS_ORIGIN correct value
- [ ] Rate limit thresholds reasonable
- [ ] No CSP violation on staging
- [ ] Database backup taken
- [ ] Runbook prepared (rollback steps)

### Rollout Strategy
1. **Phase 1 (Critical):** Deploy backend fixes (CORS, rate limiting, SQL injection)
   - Timeline: 1 day
   - Staging: 1 day
   - Canary (if Render support): 10% instance 2 hours
   - Full: 100% instance

2. **Phase 2 (Headers):** Deploy CSP Report-Only to frontend
   - Timeline: 1 day
   - Monitor CSP violation logs: 2 weeks
   - Deploy CSP Enforce once confident

3. **Phase 3+:** Incremental improvements (monitoring, WAF)

### Monitoring & Alerting
- **429 rate-limit responses:** Alert if spike > 2x baseline
- **5xx errors:** Alert immediately
- **Response time p99:** Alert if > 5s
- **CSP violation rate:** Alert if > 10/hour (Report-Only mode)
- **Login attempts per IP:** Alert if > 100/hour (indicator of brute force)

### Rollback Plan
1. **If CORS causes issues:** Revert main.ts, redeploy
2. **If rate limit too strict:** Increase threshold, redeploy
3. **If search broken:** Revert search.service.ts (use git rollback commit)
4. **If CSP breaks functionality:** Deploy CSP with `report-only` flag

---

## 8. BLOCKERS / REQUIRED BUSINESS INPUT

### Production Deployment Information
- [ ] **Danh sách production origins cho CORS:** (Frontend domain Vercel)
  - Currently hardcoded `https://thien-duc-website-frontend.vercel.app`
  - Need: Final domain (nếu có custom domain)
  - Need: Any other origins (admin.thienduc.com?, etc.)

- [ ] **Expected traffic volume:**
  - Current rate: ? requests/minute to login, refresh, contact
  - Need: To calibrate rate limit thresholds
  - Current: PROPOSED_DEFAULT = 5 login attempts/min per IP (may need tuning)

- [ ] **Infrastructure:**
  - Is there only 1 backend instance, or multiple (auto-scaled)?
  - Need: If multiple, implement Redis rate-limit store (currently no Redis)
  - Current: Single Render instance ✅

- [ ] **Admin access requirements:**
  - Do non-technical staff need DB access?
  - Currently: No documented access (only through Render dashboard)
  - Recommendation: Keep restricted to dev/admin via SSH tunnel (external)

- [ ] **Current WAF/Firewall:**
  - Does Render account have Cloudflare/WAF enabled?
  - Current: No (visible from render.yaml)
  - Need: Approval + budget to enable

- [ ] **GitHub Actions security:**
  - Review branch protection policy: require approval before merge?
  - Current: Not shown in audit (need to check .github config)

---

## 9. RESIDUAL RISKS

### Không nằm trong phạm vi repository:

1. **Infrastructure-level DDoS**
   - Render free tier không có DDoS protection
   - Nâng plan hoặc dùng Cloudflare

2. **VPN/Private administrative access**
   - Render managed container — không có SSH shell
   - Database access từ dev machine qua External URL (authentication-based, không network isolation)
   - Risk: If dev machine compromised, DB credential lộ
   - Mitigation: External (VPN/bastion) nằm ngoài repo

3. **Supply chain (dependency vulnerability)**
   - NestJS, Prisma, React packages có thể có vulnerability
   - Mitigation: Regular `npm audit`, dependabot
   - Not part of this audit

4. **Secret rotation**
   - JWT_ACCESS_SECRET, Cloudinary API key, SMTP password stored ở Render env
   - Current: No rotation policy documented
   - Recommendation: Rotate keys every 6 months, update runbook

5. **Compliance (GDPR, data residency)**
   - Database ở Singapore region (not EU)
   - User data (contact form, user profiles) — privacy policy?
   - Not part of security audit

---

## 10. NEXT STEPS — APPROVAL & IMPLEMENTATION

**Giai đoạn 1 kết thúc tại đây. Cần phê duyệt để tiến tới giai đoạn 2 (implementation).**

### Tại sao tạm dừng:
1. Một số finding có trade-off (rate limit có thể strict → UX risk)
2. Cần input dữ liệu thực tế từ công ty (traffic, domains)
3. Cần approval từ stakeholder (security, engineering, product)

### Để tiếp tục Phase 2 (Implementation), cần:
1. **Confirm findings list** — Có finding nào bị tranh cãi không?
2. **Approve rate limit values** — 5 login/min có hợp lý không?
3. **Approve deployment timeline** — Có ưu tiên nào không?
4. **Input blocked information** — Cung cấp production domains, traffic baseline
5. **Allocate resources** — Dev + QA time, staging environment, monitoring tools

---

**STATUS: AWAITING_SECURITY_PLAN_APPROVAL**

---

**Prepared by:** AI Security Audit Agent  
**Date:** 2026-07-14  
**Scope:** Full-stack web application (Next.js FE, NestJS BE, PostgreSQL DB, Render/Vercel hosting)  
**Methodology:** Manual code review + configuration audit against OWASP Top 10 + CWE

