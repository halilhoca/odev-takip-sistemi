# 📚 Öğrenci Takip Sistemi - Kapsamlı Proje Dokümantasyonu

## 🎯 Proje Özeti
Bu proje, eğitmenler için kapsamlı bir öğrenci yönetim sistemidir. React, TypeScript, Tailwind CSS ve Supabase kullanılarak geliştirilmiş, modern, responsive ve kullanıcı dostu bir web uygulamasıdır. Sistem yerelde çalışacak şekilde tasarlanmış olup, tüm veriler Supabase üzerinde güvenli bir şekilde saklanmaktadır.

## 🏗️ Teknik Mimari

### 📦 Kullanılan Teknolojiler
- **Frontend Framework:** React 18 + TypeScript
- **Build Tool:** Vite 5.4.2
- **Styling:** Tailwind CSS 3.4.1
- **Database & Auth:** Supabase 2.39.7
- **State Management:** Zustand 4.5.2
- **Routing:** React Router DOM 6.22.3
- **UI/UX:** 
  - Framer Motion 11.0.8 (animasyonlar)
  - Lucide React 0.344.0 (ikonlar)
  - React Hot Toast 2.4.1 (bildirimler)
- **Charts:** Chart.js 4.5.0 + React Chart.js 2
- **PDF Generation:** jsPDF 3.0.1 + html2canvas 1.4.1
- **Dev Tools:** ESLint, PostCSS, Autoprefixer

### 🏗️ Proje Yapısı
```
src/
├── components/           # Yeniden kullanılabilir bileşenler
│   ├── assignments/     # Ödev yönetimi bileşenleri
│   ├── books/          # Kitap yönetimi bileşenleri
│   ├── dashboard/      # Dashboard bileşenleri
│   ├── layout/         # Layout bileşenleri
│   ├── programs/       # Program yönetimi bileşenleri
│   ├── students/       # Öğrenci yönetimi bileşenleri
│   └── ui/             # Temel UI bileşenleri
├── lib/                # Utility fonksiyonları
│   ├── supabase.ts     # Ana Supabase client
│   └── publicSupabase.ts # Public erişim client
├── pages/              # Sayfa bileşenleri
│   ├── auth/           # Kimlik doğrulama sayfaları
│   ├── books/          # Kitap yönetimi sayfaları
│   ├── programs/       # Program yönetimi sayfaları
│   ├── student/        # Öğrenci görünüm sayfaları
│   └── students/       # Öğrenci yönetimi sayfaları
├── store/              # State management
│   ├── authStore.ts    # Kimlik doğrulama state
│   ├── dataStore.ts    # Ana veri state
│   ├── languageStore.ts # Dil ayarları
│   └── themeStore.ts   # Tema ayarları
├── translations/       # Çok dil desteği
├── types/             # TypeScript tip tanımları
└── App.tsx            # Ana uygulama bileşeni
```

## 🗄️ Veritabanı Şeması

### 📊 Ana Tablolar

#### `students` - Öğrenci Bilgileri
```sql
CREATE TABLE students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  name TEXT NOT NULL,
  email TEXT,
  school TEXT,
  grade TEXT,
  phone TEXT,
  parent_name TEXT,
  parent_phone TEXT,
  field TEXT, -- Alan (sayısal, sözel vb.)
  created_at TIMESTAMPTZ DEFAULT now()
);
```

#### `books` - Kitap Bilgileri
```sql
CREATE TABLE books (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  title TEXT NOT NULL,
  author TEXT,
  is_story_book BOOLEAN DEFAULT FALSE, -- Hikaye kitabı işaretleme
  created_at TIMESTAMPTZ DEFAULT now()
);
```

#### `student_books` - Öğrenci-Kitap İlişkisi
```sql
CREATE TABLE student_books (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id),
  book_id UUID NOT NULL REFERENCES books(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(student_id, book_id)
);
```

