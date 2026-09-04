# Website Thiên Đức — Tóm tắt Findings Bảo Mật

> **Trạng thái:** Đang dùng (bản tóm tắt của [security-audit-phase-1](security-audit-phase-1.md))
> **Nhóm:** 05 — Security
> **Nguồn (di chuyển từ):** `security-audit/FINDINGS_SUMMARY.md`

**Audit Date:** 2026-07-14  
**Status:** ✋ AWAITING_SECURITY_PLAN_APPROVAL  
**Total Findings:** 10 (2 HIGH, 5 MEDIUM, 3 LOW)

---

## 🔴 Critical (HIGH) — Cần fix ngay

| # | Finding | File | Risk | Action |
|---|---------|------|------|--------|
| 1 | CORS fallback to `*` | `src/main.ts:16` | Unauthorized data access | Remove fallback, require env |
| 2 | No rate limit on login endpoint | `src/auth/auth.controller.ts` | Brute force, account DoS | Add @Throttle 5/min |
| 3 | SQL injection risk in search | `src/search/search.service.ts` | Query manipulation, DoS | Replace websearch_to_tsquery |

---

## 🟡 Medium — Cần fix trong vòng 1-2 tuần

| # | Finding | File | Risk | Action |
|---|---------|------|------|--------|
| 4 | Missing CSP header | Frontend (next.config.ts) | Weak XSS mitigation | Add CSP Report-Only → Enforce |
| 5 | No rate limit on /auth/refresh | `src/auth/auth.controller.ts` | Token brute force | Add @Throttle 10/min |
| 6 | No rate limit on /auth/logout | `src/auth/auth.controller.ts` | DoS | Add @Throttle 20/min |
| 7 | Contact form rate limit via IP | `src/contact/contact.controller.ts` | Proxy bypass risk | Verify trusted proxy config |
| 8 | No WAF in front of backend | Render infrastructure | DDoS, vulnerability scan | Setup Cloudflare WAF |

---

## 🟢 Low — Có thể fix sau

| # | Finding | File | Risk | Action |
|---|---------|------|------|--------|
| 9 | No input length limit | `src/contact/dto/create-contact-submission.dto.ts` | DoS via huge payload | Add MaxLength validators |
| 10 | JWT in localStorage (not HttpOnly) | Admin CMS auth | XSS can steal token | Trade-off (SPAs lack HttpOnly option) |

---

## 📊 7 Security Groups Coverage

```
1. Rate Limiting         [⚠️  PARTIALLY_IMPLEMENTED]  ← 3 findings
2. CORS                  [🔴 MISCONFIGURED]         ← 1 HIGH finding
3. SQL Injection         [⚠️  PARTIALLY_VERIFIED]    ← 1 HIGH finding
4. CSRF                  [✅ NOT_APPLICABLE]         ← Bearer token auth
5. XSS                   [✅ SAFE]                  ← No innerHTML found
6. Firewall & WAF        [❓ NOT_VERIFIABLE]        ← Infrastructure only
7. VPN / Admin Access    [❓ NOT_VERIFIABLE]        ← Infrastructure only
```

---

## 🎯 Implementation Timeline (Proposed)

| Phase | Duration | Focus | Blockers |
|-------|----------|-------|----------|
| **Phase 1** | 1-2 weeks | Fix 3 HIGH findings | Rate limit tuning |
| **Phase 2** | 1 week | CSP + security headers | CSP Report-Only period |
| **Phase 3** | 1-2 weeks | Rate limit refinement | Real traffic metrics |
| **Phase 4** | 2-4 weeks | Infrastructure (WAF, monitoring) | Budget approval |

---

## ⚠️ Blockers — Cần thông tin từ công ty

- [ ] **Production origin domain** (CORS whitelist) — currently hardcoded Vercel URL
- [ ] **Expected login/refresh traffic** — to calibrate rate limits (PROPOSED_DEFAULT = 5/min)
- [ ] **Number of backend instances** — if >1, need Redis rate-limit store
- [ ] **Custom domain** — nếu có, cần update CORS
- [ ] **Infrastructure approval** — có budget cho Cloudflare WAF không?

---

## 📝 Recommended Next Steps

1. **Review this summary** + full audit report
2. **Clarify blockers** (give rates, domains, infrastructure status)
3. **Approve Phase 1 plan** (3 HIGH findings)
4. **Schedule implementation** (1-2 weeks)
5. **Staging verification** (3 days per phase)
6. **Production rollout** (monitoring alerts enabled)

---

**Full audit report:** `security-audit-phase-1.md`

