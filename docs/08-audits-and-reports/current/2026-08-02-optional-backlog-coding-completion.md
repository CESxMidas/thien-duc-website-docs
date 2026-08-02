# Backlog tùy chọn §6 — hoàn tất phần code làm được trong repo

> **Trạng thái:** Đang dùng · **Ngày:** 2026-08-02 · **Phiên:** `THIEN-DUC-OPTIONAL-BACKLOG-CODING-COMPLETION-M2`
> **Liên quan:** [backlog §6 đợt 1](2026-07-31-optional-backlog-repo-work.md) ·
> [dọn chất lượng CI](2026-07-31-ci-flaky-and-warnings-cleanup.md) ·
> [ledger §6/§7](../../04-implementation/implementation-plan.md)

## 0. Tóm tắt

| # | Việc | Kết quả |
|---|---|---|
| 1 | Sentry source map — Admin (Vite) | **REPO PREPARATION COMPLETE** · external upload **NOT VERIFIED** |
| 2 | Backup — phần repo | **REPO AUTOMATION COMPLETE** · storage **NOT CONFIGURED** · production drill **NOT VERIFIED** |
| 3 | G4 — công cụ đo + hàng rào hồi quy | **PARTIALLY COMPLETE** — bundle đo được; TBT **chưa profile** |
| 4 | Schema.org mở rộng | **BLOCKED BY BUSINESS DATA** (không đổi) |
| 5 | **Reconciliation CI backend** (bổ sung, duyệt riêng) | **COMPLETE** — lint 5→**0**, unit 491→**492**, healthcheck `-d`, Actions v5 (xem §8 + §10) |

**Phiên này KHÔNG chạm database.** Máy chạy không có `psql`/`pg_dump` trong PATH
và backend `.env` rỗng, nên mọi việc cần DB được **hoãn có chủ đích** (§6), không
phải thất bại.

---

## 1. Admin — upload source map lên Sentry

### 1.1 Phụ thuộc

`@sentry/vite-plugin@5.4.0` (devDependency). Trước phiên Admin chỉ có
`@sentry/react` (SDK runtime) — không có đường upload source map nào.

### 1.2 Logic cổng tách riêng, test được

`src/lib/sentry-build.ts` — bản song sinh của module cùng tên bên frontend, cùng
quy tắc: **chỉ bật khi đủ ba biến** `SENTRY_AUTH_TOKEN` + `SENTRY_ORG` +
`SENTRY_PROJECT`. Thiếu một cái → plugin **vắng mặt hoàn toàn** khỏi config.

| Hàm | Vai trò |
|---|---|
| `isSentryUploadEnabled` | cổng ba biến; chuỗi rỗng/khoảng trắng = chưa đặt |
| `resolveSentryRelease` | `SENTRY_RELEASE` → `VERCEL_GIT_COMMIT_SHA` → `GITHUB_SHA`; không suy được thì `undefined`, **không bịa** |
| `resolveSourcemapSetting` | `"hidden"` khi bật, `false` khi tắt |
| `resolveSentryPluginOptions` | tham số plugin, hoặc `null` khi tắt |

### 1.3 Release runtime KHỚP release upload

Đây là bất biến quan trọng nhất — lệch release thì source map đã upload không map
được lỗi nào, tức tốn công mà vô dụng.

`vite.config.ts` chèn `__SENTRY_RELEASE__` qua `define`; `src/main.tsx` đọc đúng
biến đó cho `Sentry.init`. **Cùng một hàm** `resolveSentryRelease` sinh ra cả hai
nên không thể lệch. Không suy được SHA → bỏ hẳn field `release`.

### 1.4 Source map không bao giờ phát công khai

`dist/` là thứ được deploy, nên:

- cổng **tắt** → `build.sourcemap = false`: không sinh `.map` nào;
- cổng **bật** → `"hidden"`: có `.map` cho Sentry nhưng **không** gắn
  `//# sourceMappingURL=` vào bundle, rồi plugin xoá `.map` khỏi `dist/` sau khi
  upload (`filesToDeleteAfterUpload`).

**Đã đo** trên bản build thật với cổng tắt: **0 file `.map`**, **0** tham chiếu
`sourceMappingURL` trong `dist/assets/`.

### 1.5 Chính sách khi upload lỗi — **A: build ĐỔ** (cố ý khác frontend)

