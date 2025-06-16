# Öğrenci Ödev Takip Sistemi (React + Vite + Tailwind + Supabase)

## Uygulama Amacı
Öğrencilerin ödev programlarını kolayca oluşturmak, haftalık olarak günlere göre ödev atamak, kitap ve öğrenci yönetimi yapmak ve tüm bu işlemleri modern, mobil uyumlu bir arayüzle gerçekleştirmek.

## Temel Özellikler
- **Kullanıcı Girişi:** Supabase ile e-posta tabanlı kimlik doğrulama (login/register/logout).
- **Öğrenci Yönetimi:** Öğrenci ekleme, listeleme, detay görüntüleme, silme ve güncelleme.
- **Kitap Yönetimi:** Kitap ekleme, listeleme, silme ve güncelleme.
- **Program Oluşturma:**
  - Haftanın günlerine göre ödev programı oluşturma.
  - Her gün için bir veya birden fazla kitap ve sayfa aralığı (veya not) ile ödev ekleme.
  - İsteğe bağlı olarak saatli program (her ödev için saat belirleme) veya saatsiz program.
- **Ödev Atama:**
  - Her gün için birden fazla ödev atanabilir.
  - Ödevler kitap, sayfa aralığı/not ve (varsa) saat içerir.
- **Program Detayları:**
  - Oluşturulan programın detaylarını ve ödev listesini görüntüleme.
- **Responsive Tasarım:**
  - Mobil ve masaüstü için modern, kullanıcı dostu arayüz.
  - Mobilde sağ üstte hamburger menü ile Öğrenciler ve Kitaplar sayfalarına hızlı erişim.
- **Bildirimler:**
  - Başarılı ve hatalı işlemler için kullanıcıya toast bildirimleri.
- **Supabase Entegrasyonu:**
  - Tüm veri işlemleri (CRUD) Supabase üzerinden yapılır.

## Kullanılan Teknolojiler
- React (Vite ile)
- TypeScript
- Tailwind CSS
- Supabase (veritabanı ve kimlik doğrulama)
- React Router
- Framer Motion (animasyonlar)
- React Hot Toast (bildirimler)

## Sayfa ve Bileşenler
- **/auth/login:** Giriş ekranı
- **/auth/register:** Kayıt ekranı
- **/students:** Öğrenci listesi
- **/students/:id:** Öğrenci detay
- **/books:** Kitap listesi
- **/programs:** Program listesi
- **/programs/create:** Program oluşturma
- **/programs/:id:** Program detay
- **/dashboard:** Genel özet ve istatistikler

## Ekstra
- Tüm formlar ve listeler mobilde kolay kullanılacak şekilde optimize edilmiştir.
- Tüm ana işlemler (ekle, sil, güncelle) için kullanıcı dostu hata ve başarı mesajları gösterilir.
- Netlify ile ücretsiz ve hızlı deploy edilebilir.

---