#### `programs` - Eğitim Programları
```sql
CREATE TABLE programs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  title TEXT NOT NULL,
  is_scheduled BOOLEAN DEFAULT false, -- Saatli program
  created_at TIMESTAMPTZ DEFAULT now()
);
```

#### `assignments` - Ödevler
```sql
CREATE TABLE assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id UUID NOT NULL REFERENCES programs(id),
  student_id UUID NOT NULL REFERENCES students(id),
  book_id UUID NOT NULL REFERENCES books(id),
  page_start INTEGER NOT NULL,
  page_end INTEGER NOT NULL,
  day TEXT NOT NULL, -- Pazartesi, Salı vb.
  time TEXT, -- Saat bilgisi (opsiyonel)
  is_completed BOOLEAN DEFAULT false,
  correct_answers INTEGER DEFAULT 0, -- Doğru cevap sayısı
  wrong_answers INTEGER DEFAULT 0,   -- Yanlış cevap sayısı
  blank_answers INTEGER DEFAULT 0,   -- Boş cevap sayısı
  created_at TIMESTAMPTZ DEFAULT now()
);
```

#### `reading_status` - Okuma Durumu
```sql
CREATE TABLE reading_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id),
  book_id UUID NOT NULL REFERENCES books(id),
  is_read BOOLEAN DEFAULT FALSE,
  reading_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(student_id, book_id)
);
```

#### `coach_notes` - Koç Notları
```sql
CREATE TABLE coach_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id),
  coach_id UUID NOT NULL REFERENCES auth.users(id),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(student_id, coach_id)
);
```

### 🔒 Güvenlik (Row Level Security)
- **Authenticated Users:** Sadece kendi öğrenci, kitap ve programlarına erişim
- **Anonymous Users:** Sadece okuma erişimi (ödev tamamlama için)
- **Public Access:** Öğrenci raporları için özel politikalar

## 🎨 Ana Özellikler

### 👥 Öğrenci Yönetimi
- ✅ Öğrenci ekleme/düzenleme/silme
- ✅ Detaylı öğrenci bilgileri (okul, sınıf, alan, telefon, veli bilgileri)
- ✅ Öğrenciye kitap atama
- ✅ Öğrenci rapor linklerini paylaşma
- ✅ Koç notları yazma ve yönetme

### 📚 Kitap Yönetimi
- ✅ Kitap ekleme/düzenleme/silme
- ✅ Yazar bilgisi ekleme
- ✅ Hikaye kitabı işaretleme
- ✅ Kitapları öğrencilere atama
- ✅ Okunan kitapları işaretleme

### 📋 Program Yönetimi
- ✅ Haftalık ödev programları oluşturma
- ✅ Saatli/saatsiz program seçenekleri
- ✅ Günlere göre ödev atama
- ✅ Sadece öğrenciye atanmış kitaplardan seçim
- ✅ Sayfa aralığı belirleme

### 📊 Ödev Takibi
- ✅ Ödev tamamlama durumu takibi
- ✅ Real-time güncellemeler
- ✅ Soru istatistikleri (doğru/yanlış/boş)
- ✅ İlerleme raporları
- ✅ PDF rapor çıktısı

### 📈 İstatistikler ve Raporlar
- ✅ Öğrenci başarı oranları
- ✅ Günlük/haftalık istatistikler
- ✅ Görsel grafikler (Chart.js)
- ✅ PDF rapor oluşturma
- ✅ Öğrenci rapor sayfaları

## 🎯 Kullanıcı Rolleri

### 🧑‍🏫 Eğitmen (Authenticated User)
- Öğrenci, kitap, program yönetimi
- Ödev atama ve takibi
- İstatistik görüntüleme
- Rapor oluşturma

### 👨‍🎓 Öğrenci (Anonymous User)
- Kendi ödevlerini görüntüleme
- Ödev tamamlama durumunu güncelleme
- Soru istatistiklerini kaydetme
- Rapor görüntüleme

## 📱 Sayfalar ve Rotalar