Frontend (Next/Vercel) chọn *cảnh báo rồi tiếp tục*: một bản deploy lành lặn
không nên đổ vì đường truyền tới Sentry hỏng.

Admin chọn **đổ build**, vì bối cảnh khác: cổng chỉ bật khi ta **chủ động** đặt
đủ ba biến. Lúc đó upload hỏng nghĩa là release sắp lên production mà **không có
source map dùng được** — một "thành công giả". Thà đỏ ngay còn hơn phát hiện khi
đang đọc stack trace vô nghĩa giữa sự cố. Cổng tắt thì không có gì để hỏng.

### 1.6 Test

**29 test** ở `src/lib/sentry-build.test.ts`, chạy **không cần mạng, không cần
token thật** (mọi giá trị là chuỗi giả). Phủ: không biến nào · chỉ token · chỉ
org · chỉ project · mọi tổ hợp thiếu-đúng-một-biến · đủ ba biến · biến
rỗng/khoảng trắng · có SHA · không SHA · thứ tự ưu tiên nguồn release ·
source map khi tắt/bật · plugin vắng mặt khi tắt · plugin đúng **một** lần khi
bật · release upload khớp release runtime · **token không bao giờ lọt ra
release/log**.

Cố ý **không** import `vite.config.ts` vào unit test — logic thuần nằm ở module
riêng nên không phải nạp cả plugin React/Tailwind/Sentry để kiểm một điều kiện if.

### 1.7 Còn lại (ngoài repo)

Tạo token trên Sentry Dashboard → đặt 3 biến ở môi trường build của Admin →
deploy thật → xác nhận artifact xuất hiện trong Releases. **Phiên này KHÔNG
upload gì cả.**

---

## 2. Backup — hoàn tất phần repo

### 2.1 Adapter upload TRUNG LẬP nhà cung cấp

Trước phiên, `backup.sh` chỉ có adapter cứng `s3|b2|gcs`. Dự án **chưa chọn** nhà
cung cấp, nên thêm đường trung lập và biến nó thành đường khuyến nghị:

| Biến | Nghĩa |
|---|---|
| `BACKUP_UPLOAD_COMMAND` | mẫu lệnh; `{file}` = file cục bộ, `{remote}` = đích đầy đủ |
| `BACKUP_REMOTE_PREFIX` | tiền tố đích; **bắt buộc** nếu có `BACKUP_UPLOAD_COMMAND` |
| `BACKUP_UPLOAD_DRY_RUN=1` | chỉ **in** lệnh sẽ chạy, không upload |

Không đặt `BACKUP_UPLOAD_COMMAND` → giữ cục bộ, thoát 0. Lệnh upload hỏng →
**lan truyền** mã lỗi, `backup.sh` đổi thành `EXIT_UPLOAD_FAILED` (7). Adapter cũ
`s3|b2|gcs` giữ nguyên cho cấu hình đã có.

Thay chỗ giữ chỗ bằng bash string replace (không dựng lệnh qua `sed`/`eval` trên
chuỗi người dùng) để tên file có ký tự lạ không trở thành đường chèn lệnh.

### 2.2 Tên DB dùng-một-lần là DUY NHẤT

`verify-restore.sh` trước đây luôn dùng `thien_duc_verify`. Hai lần chạy song
song sẽ giẫm lên nhau: lần sau `dropdb` mất DB lần trước đang restore dở, cả hai
cùng sai một cách khó hiểu. Nay sinh tên `thien_duc_<UTC>_<pid>_verify` —
**vẫn giữ đuôi `_verify`** nên cầu chì `assert_disposable_target` còn nguyên tác
dụng. Truyền `--target` rõ ràng thì tôn trọng lựa chọn của người dùng.

### 2.3 DEFECT THẬT do test bắt được — thứ tự cầu chì

Bộ test mới bắt ngay một lỗi có sẵn: **`need_tool` chạy TRƯỚC các cầu chì an
toàn**. Hệ quả trên máy thiếu `pg_dump`/`pg_restore`:

- gọi `verify-restore.sh` trỏ vào **production** trả mã **4** ("thiếu lệnh") chứ
  không phải **3** ("đích không an toàn");
- lỗi "thiếu `DATABASE_URL`" (mã 2) bị che bởi mã 4;
- và nghiêm trọng nhất: **cầu chì an toàn không thể kiểm chứng được** trên máy
  chưa cài PostgreSQL.

