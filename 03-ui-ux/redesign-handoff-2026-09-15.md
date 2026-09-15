# Redesign handoff 2026-09-15

> Trang thai: Dang ap dung cho website public.
> Nguon Word: `03-ui-ux/references/y-tuong-thiet-ke-lai-website-thien-duc-2026-09-09.docx`.
> Pham vi: `thien-duc-website-frontend`; khong thay doi backend, admin, provider, deploy.

## Huong thiet ke

- Ten he: Contemporary Architectural Luxury.
- Cam giac: sang, am, editorial, kien truc la trong tam; tranh card day dac, shadow nang, gradient, glassmorphism va motif SaaS.
- Bang mau chinh:
  - Warm Ivory `#F6F4EF`
  - Charcoal `#292929`
  - Warm Grey `#B8B5AE`
  - Earth Brown `#8B735E`
  - Deep Olive `#485244`
- Typography:
  - Heading: Cormorant Garamond.
  - Body/menu: Manrope.

## Quyet dinh da ap dung

- Header public rut gon con 5 muc chinh: Trang chu, Gioi thieu, Du an, Tin tuc, Lien he.
- Cac route phu van duoc giu trong mobile navigation/footer; khong xoa route.
- Search tren header la icon link den trang tim kiem, khong con form inline chen vao thanh dieu huong.
- Trang chu theo thu tu: hero, facts xac thuc, gioi thieu/lĩnh vuc, du an noi bat, hop tac, tin tuc, lien he/dia chi.
- Hero dung anh that va overlay phang; khong gradient/radial/glass/shadow.
- Facts trang chu chi dung du lieu xac thuc: nam bat dau hoat dong tu ho so phap ly, so du an publish tu API, trang thai song ngu VI/EN.
- Featured projects hien toi da 4 du an that tu API, uu tien du an dang thi cong neu co; khong dung so mock tu file thiet ke.
- Footer va trang lien he chi hien thi phone/email/address chinh thuc; link dia chi dung Google Maps directions.
- Zalo test/unverified khong render trong shell/footer/contact.

## Luu y van hanh

- Khong dua cac so mockup 16+/20+/1000+/50+ vao noi dung public khi chua duoc xac minh.
- Moi noi dung project/news/banner van lay tu backend/CMS qua API hien co.
- Neu sau nay cong ty xac nhan kenh Zalo chinh thuc, cap nhat `src/config/site.ts` va them lai diem render co test rieng.
- Brief Fancy Tower/doc standalone ngoai pham vi CI/CD va khong duoc dung nhu thay doi trong batch nay.