### 🔐 Kimlik Doğrulama
- `/auth/login` - Giriş yapma
- `/auth/register` - Kayıt olma

### 🏠 Ana Sayfalar
- `/dashboard` - Anasayfa ve istatistikler
- `/students` - Öğrenci listesi
- `/students/:id` - Öğrenci detayları
- `/books` - Kitap listesi
- `/programs` - Program listesi
- `/programs/create` - Program oluşturma
- `/programs/:id` - Program detayları

### 👨‍🎓 Öğrenci Görünümü
- `/student/:id` - Öğrenci program görünümü (public)
- `/student/:id/report` - Öğrenci raporu (public)

## 🔧 Teknik Detaylar

### 🎨 UI/UX Özellikleri
- **Responsive Design:** Mobile-first yaklaşım
- **Dark/Light Theme:** Tema desteği
- **Multi-language:** Çok dil desteği altyapısı
- **Toast Notifications:** Kullanıcı geri bildirimleri
- **Loading States:** Yükleme durumu göstergeleri
- **Error Handling:** Kapsamlı hata yönetimi

### ⚡ Performans
- **Lazy Loading:** Sayfa bazlı kod bölünmesi
- **Real-time Updates:** Supabase realtime subscriptions
- **Optimistic Updates:** Hızlı UI güncellemeleri
- **Efficient Queries:** Optimizasyon edilmiş veritabanı sorguları

### 🔒 Güvenlik
- **Row Level Security:** Veritabanı seviyesinde güvenlik
- **JWT Authentication:** Güvenli kimlik doğrulama
- **HTTPS:** SSL sertifikası ile şifreli iletişim
- **Input Validation:** Girdi doğrulama ve sanitizasyon

## 🚀 Kurulum ve Çalıştırma

### 📋 Gereksinimler
- Node.js 18+
- npm veya yarn
- Supabase hesabı

### ⚙️ Kurulum Adımları
1. **Proje klonlama:**
   ```bash
   git clone <repository-url>
   cd odev-takip-sistemi
   ```

2. **Bağımlılıkları yükleme:**
   ```bash
   npm install
   ```

3. **Çevre değişkenleri:**
   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Veritabanı migrasyonları:**
   ```bash
   npx supabase db push
   ```

5. **Geliştirme sunucusu:**
   ```bash
   npm run dev
   ```

### 🏗️ Build ve Deploy
```bash
npm run build
npm run preview
```

## 📊 Veritabanı Görünümleri (Views)

### `student_question_stats` - Öğrenci Soru İstatistikleri
```sql
CREATE VIEW student_question_stats AS
SELECT 
    s.id as student_id,
    s.name as student_name,
    p.title as program_title,
    b.title as book_title,
    a.correct_answers,
    a.wrong_answers,
    a.blank_answers,
    (a.correct_answers + a.wrong_answers + a.blank_answers) as total_questions,
    ROUND((a.correct_answers::float / 
           (a.correct_answers + a.wrong_answers + a.blank_answers)) * 100, 2) as success_rate
FROM students s
JOIN assignments a ON s.id = a.student_id
JOIN programs p ON a.program_id = p.id
JOIN books b ON a.book_id = b.id;
```

### `daily_question_stats` - Günlük İstatistikler
```sql
CREATE VIEW daily_question_stats AS
SELECT 
    s.name as student_name,
    a.day,
    SUM(a.correct_answers) as daily_correct,
    SUM(a.wrong_answers) as daily_wrong,
    SUM(a.blank_answers) as daily_blank,
    SUM(a.correct_answers + a.wrong_answers + a.blank_answers) as daily_total
FROM students s
JOIN assignments a ON s.id = a.student_id
GROUP BY s.id, s.name, a.day;
```

## 🔄 State Management (Zustand)

### `authStore` - Kimlik Doğrulama
- Kullanıcı bilgileri
- Giriş/çıkış işlemleri
- Session yönetimi