Đã đổi thứ tự thành **tham số → checksum → cầu chì đích → rồi mới kiểm công cụ**.
Cầu chì nay nổ trước, ở mọi máy. Đây là sửa hành vi thật, không phải dọn hình thức.

### 2.4 Lịch chạy trên Windows

Máy vận hành của dự án là Windows nhưng bộ script viết bằng bash. Thêm
`scheduler-windows.ps1` — wrapper cho Task Scheduler, lo ba việc PowerShell
không có sẵn: nạp file env (qua `set -a` nên giá trị **không** hiện trên dòng
lệnh), ghi log ra file, và **tự xoay vòng log** (Task Scheduler không tự xoay).
Lan truyền mã thoát để scheduler cảnh báo đúng. `scripts/backup/logs/` đã thêm
vào `.gitignore`.

`scheduler-examples.md` thêm §2b (biến trung lập cho GitHub Actions) và §3
(Windows Task Scheduler + lệnh đăng ký).

### 2.5 Test — 20 test, KHÔNG cần PostgreSQL

`scripts/backup/tests/run-tests.sh` (`npm run test:backup`). Chạy được không cần
DB **là điểm chính**: mọi thứ được kiểm ở đây là cầu chì — thứ phải chặn *trước*
khi script kịp chạm vào bất kỳ database nào. Cầu chì chỉ hỏng khi có DB thật thì
đã hỏng quá muộn.

| Nhóm | Phủ |
|---|---|
| Thiếu biến (mã 2) | thiếu `DATABASE_URL`; thiếu `--file`; file không tồn tại |
| Cầu chì đích (mã 3) | host ≠ localhost; tên DB giống production; **`render.com`**; tên DB thiếu đuôi `_test/_verify/_restore` |
| Credential | mật khẩu **không** xuất hiện trong lỗi; `--dry-run` không in mật khẩu |
| Checksum (mã 6) | checksum lệch → dừng **trước** khi restore |
| Adapter | tắt → bỏ qua; dry-run → **không** thực thi; thiếu prefix → mã 2; lệnh hỏng → lan truyền; chạy thật (copy cục bộ) → thoát 0 |
| Tên DB | hai lần gọi khác nhau; giữ đuôi `_verify`; `replace_db_name_in_url` giữ host/port |
| Retention | `prune.sh` mặc định chỉ liệt kê, **không xoá** |

Kết quả: **20 đạt / 0 hỏng**. Không lần chạy nào chạm mạng hay database.

### 2.6 Còn lại (ngoài repo)

Chọn nhà cung cấp → credential → lần upload đầu → **diễn tập khôi phục trên dữ
liệu production**. Và diễn tập dump/restore cục bộ (cần PostgreSQL client, xem §6).

---

## 3. G4 — công cụ đo và hàng rào hồi quy

### 3.1 Phân tích bundle — dùng cờ CÓ SẴN, không thêm phụ thuộc

Đã thử `@next/bundle-analyzer` trước và **đo được là nó không chạy**: Next 16
build bằng **Turbopack** mặc định, còn analyzer đó là plugin webpack nên bị bỏ
qua hoàn toàn — build xanh nhưng `.next/analyze/` **rỗng**. Ép `--webpack` thì
analyzer chạy nhưng phân tích một bundle **khác** với bundle production thật, tức
số liệu sai một cách khó thấy.

→ **Gỡ phụ thuộc**, dùng cờ Turbopack-native `next build --experimental-analyze`.
`npm run analyze` gọi nó qua `scripts/analyze.mjs`.

Wrapper chạy Next bằng **chính `process.execPath`** thay vì `npx`: `shell: true`
nối chuỗi tham số không escape (Node cảnh báo DEP0190 — đường chèn lệnh), còn bỏ
shell thì `spawn("npx.cmd")` ném `EINVAL` trên Windows. Giải thẳng đường dẫn JS
của Next là cách chạy giống nhau trên mọi hệ điều hành.

Analyzer là **cờ CLI**, nên `npm run build` của Vercel/CI **không bao giờ** chạy
nó. Artifact nằm trong `.next/` (đã `.gitignore`).

### 3.2 Số đo bundle (build production thật, cục bộ)

| Chunk | Kích thước |
|---|---|
| `chunks/2flbvs6wsx1w1.js` | **410,7 KB** |
| `chunks/1vs4hw422fe5i.js` | 141,6 KB |
| `chunks/0cz1d0mv5g_q7.js` | 110,0 KB |
| `chunks/0inphbxsl9tw9.js` | 54,0 KB |
| `chunks/2rinm2i9kk0c_.js` | 50,9 KB |
| **Tổng JS phía client** | **1 033,9 KB / 24 file** (chưa nén đường truyền) |

> Đây là **kích thước**, không phải TBT. Quy kết từng chunk về gói cụ thể **chưa
> làm được từ dòng lệnh**: bundle đã minify nên không giữ đường dẫn
> `node_modules`. Muốn quy kết phải mở báo cáo ở `.next/diagnostics/analyze/`.

### 3.3 TBT — **VẪN CHƯA PROFILE** (không đoán)

Profiling cần build production **có dữ liệu thật**, tức backend + database. Máy
chạy không có cả hai (§6). Profile một bản build rỗng/lỗi còn tệ hơn không
profile: nó sinh ra số liệu trông như thật nhưng vô nghĩa.

Quy trình đã ghi sẵn để chạy khi có DB — xem §5 tài liệu này.

### 3.4 Hàng rào chống hồi quy — 11 test

`src/lib/performance-guards.test.ts`. **Không** đo thời gian, **không** dựng
trình duyệt, **không** bám vào tên chunk/hash (giòn, đổi mỗi lần build). Chúng
đọc mã nguồn và khoá lại các quyết định đã trả giá để tìm ra:

- ảnh bản đồ **không** hồi quy về `quality={100}` (D8 — từng làm `/_next/image`
  trả HTTP 400, ảnh hỏng trên **mọi** trang chi tiết dự án); mọi `quality` trong
  file phải nằm trong allowlist `[75, 90]`;
- banner: `preload` có **điều kiện** `index === 0`, không phải preload trần;
- các slide sau **vẫn `lazy`**; `sizes="100vw"` còn nguyên;
- đúng **một** `<Image>` trong slider (nhiều hơn nghĩa là đã tách nhánh render,
  lúc đó hai khẳng định trên chỉ soi được một nhánh);
- `images.qualities` vẫn là `[75, 90]`;
- `npm run build` **không** kèm cờ analyze; analyzer dùng cờ Turbopack-native.

**Đã chứng minh test bắt lỗi**: đưa `quality={100}` trở lại → **3 test đỏ**; hoàn
nguyên → **10/10 xanh** (số test lúc chứng minh; sau khi thêm nhóm analyzer là 11).

Một defect **của chính helper test** đã bị bắt và sửa ngay: hàm gỡ chú thích bản
đầu bắt mọi `/*` ở bất kỳ đâu, nên nuốt nhầm cả khối `images` — vì chuỗi
`pathname: "/ksnntvmu/**"` (allowlist Cloudinary) có chứa `/*`. Đã siết thành
"khối chú thích phải mở ở đầu dòng".

### 3.5 Còn lại (ngoài repo)

PSI / Lighthouse / Rich Results Test, và đo lại LCP **sau khi nâng plan Render**.
Không chạy, không suy đoán kết quả.

---

## 4. Schema.org — chỉ rà hàng rào, không thêm dữ liệu

Đã rà lại `structured-data-shape.test.ts`. Hàng rào **cố ý không có**
`sameAs`/`openingHours`/`geo`/`priceRange`/`aggregateRating` vẫn nguyên và vẫn
đúng chỗ (`Organization` chứ không phải `LocalBusiness` — thiếu `geo`/
`openingHours`). **Không có khoảng trống thật**, nên **không sửa gì**.

Không thêm `RealEstateListing`/`Product`/`LocalBusiness`, không thêm giá/offer/
giờ mở cửa/toạ độ/URL mạng xã hội. Trạng thái giữ nguyên **BLOCKED BY BUSINESS
DATA**.

---

## 5. Quy trình profiling TBT — chạy khi có database

Ghi sẵn để lần sau chạy được ngay, **chưa chạy phiên này**.

```bash
# 1. Dựng DB test cục bộ + nạp dữ liệu thật (KHÔNG dùng production).
#    Cần PostgreSQL client trong PATH.
cd thien-duc-website-backend
cp .env.example .env            # rồi điền DATABASE_URL trỏ DB test cục bộ
npx prisma migrate deploy && npm run prisma:seed:projects && npm run prisma:seed:news
npm run start:prod

# 2. Build + chạy frontend ở chế độ production (KHÔNG dev server —
#    dev server có overhead HMR nên số đo vô nghĩa).
cd ../thien-duc-website-frontend
npm run build && npm run start

# 3. Đo 5 trang, mỗi trang 3 lần, lấy trung vị.
```