### `dataStore` - Ana Veri
- Öğrenci, kitap, program CRUD işlemleri
- Loading states
- Error handling
- Real-time güncellemeler

### `themeStore` - Tema Yönetimi
- Dark/light mode
- Kullanıcı tercihleri

### `languageStore` - Dil Ayarları
- Çok dil desteği altyapısı

## 📱 Mobile Responsiveness

### 📏 Breakpoints
- **Mobile:** 0-640px
- **Tablet:** 641-1024px
- **Desktop:** 1025px+

### 🎯 Mobile Features
- Hamburger menü
- Touch-friendly interfaces
- Optimized forms
- Swipe gestures
- Mobile-first design

## 🎨 Design System

### 🎨 Renk Paleti
- **Primary:** Blue tones
- **Secondary:** Green tones
- **Accent:** Orange tones
- **Neutral:** Gray scale

### 📝 Typography
- **Headings:** Inter font family
- **Body:** System font stack
- **Code:** Monospace

### 🔲 Components
- Button variants
- Input fields
- Cards
- Modals
- Forms

## 🔧 Özelleştirme ve Geliştirme

### 🎯 Yeni Özellik Ekleme
1. Component oluşturma
2. API endpoints tanımlama
3. Store güncellemeleri
4. Route ekleme
5. Test yazma

### 🗄️ Veritabanı Değişiklikleri
1. Migration dosyası oluşturma
2. RLS policy güncelleme
3. TypeScript tiplerini güncelleme
4. API fonksiyonlarını güncelleme

### 🎨 UI Değişiklikleri
1. Tailwind sınıfları
2. Component styling
3. Responsive design
4. Theme variables

## 📚 API Dokümantasyonu

### 🔐 Authentication
- `signIn(email, password)` - Giriş yapma
- `signUp(email, password)` - Kayıt olma
- `signOut()` - Çıkış yapma
- `getCurrentUser()` - Mevcut kullanıcı

### 👥 Students
- `getStudents(userId)` - Öğrenci listesi
- `createStudent(userData)` - Öğrenci oluşturma
- `updateStudent(id, userData)` - Öğrenci güncelleme
- `deleteStudent(id)` - Öğrenci silme

### 📚 Books
- `getBooks(userId)` - Kitap listesi
- `createBook(userData)` - Kitap oluşturma
- `assignBookToStudent(studentId, bookId)` - Kitap atama
- `deleteBook(id)` - Kitap silme

### 📋 Programs
- `getPrograms(userId)` - Program listesi
- `createProgram(userData)` - Program oluşturma
- `createAssignment(assignmentData)` - Ödev oluşturma
- `deleteProgram(id)` - Program silme

### 📊 Statistics
- `getStats(userId)` - Genel istatistikler
- `getRecentPrograms(userId)` - Son programlar
- `getQuestionStats(studentId)` - Soru istatistikleri

## 🔍 Troubleshooting

### ❗ Sık Karşılaşılan Problemler
1. **Supabase Bağlantı Hatası**
   - Çevre değişkenlerini kontrol edin
   - RLS politikalarını kontrol edin

2. **Build Hatası**
   - Node.js versiyonunu kontrol edin
   - Dependencies güncel mi kontrol edin

3. **Mobile Görünüm Sorunları**
   - Responsive breakpoints kontrol edin
   - Touch events test edin

## 🚀 Production Deployment

### 🌐 Netlify
```toml
[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

### ⚙️ Environment Variables
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

## 🎯 Gelecek Özellikler
- [ ] Bulk operations
- [ ] Advanced reporting
- [ ] Email notifications
- [ ] Calendar integration
- [ ] Mobile app
- [ ] Advanced analytics

## 📞 Destek ve İletişim
Bu proje yerelde çalışacak şekilde tasarlanmıştır. Tüm veriler güvenli bir şekilde Supabase üzerinde saklanmaktadır ve sistem tam otomatik olarak çalışmaktadır.

---