Năm URL bắt buộc: `/` · `/tin-tuc` · `/du-an` · `/tin-tuc/<slug bài thật>` ·
`/du-an/khu-do-thi-hung-phu`.

Bằng chứng cần thu: long task > 50 ms · chi phí hydrate · kích thước JS phía
client · script bên thứ ba · công của carousel · công của animation/reveal ·
parse JSON payload lớn · client component đáng lẽ là server component · fetch
trùng · handler đắt · rerender thừa.

**Chỉ tối ưu khi có bằng chứng.** Không viết lại banner: bản hiện tại đã có
preload slide đầu, lazy slide sau, `sizes=100vw`, `quality=90` — đọc mã không
thấy gì để sửa, nên sửa mò chỉ tạo rủi ro.

---

## 6. Hoãn có chủ đích — KHÔNG phải thất bại

Máy chạy phiên này: `psql`/`pg_dump` **không có trong PATH** (PostgreSQL 16 có
cài nhưng không nằm trong PATH), `docker` **không có**, và backend `.env`
**rỗng** (không có `DATABASE_URL`). Không dùng service PostgreSQL trên cổng 5432
vì **không có credential** — và đoán credential thì không phải là kiểm thử.

| Hoãn | Vì sao | Cần gì để chạy |
|---|---|---|
| Backend E2E (`npm run test:e2e`) | cần DB sống | `DATABASE_URL` tới DB test cục bộ |
| Diễn tập dump/restore cục bộ | cần `pg_dump`/`pg_restore` + DB | như trên + PostgreSQL client trong PATH |
| Profiling TBT 5 trang | cần build production **có dữ liệu thật** | như trên |
| Playwright full-stack | cần 3 service + DB | như trên |
| Upload Sentry thật | ngoài repo | token + biến ở môi trường build |
| Upload off-site + drill production | ngoài repo | nhà cung cấp + credential |
| PSI / Lighthouse / Rich Results | ngoài repo | chạy trên URL production |

---

## 7. Kết quả kiểm định

| Bộ | Trước phiên | Sau phiên |
|---|---|---|
| Admin vitest | 277 / 28 file | **306 / 29 file** (+29 cổng Sentry) |
| Admin coverage (functions) | 47,41% | **48,20%** (ngưỡng 38) |
| Frontend jest | 189 / 15 suite | **200 / 16 suite** (+11 hàng rào hiệu năng) |
| Backend jest unit | 491 / 37 suite | **492 / 37 suite** (+1 trong reconciliation §10) |
| Backend test backup (mới) | — | **20 đạt / 0 hỏng** |

| Repo | lint | `tsc --noEmit` | build |
|---|---|---|---|
| Admin | 0 lỗi, **1 cảnh báo có sẵn** (`form.tsx`, `react-refresh`) | sạch | xanh |
| Frontend | 0 lỗi, 0 cảnh báo | sạch¹ | xanh |
| Backend | **0 lỗi, 0 cảnh báo** (trước reconciliation: 5 cảnh báo — xem §8, §10) | sạch | xanh |

¹ `tsc --noEmit` trên frontend **phải chạy sau `next build`**: Next 16 sinh kiểu
`PageProps` vào `.next/types`, chưa build thì báo `TS2304: Cannot find name
'PageProps'` ở 6 chỗ. Không phải hồi quy — đã xác minh bằng cách build rồi chạy
lại: **sạch**.

`prisma validate` hợp lệ; `prisma generate` sinh client 7.8.0.

Không chạm production, không chạm database, không gọi Sentry/Vercel/Cloudinary.

---

## 8. PHÁT HIỆN NGOÀI PHẠM VI — công của phiên CI 2026-07-31 KHÔNG có trong repo backend

Trong lúc chạy validation, backend lint ra **5 cảnh báo** và unit test ra **491**
— trong khi [báo cáo CI 2026-07-31](2026-07-31-ci-flaky-and-warnings-cleanup.md)
và ledger §7 ghi **0 cảnh báo** và **492**. Đã kiểm từng mục:

| Thay đổi mà báo cáo CI tuyên bố | Có trong repo? |
|---|---|
| `pg_isready -d thien_duc_test` (backend `ci.yml`) | **KHÔNG** — vẫn `pg_isready -U thienduc_ci` |
| Actions v5 (backend `ci.yml`) | **KHÔNG** — vẫn `checkout@v4` / `setup-node@v4` |
| `cloudinary.service.ts` nhận `unknown` + type guard | **KHÔNG** |
| `instrument.spec.ts` dùng `loadInstrument` (+1 test) | **KHÔNG** |
| Helper hydrate `e2e/helpers/hydration.ts` (admin) | **CÓ** |
| Actions v5 (admin), `actions/cache@v5` (frontend) | **CÓ** |

Tức là **frontend và admin đã nhận commit của phiên đó, backend thì chưa**.
Backend vẫn ở `28abb81` (bản vá unaccent) — công CI của backend chưa từng được
commit và hiện **không tồn tại**.

**→ ĐÃ ĐƯỢC DUYỆT VÀ KHẮC PHỤC trong cùng phiên làm việc.** Sáu mục trên nay đã
được cài thật vào repo backend; chi tiết ở **§10**. Trạng thái cuối đã kiểm
chứng: backend lint **0 lỗi / 0 cảnh báo**, unit **492 / 37 suite**, healthcheck
và Actions đã đúng.

Báo cáo CI 2026-07-31 và ma trận test-case đã được gắn **đính chính** nêu rõ:
điều gì từng được báo cáo, repo thực tế chứa gì, việc gì đã làm trong
reconciliation, và trạng thái cuối. **Không viết lại lịch sử.**

---

## 9. Rủi ro còn lại

1. **Chưa lần nào chạy thật đường upload Sentry của Admin.** Logic cổng có test,
   nhưng lần upload đầu tiên vẫn là lần đầu — hãy thử trên một deploy nháp trước.
2. **Chính sách "build đổ khi upload lỗi" của Admin** có nghĩa Sentry hỏng sẽ
   chặn deploy Admin. Đây là đánh đổi **cố ý** (§1.5); nếu vận hành thấy quá
   ngặt thì đổi sang cảnh báo — nhưng phải ghi nhận rằng khi đó release có thể
   lên mà không có source map.
3. **Adapter upload chạy lệnh do người vận hành khai** (`bash -c`). Chỗ giữ chỗ
   được thay an toàn, nhưng mẫu lệnh vẫn là mã do người dùng cung cấp — chỉ đặt
   giá trị mình hiểu rõ.
4. **Chưa có diễn tập restore nào trên dữ liệu production** — backup chưa từng
   restore thử thì mới chỉ là một file.
5. **TBT vẫn chưa biết.** Bundle 1 033,9 KB là số đo được, nhưng kích thước
   không phải TBT; đừng suy ra kết luận hiệu năng từ nó.
6. **§8 ở trên** — tài liệu và repo backend đang lệch nhau.

---

## 10. Reconciliation CI backend (bổ sung cùng phiên, sau khi được duyệt)

§8 ở trên phát hiện công backend của phiên CI 2026-07-31 **không tồn tại trong
repo**. Phần này ghi lại việc **cài thật** sáu mục đó — phạm vi hẹp, chỉ backend.

### 10.1 Năm cảnh báo lint → 0, không tắt luật

| Vị trí | Nguyên nhân | Cách sửa |
|---|---|---|
| `src/media/cloudinary.service.ts:94` | `cloudinary.uploader.destroy()` khai báo trả `any`; gán thẳng vào kiểu tự đặt nên TS không kiểm gì | Nhận `unknown` + type guard **thật** `destroyStatusOf()` (export, `in`-narrowing, trả `undefined` khi shape lạ) |
| `src/users/users.service.spec.ts:213, 226 (×2), 530` | `expect.objectContaining` / `expect.not.objectContaining` / `expect.anything` trả `any`, đặt thẳng làm field của object literal → cả nhánh mất kiểm tra kiểu | Ba hàm bọc trả `unknown`: `objectContaining` / `notObjectContaining` / `anything`. **Hành vi lúc chạy không đổi** |

**Không** tắt luật, **không** `eslint-disable`, **không** cast `any`.

**Cải thiện hành vi thật ở `destroyImage`**: bản cũ so `undefined !== 'ok'` nên
mọi phản hồi không đọc được đều thành `Cloudinary destroy thất bại: undefined` —
không truy được nguyên nhân. Nay phân biệt rõ "thất bại có lý do" với "không
hiểu phản hồi" (ném kèm nguyên phản hồi đã `JSON.stringify`).

Một lỗi do chính bản sửa gây ra đã bị lint bắt và sửa ngay: `as { result: unknown }`
là assertion **thừa** vì `'result' in response` đã thu hẹp kiểu.

### 10.2 Healthcheck PostgreSQL

```diff
- --health-cmd "pg_isready -U thienduc_ci"
+ --health-cmd "pg_isready -U thienduc_ci -d thien_duc_test"
```

Thiếu `-d`, `pg_isready` thăm dò database **trùng tên user** (`thienduc_ci`) —
không tồn tại — nên cứ 5 giây Postgres ghi `FATAL: database "thienduc_ci" does
not exist`. Container vẫn "healthy" nên nhiễu này che mất lỗi DB thật. Tên
`thien_duc_test` khớp `POSTGRES_DB` và `DATABASE_URL` đã khai trong cùng file.
**Không** đổi credential hay tên DB.

### 10.3 GitHub Actions v4 → v5

Backend có **một** workflow (`.github/workflows/ci.yml`): `actions/checkout` và
`actions/setup-node` ×2 chỗ mỗi loại → **v5** (Node 24).

> Đính chính mô tả cũ: báo cáo M1 ghi "cả 4 workflow" và có `upload-artifact` —
> đó là tính gộp cả frontend/admin. Backend **không** dùng `upload-artifact`.

Cố ý **không** nhảy v6/v7. Không đặt `ACTIONS_ALLOW_USE_UNSECURE_NODE_VERSION`.
Giữ nguyên `node-version: 22`, `cache: npm`, quyền, và mọi bước khác.

### 10.4 Nhiễu `Thiếu SENTRY_DSN` — sửa Ở TEST, không đụng mã production

`src/instrument.ts` cảnh báo ngay lúc import khi thiếu DSN. Đó là hành vi **đúng
với production** (file này phải là import đầu tiên của `main.ts`), nhưng
`instrument.spec.ts` import tĩnh nên mọi lần `npm test` đều in cảnh báo ra
stderr — nhiễu quen mắt thì che mất cảnh báo thật.

`instrument.ts` **không đổi một dòng nào**. Thêm `loadInstrument()` ở tầng test:
đặt env → `jest.resetModules()` → thu `console.warn` vào mảng → nạp module →
**trả lại `console.warn` ngay**. Cảnh báo trở thành thứ **được khẳng định**.

Khác mô tả cũ ở hai điểm, đều có lý do đo được:

- Trả **mảng chuỗi**, không trả spy còn sống. Bản đầu trả spy và bị lỗi thật:
  spy tạo ở thân `describe` (lúc thu thập test) chồng lên spy của chính test →
  cùng một cảnh báo **bị đếm hai lần** (`Expected 1, Received 2`).
- Dùng `jest.requireActual<typeof import('./instrument')>()` thay cho `require`
  trần — luật `@typescript-eslint/no-require-imports` cấm `require`, và cách này
  **không cần** `eslint-disable` nào. (`await import()` động thì cần cờ
  `--experimental-vm-modules`.)

### 10.5 Số test — 491 → **492**, do một test THẬT

Không ép về 492. Con số tăng vì thêm **đúng một** test khẳng định cảnh báo
thiếu DSN. Nếu bỏ test đó thì 491 mới là con số đúng.

### 10.6 Kiểm định sau reconciliation (backend)

| Hạng mục | Kết quả |
|---|---|
| `npm run lint` | **0 lỗi / 0 cảnh báo** (trước: 0 / 5) |
| `npx tsc --noEmit` | sạch |
| `npm run build` | xanh |
| `npm test` | **492 / 492 · 37 suite** · 0 fail · 0 skip · **hết nhiễu `Thiếu SENTRY_DSN`** |
| `npm run test:backup` | **20 / 20** |
| `npx prisma validate` / `generate` | hợp lệ / sinh client 7.8.0 |

**Backend E2E KHÔNG chạy** — không có `DATABASE_URL` dùng-một-lần được duyệt.
Không chạm PostgreSQL cổng 5432, không chạy migration, không chạm production.
