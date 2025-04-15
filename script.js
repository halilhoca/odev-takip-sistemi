// ****** BURAYA FIREBASE'DEN KOPYALADIĞINIZ firebaseConfig NESNESİNİ YAPIŞTIRIN ******
const firebaseConfig = {
    apiKey: "AIzaSyCpFOqqRlSzOxpQmxukcU3D0QC2L1WY-pA",
    authDomain: "eduflowapp-e2d9c.firebaseapp.com",
    projectId: "eduflowapp-e2d9c",
    storageBucket: "eduflowapp-e2d9c.firebasestorage.app",
    messagingSenderId: "760963428335",
    appId: "1:760963428335:web:763900322a20bf6ed4101a"
};
// Firebase'i Başlat
firebase.initializeApp(firebaseConfig);

// Firebase servislerine kolay erişim için değişkenler
const auth = firebase.auth();
const db = firebase.firestore();

// --- DOM Elements (Değişiklik Yok) ---
const teacherLogin = document.getElementById('teacher-login');
const teacherDashboard = document.getElementById('teacher-dashboard');
const studentView = document.getElementById('student-view');
const emailInput = document.getElementById('email'); // Eklendi
const passwordInput = document.getElementById('password');
const loginBtn = document.getElementById('login-btn');
const logoutBtn = document.getElementById('logout-btn');
const backToLoginStudentBtn = document.getElementById('back-to-login-student');
const togglePasswordBtn = document.getElementById('toggle-password');
const toggleThemeLoginBtn = document.getElementById('toggle-theme-login');
const toggleThemeBtn = document.getElementById('toggle-theme');
const toggleThemeStudentBtn = document.getElementById('toggle-theme-student');
const navLinks = document.querySelectorAll('.nav-link');
const pageTitle = document.getElementById('page-title');
const tabContents = document.querySelectorAll('.tab-content');
const programDetailModal = document.getElementById('program-detail-modal');
const closeModal = document.getElementById('close-modal');
const closeModalBtn = document.getElementById('close-modal-btn');
const copyLinkBtn = document.getElementById('copy-link-btn');
const confirmDeleteModal = document.getElementById('confirm-delete-modal');
const cancelDelete = document.getElementById('cancel-delete');
const confirmDelete = document.getElementById('confirm-delete');
const deleteMessage = document.getElementById('delete-message');
const deleteWarning = document.getElementById('delete-warning');
const toastElement = document.getElementById('toast');
const toastMessage = document.getElementById('toast-message');
const openSidebarBtn = document.getElementById('open-sidebar');
const closeSidebarBtn = document.getElementById('close-sidebar');
const sidebar = document.getElementById('sidebar');
const teacherEmailDisplay = document.getElementById('teacher-email-display'); // Sidebar için eklendi
const studentViewContent = document.getElementById('student-view-content'); // Öğrenci görünümü içeriği için
const generateModalQrBtn = document.getElementById('generate-modal-qr-btn'); // Modal QR butonu
const modalQrContainer = document.getElementById('modal-qr-container'); // Modal QR alanı
const modalQrcodeDiv = document.getElementById('modal-qrcode'); // Modal QR resmi
const closeModalQrBtn = document.getElementById('close-modal-qr-btn'); // Modal QR kapat butonu


// --- App state (localStorage yerine Firebase'den dolacak) ---
let students = [];
let books = [];
let programs = [];
let activities = [];
let currentUser = null; // Giriş yapmış kullanıcıyı tutar
let currentProgramId = null; // Modal için
let deleteCallback = null;
let deleteItemId = null;

// Gerçek zamanlı dinleyici referansları (kapatmak için)
let unsubscribeStudents = null;
let unsubscribeBooks = null;
let unsubscribePrograms = null;
let unsubscribeActivities = null;

// Base application URL
const baseUrl = window.location.href.split(/[?#]/)[0];
const DAYS_OF_WEEK = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar'];

// --- Initialize App ---
document.addEventListener('DOMContentLoaded', initialize);

function initialize() {
    initDarkMode();
    setRgbVariables();
    setupEventListeners();

    // Check URL parameters for student view FIRST
    const urlParams = new URLSearchParams(window.location.search);
    const programIdParam = urlParams.get('program');
    const studentIdParam = urlParams.get('student'); // Bu parametre artık daha az önemli, program ID öncelikli
    const importDataParam = urlParams.get('data'); // Bu parametre artık çalışmaz (Firebase ile)

    if (programIdParam) {
        teacherLogin.classList.add('hidden');
        teacherDashboard.classList.add('hidden');
        studentView.classList.remove('hidden');
        showStudentView(programIdParam); // Direkt öğrenci görünümünü yükle
    } else {
         // Firebase Auth durumunu dinle
         auth.onAuthStateChanged(user => {
             if (user) {
                 // Kullanıcı giriş yapmış
                 currentUser = user;
                 console.log("Kullanıcı giriş yapmış:", currentUser.uid);
                 if(teacherEmailDisplay) teacherEmailDisplay.textContent = currentUser.email; // E-postayı göster
                 teacherLogin.classList.add('hidden');
                 studentView.classList.add('hidden'); // Öğrenci görünümünü gizle (giriş yapmışsa)
                 teacherDashboard.classList.remove('hidden');
                 loadInitialDataFromFirebase(); // Verileri yükle ve dinleyicileri başlat
             } else {
                 // Kullanıcı çıkış yapmış veya hiç giriş yapmamış
                 currentUser = null;
                 console.log("Kullanıcı giriş yapmamış.");
                 teacherDashboard.classList.add('hidden');
                 studentView.classList.add('hidden'); // Öğrenci görünümünü de gizle
                 teacherLogin.classList.remove('hidden');
                 // Aktif dinleyicileri durdur
                 detachRealtimeListeners();
             }
         });
    }

     // // Firestore bağlantı durumunu izle (opsiyonel - ŞİMDİLİK DEVRE DIŞI BIRAKILDI, invalid-argument hatası alınıyordu)
     // db.collection('__dummy__').onSnapshot(() => {
     //     if(firebaseStatusSpan) firebaseStatusSpan.textContent = 'Bağlı';
     //     if(firebaseStatusSpan) firebaseStatusSpan.classList.remove('text-red-600', 'dark:text-red-400');
     //     if(firebaseStatusSpan) firebaseStatusSpan.classList.add('text-green-600', 'dark:text-green-400');
     // }, error => {
     //     console.warn("Firestore bağlantı sorunu:", error.code);
     //     if(firebaseStatusSpan) firebaseStatusSpan.textContent = 'Bağlantı Sorunu';
     //      if(firebaseStatusSpan) firebaseStatusSpan.classList.remove('text-green-600', 'dark:text-green-400');
     //     if(firebaseStatusSpan) firebaseStatusSpan.classList.add('text-red-600', 'dark:text-red-400');
     //     showToast("Veritabanı bağlantısında sorun var.", "warning");
     // });
}

// --- Firebase Realtime Data Loading ---

function loadInitialDataFromFirebase() {
     // Başlangıçta UI'yı temizle/yükleniyor göster
     students = []; books = []; programs = []; activities = [];
     showLoadingPlaceholders(); // Listelerde "Yükleniyor..." göster

     // Mevcut dinleyicileri durdur (varsa)
     detachRealtimeListeners();

     // Yeni dinleyicileri kur
     setupRealtimeListeners();
}

function setupRealtimeListeners() {
    if (!auth.currentUser) return; // Giriş yapılmamışsa kurma
    console.log("Gerçek zamanlı dinleyiciler kuruluyor...");

    // Öğrenciler
    unsubscribeStudents = db.collection('students').orderBy('name')
        // DÜZELTİLDİ: Değişken adı ('students') string olarak gönderiliyor
        .onSnapshot(handleSnapshot('students', refreshStudentsList, 'Öğrenci'), handleSnapshotError("Öğrenci"));

    // Kitaplar
    unsubscribeBooks = db.collection('books').orderBy('title')
         // DÜZELTİLDİ: Değişken adı ('books') string olarak gönderiliyor
        .onSnapshot(handleSnapshot('books', refreshBooksList, 'Kitap'), handleSnapshotError("Kitap"));

    // Programlar
    unsubscribePrograms = db.collection('programs').orderBy('date', 'desc')
         // DÜZELTİLDİ: Değişken adı ('programs') string olarak gönderiliyor
        .onSnapshot(handleSnapshot('programs', refreshProgramsRelatedUI, 'Program'), handleSnapshotError("Program"));

    // Aktiviteler
    unsubscribeActivities = db.collection('activities').orderBy('date', 'desc').limit(20)
         // DÜZELTİLDİ: Değişken adı ('activities') string olarak gönderiliyor
        .onSnapshot(handleSnapshot('activities', refreshRecentActivities, 'Aktivite'), handleSnapshotError("Aktivite"));
}

// Genel Snapshot İşleyici
// DÜZELTİLDİ: Fonksiyon artık hedef dizinin ADINI (string) alıyor
function handleSnapshot(targetArrayName, uiRefreshCallback, dataType) {
    return (snapshot) => {
        console.log(`${dataType} snapshot alındı. Değişiklik sayısı: ${snapshot.docChanges().length}`);
        try {
            // Global değişkeni ADINI kullanarak güncelle
            window[targetArrayName] = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            // Güncellenen global değişkeni kontrol et (ADINI kullanarak)
            console.log(`Global ${targetArrayName} güncellendi:`, window[targetArrayName]); // Artık hata vermemeli

            if (uiRefreshCallback) {
                // console.log(`${dataType} için UI refresh callback (${uiRefreshCallback.name}) çağrılıyor.`); // İsteğe bağlı detaylı log
                uiRefreshCallback(); // İlgili UI yenileme fonksiyonunu çağır
            } else {
                 console.warn(`${dataType} için UI refresh callback bulunamadı.`);
            }
            updateDashboardCounts(); // Her veri değişiminde dashboard sayılarını güncelle
        } catch (error) {
            console.error(`${dataType} snapshot işlenirken hata:`, error);
            showToast(`${dataType} verileri işlenirken hata oluştu.`, 'error');
        }
    };
}
// Genel Hata İşleyici
function handleSnapshotError(dataType) {
     return (error) => {
         console.error(`${dataType} dinleme hatası:`, error);
         showToast(`${dataType} verileri yüklenirken hata.`, "error");
         // Gelişmiş hata ayıklama: Hangi koleksiyonda sorun olduğunu göster
         if (error.code === 'permission-denied') {
            showToast(`${dataType} okuma izni yok. Firestore kurallarını kontrol edin.`, 'error');
         }
     };
 }

 // Programlar güncellendiğinde ilgili TÜM UI'ları yenileyen fonksiyon
 function refreshProgramsRelatedUI() {
      refreshProgramsList();
      refreshRecentPrograms();
      refreshCompletionRates();
      refreshAssignmentCompletionList(document.getElementById('progress-student-filter')?.value || '');
      refreshProgressCharts(document.getElementById('progress-student-filter')?.value || '');

      // Açık modal varsa güncelle
      if (!programDetailModal.classList.contains('hidden') && currentProgramId) {
          const openProgram = programs.find(p => p.id === currentProgramId);
          if (openProgram) {
              viewProgram(currentProgramId); // Modal içeriğini yeniden oluştur
          } else {
              programDetailModal.classList.add('hidden');
              showToast("Görüntülenen program silindi.", "info");
          }
      }
      // Açık öğrenci görünümü varsa güncelle
       if (!studentView.classList.contains('hidden')) {
           const urlParams = new URLSearchParams(window.location.search);
           const programIdParam = urlParams.get('program');
            if (programIdParam) {
                const openProgram = programs.find(p => p.id === programIdParam);
                if (openProgram) {
                    showStudentView(programIdParam); // İçeriği yeniden oluştur
                } else {
                     showStudentView(null); // Hata durumunu göster
                 }
            }
       }
  }


function detachRealtimeListeners() {
    console.log("Gerçek zamanlı dinleyiciler durduruluyor...");
    if (unsubscribeStudents) unsubscribeStudents();
    if (unsubscribeBooks) unsubscribeBooks();
    if (unsubscribePrograms) unsubscribePrograms();
    if (unsubscribeActivities) unsubscribeActivities();
    unsubscribeStudents = null;
    unsubscribeBooks = null;
    unsubscribePrograms = null;
    unsubscribeActivities = null;
}

function showLoadingPlaceholders() {
     const studentsListEl = document.getElementById('students-list');
     if (studentsListEl) studentsListEl.innerHTML = `<tr><td colspan="5" class="text-center py-4 text-gray-500 dark:text-gray-400"><div class="loader mx-auto"></div></td></tr>`;
     const booksListEl = document.getElementById('books-list');
     if (booksListEl) booksListEl.innerHTML = `<tr><td colspan="4" class="text-center py-4 text-gray-500 dark:text-gray-400"><div class="loader mx-auto"></div></td></tr>`;
     const programsListEl = document.getElementById('programs-list');
     if (programsListEl) programsListEl.innerHTML = `<tr><td colspan="5" class="text-center py-4 text-gray-500 dark:text-gray-400"><div class="loader mx-auto"></div></td></tr>`;
     const recentProgramsEl = document.getElementById('recent-programs');
     if (recentProgramsEl) recentProgramsEl.innerHTML = `<tr><td colspan="5" class="text-center py-4 text-gray-500 dark:text-gray-400"><div class="loader mx-auto"></div></td></tr>`;
     const completionRatesEl = document.getElementById('completion-rates-container');
     if (completionRatesEl) completionRatesEl.innerHTML = `<div class="text-center py-8 text-gray-500 dark:text-gray-400"><div class="loader mx-auto"></div></div>`;
     const recentActivitiesEl = document.getElementById('recent-activities');
     if (recentActivitiesEl) recentActivitiesEl.innerHTML = `<div class="text-center py-8 text-gray-500 dark:text-gray-400"><div class="loader mx-auto"></div></div>`;
     const progressChartsEl = document.getElementById('progress-charts-container');
     if (progressChartsEl) progressChartsEl.innerHTML = `<div class="text-center py-8 text-gray-500 dark:text-gray-400 lg:col-span-2"><div class="loader mx-auto"></div></div>`;
     const assignmentCompletionEl = document.getElementById('assignment-completion-list');
     if (assignmentCompletionEl) assignmentCompletionEl.innerHTML = `<div class="text-center py-8 text-gray-500 dark:text-gray-400"><div class="loader mx-auto"></div></div>`;
     // Select'leri de temizle/yükleniyor göster
     const programStudentEl = document.getElementById('program-student');
     if (programStudentEl) programStudentEl.innerHTML = '<option>Yükleniyor...</option>';
     const bookStudentsEl = document.getElementById('book-students');
     if (bookStudentsEl) bookStudentsEl.innerHTML = '<option>Yükleniyor...</option>';
     const progressFilterEl = document.getElementById('progress-student-filter');
     if (progressFilterEl) progressFilterEl.innerHTML = '<option>Yükleniyor...</option>';
}


// --- Event Listeners Setup ---
function setupEventListeners() {
    // Modal kapatma butonları için listenerlar
const closeModalButtonIcon = document.getElementById('close-modal'); // Sağ üstteki çarpı
const closeModalButtonBottom = document.getElementById('close-modal-btn'); // Alttaki "Kapat" butonu
const modalElement = document.getElementById('program-detail-modal'); // Modalın kendisi

if (closeModalButtonIcon && modalElement) {
closeModalButtonIcon.addEventListener('click', () => modalElement.classList.add('hidden'));
console.log("Listener eklendi: #close-modal"); // Test için log
} else {
console.error("Modal kapatma butonu (çarpı) veya modal elementi bulunamadı!");
}

if (closeModalButtonBottom && modalElement) {
closeModalButtonBottom.addEventListener('click', () => modalElement.classList.add('hidden'));
console.log("Listener eklendi: #close-modal-btn"); // Test için log
} else {
console.error("Modal kapatma butonu (alttaki) veya modal elementi bulunamadı!");
}
    loginBtn?.addEventListener('click', handleLogin);
    passwordInput?.addEventListener('keypress', (e) => { if (e.key === 'Enter') handleLogin(); });
    logoutBtn?.addEventListener('click', handleLogout);
    backToLoginStudentBtn?.addEventListener('click', () => { window.location.href = baseUrl; }); // Ana sayfaya dön
    togglePasswordBtn?.addEventListener('click', () => {
        const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
        passwordInput.setAttribute('type', type);
        togglePasswordBtn.querySelector('i').classList.toggle('fa-eye');
        togglePasswordBtn.querySelector('i').classList.toggle('fa-eye-slash');
    });
    toggleThemeLoginBtn?.addEventListener('click', toggleTheme);
    toggleThemeBtn?.addEventListener('click', toggleTheme);
    toggleThemeStudentBtn?.addEventListener('click', toggleTheme);
    openSidebarBtn?.addEventListener('click', () => { sidebar?.classList.remove('-translate-x-full'); });
    closeSidebarBtn?.addEventListener('click', () => { sidebar?.classList.add('-translate-x-full'); });
    document.addEventListener('click', (e) => {
         // Close sidebar if clicked outside on small screens
         if (sidebar && !sidebar.contains(e.target) && openSidebarBtn && !openSidebarBtn.contains(e.target) && window.innerWidth < 640) {
            sidebar.classList.add('-translate-x-full');
         }
         // Close modal if clicked on the background overlay
         if (programDetailModal && programDetailModal.contains(e.target) && e.target === programDetailModal) {
              programDetailModal.classList.add('hidden');
         }
         if (confirmDeleteModal && confirmDeleteModal.contains(e.target) && e.target === confirmDeleteModal) {
              confirmDeleteModal.classList.add('hidden');
         }
     });
    navLinks?.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const tabName = link.getAttribute('data-tab');
            switchTab(tabName);
            // Close sidebar on mobile after clicking a link
            if (window.innerWidth < 640) {
                sidebar?.classList.add('-translate-x-full');
            }
        });
     });
    // Dashboard quick buttons
    document.querySelectorAll('#dashboard-tab button[data-tab-link]')?.forEach(button => {
         button.addEventListener('click', (e) => {
             e.preventDefault();
             const tabName = button.getAttribute('data-tab-link');
             switchTab(tabName);
         });
     });
      // Dashboard recent programs link
     document.querySelectorAll('#dashboard-tab a[data-tab-link]')?.forEach(link => {
         link.addEventListener('click', (e) => {
             e.preventDefault();
             const tabName = link.getAttribute('data-tab-link');
             switchTab(tabName);
         });
     });

    document.getElementById('add-student-btn')?.addEventListener('click', addStudent);
    document.getElementById('add-book-btn')?.addEventListener('click', addBook);
    document.getElementById('create-program-btn')?.addEventListener('click', createProgram);
    document.getElementById('search-students')?.addEventListener('input', (e) => filterTable('students-list', e.target.value.toLowerCase(), [0, 1]));
    document.getElementById('search-books')?.addEventListener('input', (e) => filterTable('books-list', e.target.value.toLowerCase(), [0, 1]));
    document.getElementById('search-programs')?.addEventListener('input', (e) => filterTable('programs-list', e.target.value.toLowerCase(), [1, 2]));
    document.getElementById('program-student')?.addEventListener('change', (e) => {
const selectedStudentId = e.target.value;
console.log(`#program-student değişti. Yeni ID: ${selectedStudentId}`); // Log eklendi
// updateProgramBookSelects(selectedStudentId); // Bu satır muhtemelen gereksiz ama zararı yok
const weeklyScheduleDiv = document.getElementById('weekly-schedule');
if (selectedStudentId) {
weeklyScheduleDiv?.classList.remove('opacity-50', 'pointer-events-none');
populateWeekDays(selectedStudentId); // Öğrenciye göre kitapları yükle (doğru ID ile çağrılıyor mu?)
} else {
weeklyScheduleDiv?.classList.add('opacity-50', 'pointer-events-none');
if(weeklyScheduleDiv) weeklyScheduleDiv.innerHTML = ''; // Temizle
}
});
    document.querySelectorAll('input[name="program-type"]')?.forEach(radio => { radio.addEventListener('change', toggleTimeInputs); });
    document.getElementById('progress-student-filter')?.addEventListener('change', (e) => {
         refreshAssignmentCompletionList(e.target.value);
         refreshProgressCharts(e.target.value);
    });
    closeModal?.addEventListener('click', () => programDetailModal?.classList.add('hidden'));
    closeModalBtn?.addEventListener('click', () => programDetailModal?.classList.add('hidden'));
    copyLinkBtn?.addEventListener('click', copyProgramLink);
    // Modal QR Butonları
     generateModalQrBtn?.addEventListener('click', generateModalQRCode);
     closeModalQrBtn?.addEventListener('click', () => modalQrContainer?.classList.add('hidden'));
    cancelDelete?.addEventListener('click', () => confirmDeleteModal?.classList.add('hidden'));
    confirmDelete?.addEventListener('click', () => {
        if (deleteCallback && deleteItemId) {
            confirmDelete.disabled = true; // Silme sırasında butonu kilitle
            confirmDelete.innerHTML = '<div class="loader mx-auto !w-5 !h-5 border-2"></div>';
            deleteCallback(deleteItemId)
                 .catch(err => { // Hata durumunda da modalı kapat ve butonu eski haline getir
                    console.error("Silme işlemi başarısız:", err);
                    showToast("Silme işlemi sırasında hata oluştu.", "error");
                 })
                 .finally(() => { // Silme işlemi bitince (başarılı/başarısız)
                     confirmDeleteModal?.classList.add('hidden');
                     if(deleteWarning) {
                         deleteWarning.classList.add('hidden');
                         deleteWarning.textContent = '';
                     }
                     deleteCallback = null;
                     deleteItemId = null;
                     confirmDelete.disabled = false; // Butonu aç
                     confirmDelete.textContent = 'Sil';
                 });
         } else {
             confirmDeleteModal?.classList.add('hidden');
             if(deleteWarning) {
                 deleteWarning.classList.add('hidden');
                 deleteWarning.textContent = '';
             }
         }
    });
}

// --- Authentication ---
function handleLogin() {
    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();

    if (!email || !password) {
        showToast('Lütfen e-posta ve şifre girin', 'warning');
        return;
    }

    loginBtn.disabled = true;
    loginBtn.innerHTML = '<div class="loader mx-auto !border-2 !w-6 !h-6"></div>';

    auth.signInWithEmailAndPassword(email, password)
        .then((userCredential) => {
            console.log("Giriş başarılı (signInWithEmailAndPassword)");
        })
        .catch((error) => {
            console.error("Giriş Hatası:", error);
            if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
                 showToast('E-posta veya şifre hatalı', 'error');
             } else if (error.code === 'auth/invalid-email'){
                 showToast('Geçersiz e-posta formatı', 'error');
             } else {
                 showToast(`Giriş hatası: ${error.message}`, 'error');
             }
        })
        .finally(() => {
            loginBtn.disabled = false;
            loginBtn.textContent = 'Giriş Yap';
            if (passwordInput) passwordInput.value = ''; // Şifre alanını temizle
        });
}

function handleLogout() {
     logoutBtn.disabled = true;
     logoutBtn.innerHTML = '<i class="fas fa-spinner fa-spin w-5"></i><span class="ml-3">Çıkış Yapılıyor...</span>';
     auth.signOut().then(() => {
         console.log("Çıkış yapıldı (signOut)");
         showToast("Başarıyla çıkış yapıldı", "info");
     }).catch((error) => {
         console.error("Çıkış Hatası:", error);
         showToast(`Çıkış sırasında hata: ${error.message}`, 'error');
     }).finally(() => {
          logoutBtn.disabled = false;
          logoutBtn.innerHTML = '<i class="fas fa-sign-out-alt w-5"></i><span class="ml-3">Çıkış Yap</span>';
     });
 }


// --- Data Operations (Firebase) ---

function addStudent() {
    const nameInput = document.getElementById('student-name');
    const classInput = document.getElementById('student-class');
    const name = nameInput?.value.trim();
    const studentClass = classInput?.value.trim();
    const addBtn = document.getElementById('add-student-btn');

    if (!name) { showToast('Lütfen öğrenci adını girin', 'warning'); return; }
    if (!addBtn) return;

    addBtn.disabled = true;
    addBtn.innerHTML = '<div class="loader mx-auto !border-2 !w-5 !h-5"></div>';

    db.collection('students').add({
        name: name,
        class: studentClass || 'Belirtilmedi',
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
    })
    .then((docRef) => {
        showToast('Öğrenci başarıyla eklendi');
        if(nameInput) nameInput.value = '';
        if(classInput) classInput.value = '';
        addActivityToFirebase(`Yeni öğrenci eklendi: ${name} (${studentClass || 'Belirtilmedi'})`, 'success');
    })
    .catch((error) => {
        console.error("Öğrenci ekleme hatası: ", error);
        showToast(`Öğrenci eklenirken hata: ${error.message}`, 'error');
         if (error.code === 'permission-denied') {
            showToast('Öğrenci ekleme izniniz yok.', 'error');
         }
    })
    .finally(() => {
        addBtn.disabled = false;
        addBtn.innerHTML = '<i class="fas fa-plus mr-2"></i>Ekle';
    });
}

function addBook() {
    const titleInput = document.getElementById('book-title');
    const authorInput = document.getElementById('book-author');
    const studentSelect = document.getElementById('book-students');
    const title = titleInput?.value.trim();
    const author = authorInput?.value.trim();
    const selectedStudentIds = studentSelect ? Array.from(studentSelect.selectedOptions).map(option => option.value) : [];
    const addBtn = document.getElementById('add-book-btn');

    if (!title) { showToast('Lütfen kitap adını girin', 'warning'); return; }
    if (!addBtn) return;

    addBtn.disabled = true;
    addBtn.innerHTML = '<div class="loader mx-auto !border-2 !w-5 !h-5"></div>';

    db.collection('books').add({
        title: title,
        author: author || 'Yazar Yok',
        studentIds: selectedStudentIds,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
    })
    .then(() => {
        showToast('Kitap başarıyla eklendi');
        if(titleInput) titleInput.value = '';
        if(authorInput) authorInput.value = '';
        if(studentSelect) studentSelect.selectedIndex = -1;
         const studentNames = selectedStudentIds
             .map(id => students.find(s => s.id === id)?.name)
             .filter(Boolean).join(', ');
         const activityMsg = selectedStudentIds.length > 0
             ? `Yeni kitap: ${title}${author ? ' ('+author+')' : ''} (${studentNames})`
             : `Yeni kitap: ${title}${author ? ' ('+author+')' : ''} (Genel)`;
        addActivityToFirebase(activityMsg, 'success');
    })
    .catch((error) => {
        console.error("Kitap ekleme hatası: ", error);
        showToast(`Kitap eklenirken hata: ${error.message}`, 'error');
         if (error.code === 'permission-denied') {
            showToast('Kitap ekleme izniniz yok.', 'error');
         }
    })
    .finally(() => {
        addBtn.disabled = false;
        addBtn.innerHTML = '<i class="fas fa-plus mr-2"></i>Ekle';
    });
}

function createProgram() {
const studentSelect = document.getElementById('program-student');
const titleInput = document.getElementById('program-title');
const isTimed = document.querySelector('input[name="program-type"]:checked')?.value === 'timed';
const studentId = studentSelect?.value;
const title = titleInput?.value.trim();
const createBtn = document.getElementById('create-program-btn');

if (!studentId) { showToast('Lütfen bir öğrenci seçin', 'warning'); return; }
if (!title) { showToast('Lütfen program başlığı girin', 'warning'); return; }
if (!createBtn) return;

const weeklyScheduleContainer = document.getElementById('weekly-schedule');
if (!weeklyScheduleContainer) { showToast('Haftalık program alanı bulunamadı.', 'error'); return; }

// --- Öğrenci Adını Almadan Önce Loglama (Hata Ayıklama için) ---
console.log("createProgram: Program oluşturuluyor...");
console.log("  - Seçilen Student ID:", studentId);
console.log("  - Şu anki window.students:", window.students); // Güncel listeyi kontrol et

// DÜZELTME: Öğrenciyi window.students üzerinden bul ve varlığını kontrol et
const student = window.students?.find(s => s.id === studentId);

console.log("  - Bulunan Student Nesnesi:", student); // Bulunan öğrenciyi logla

// GÜVENLİK KONTROLÜ: Öğrenci bulunamadıysa hata ver ve çık
if (!student) {
showToast("Seçilen öğrenci bilgisi bulunamadı. Lütfen sayfayı yenileyip tekrar deneyin.", "error");
// Butonun kilidini açmak iyi olabilir:
// createBtn.disabled = false;
// createBtn.innerHTML = '<i class="fas fa-save mr-2"></i>Programı Oluştur';
return; // İşlemi durdur
}
// --- Öğrenci bulundu, devam et ---

const dayEntries = weeklyScheduleContainer.querySelectorAll('.card');
const schedule = [];
let totalAssignments = 0;
let invalidAssignmentFound = false;

dayEntries.forEach((dayEntry, index) => {
// ... (schedule oluşturma kısmı aynı kalır) ...
const assignments = [];
const assignmentElements = dayEntry.querySelectorAll('.assignment');
assignmentElements.forEach(assignmentEl => {
    const bookId = assignmentEl.querySelector('.book-select')?.value;
    const pages = assignmentEl.querySelector('.pages-input')?.value.trim();
    let startTime = null, endTime = null;
    if (isTimed) {
        startTime = assignmentEl.querySelector('.start-time-input')?.value || null;
        endTime = assignmentEl.querySelector('.end-time-input')?.value || null;
    }
    if (bookId && pages) {
        // DÜZELTME: Kitabı window.books üzerinden bulmak daha güvenli
        const studentBooks = getBooksForStudent(studentId); // Bu zaten window.books kullanmalı
        const book = studentBooks.find(b => b.id === bookId);
        const assignmentData = {
            bookId,
            bookTitle: book ? book.title : 'Kitap Bulunamadı', // Kitap adını da ekleyelim
            pages,
            completed: false,
            startTime: isTimed ? startTime : null,
            endTime: isTimed ? endTime : null
        };
        assignments.push(assignmentData);
        totalAssignments++;
    } else if (bookId || pages || (isTimed && (startTime || endTime))) {
        invalidAssignmentFound = true;
    }
});
schedule.push({ day: DAYS_OF_WEEK[index], assignments });
});


if (invalidAssignmentFound) {
showToast('Lütfen tüm ödev satırlarında hem Kitap hem de Sayfa alanlarını doldurun veya boş bırakın.', 'warning');
return;
}
if (totalAssignments === 0) { showToast('Programa en az bir geçerli ödev (Kitap + Sayfa) eklemelisiniz.', 'warning'); return; }

createBtn.disabled = true;
createBtn.innerHTML = '<div class="loader mx-auto !border-2 !w-5 !h-5"></div>';

// DÜZELTME: Student nesnesi bulunduğundan emin olduğumuz için doğrudan kullanabiliriz.
const newProgramData = {
studentId: studentId,
studentName: student.name, // Artık ternary operatöre gerek yok
title: title,
date: firebase.firestore.FieldValue.serverTimestamp(),
isTimed: isTimed,
schedule: schedule
};
console.log("Firestore'a gönderilecek Program Datası:", newProgramData); // Gönderilen veriyi logla

db.collection('programs').add(newProgramData)
.then((docRef) => {
     showToast('Program başarıyla oluşturuldu');
     addActivityToFirebase(`Yeni ${isTimed ? 'saatli' : 'saatsiz'} program: ${title} (${student.name})`, 'success'); // Doğru ismi logla
     // Formu temizle
     if(studentSelect) studentSelect.value = '';
     if(titleInput) titleInput.value = '';
      const untimedRadio = document.querySelector('input[name="program-type"][value="untimed"]');
      if (untimedRadio) untimedRadio.checked = true;
      toggleTimeInputs();
      if(weeklyScheduleContainer) {
         weeklyScheduleContainer.classList.add('opacity-50', 'pointer-events-none');
         weeklyScheduleContainer.innerHTML = '';
      }
     // DÜZELTME: viewProgram'ı çağırmadan önce küçük bir gecikme ekleyebiliriz (opsiyonel ama güvenli)
     setTimeout(() => {
          viewProgram(docRef.id); // ID'yi alıp göster
     }, 150); // 150ms bekle (onSnapshot'ın window.programs'ı güncellemesine zaman tanır)

})
.catch(error => {
     console.error("Program oluşturma hatası:", error);
     showToast(`Program oluşturulurken hata: ${error.message}`, 'error');
     if (error.code === 'permission-denied') {
        showToast('Program oluşturma izniniz yok.', 'error');
     }
 })
.finally(() => {
     // Buton durumunu .then içinden sonra değil, finally içinde ayarla
     createBtn.disabled = false;
     createBtn.innerHTML = '<i class="fas fa-save mr-2"></i>Programı Oluştur';
 });
}


// Silme işlemleri şimdi Promise döndürüyor (confirmDelete'in finally bloğu için)
function deleteStudent(studentIdToDelete) {
     console.log(`Öğrenci siliniyor: ${studentIdToDelete}`);
     const studentDocRef = db.collection('students').doc(studentIdToDelete);
     const studentName = students.find(s => s.id === studentIdToDelete)?.name || 'Bilinmeyen Öğrenci';

     // Öğrenciyi silme Promise'i
     const deleteStudentPromise = studentDocRef.delete();

     // İlgili programları silme Promise'i
     const deleteProgramsPromise = db.collection('programs').where('studentId', '==', studentIdToDelete).get()
         .then(snapshot => {
             if (snapshot.empty) {
                 return Promise.resolve(); // Silinecek program yok
             }
             const batch = db.batch();
             let count = 0;
             snapshot.forEach(doc => {
                 batch.delete(doc.ref);
                 count++;
             });
             console.log(`${count} program silinmek üzere işaretlendi.`);
             return batch.commit();
         });

      // Tüm silme işlemleri bittiğinde
      return Promise.all([deleteStudentPromise, deleteProgramsPromise])
         .then(() => {
             showToast(`Öğrenci "${studentName}" ve ilgili programları silindi.`);
             addActivityToFirebase(`Öğrenci silindi: ${studentName} (programlarıyla)`, 'warning');
         })
         .catch((error) => {
             console.error("Öğrenci veya program silme hatası: ", error);
             showToast('Öğrenci veya programları silinirken hata oluştu', 'error');
              if (error.code === 'permission-denied') {
                 showToast('Silme işlemi için izniniz yok.', 'error');
              }
              throw error; // Hatayı yukarıya ilet ki finally çalışsın
         });
 }

 function deleteBook(bookIdToDelete) {
      console.log(`Kitap siliniyor: ${bookIdToDelete}`);
      const bookDocRef = db.collection('books').doc(bookIdToDelete);
      const bookTitle = books.find(b => b.id === bookIdToDelete)?.title || 'Bilinmeyen Kitap';

      return bookDocRef.delete()
          .then(() => {
              showToast(`Kitap "${bookTitle}" silindi.`);
              addActivityToFirebase(`Kitap silindi: ${bookTitle}`, 'warning');
          })
          .catch((error) => {
              console.error("Kitap silme hatası: ", error);
              showToast('Kitap silinirken hata oluştu', 'error');
               if (error.code === 'permission-denied') {
                  showToast('Kitap silme izniniz yok.', 'error');
               }
               throw error;
          });
  }

  function deleteProgram(programIdToDelete) {
       console.log(`Program siliniyor: ${programIdToDelete}`);
       const programDocRef = db.collection('programs').doc(programIdToDelete);
       const programInfo = programs.find(p => p.id === programIdToDelete);
       const infoText = programInfo ? `${programInfo.title} - ${programInfo.studentName}` : 'Bilinmeyen Program';

       return programDocRef.delete()
           .then(() => {
               showToast('Program silindi.');
               addActivityToFirebase(`Program silindi: ${infoText}`, 'warning');
           })
           .catch((error) => {
               console.error("Program silme hatası: ", error);
               showToast('Program silinirken hata oluştu', 'error');
                if (error.code === 'permission-denied') {
                   showToast('Program silme izniniz yok.', 'error');
                }
                throw error;
           });
   }


// --- Data Update (Assignment Completion) ---
function toggleAssignmentCompletionFirebase(checkboxElement, programId) {
// --- Başlangıç Kontrolleri ---
if (!programId) {
console.error("toggleAssignmentCompletionFirebase çağrıldı ancak programId eksik!");
showToast("Program ID eksik, işlem yapılamadı.", "error");
return;
}
if (!checkboxElement) {
console.error("toggleAssignmentCompletionFirebase çağrıldı ancak checkboxElement eksik!");
 showToast("İşaretlenecek öğe bulunamadı.", "error");
return;
}

const day = checkboxElement.getAttribute('data-day');
const index = parseInt(checkboxElement.getAttribute('data-index'));
if (day === null || isNaN(index)) {
console.error("Checkbox data attributes missing or invalid", checkboxElement);
showToast("Öğe bilgileri eksik, işlem yapılamadı.", "error");
return;
}

// --- START: Optimistic UI Update (İyimser Arayüz Güncellemesi) ---
const isCompleted = !checkboxElement.classList.contains('checked'); // Yeni (beklenen) durum
const wasCompleted = !isCompleted; // Önceki durum (hata durumunda geri almak için)

console.log(`Optimistic UI: Checkbox ${day}-${index} durumu ${isCompleted ? 'checked' : 'unchecked'} olarak ayarlanıyor.`);

// Checkbox'ın görünümünü HEMEN değiştir
checkboxElement.classList.toggle('checked', isCompleted);
checkboxElement.setAttribute('aria-checked', isCompleted);

// İlgili metin elemanını ve liste öğesini bul
const listItem = checkboxElement.closest('li');
let textElement = null;
if(listItem) {
// Liste öğesi içindeki metin span'larını bulmaya çalışalım (checkbox hariç)
const spans = listItem.querySelectorAll('span');
 spans.forEach(span => {
      if (!checkboxElement.contains(span) && !span.querySelector('i')) { // Checkbox veya ikon içermeyen span
          textElement = span;
          return;
      }
  });
 // Eğer yukarıdaki bulamazsa, daha genel bir seçici deneyebiliriz
 if (!textElement) {
     textElement = listItem.querySelector('span:not(:has(i))'); // İkon içermeyen ilk span
 }
 // Veya en basit (ama en az sağlam) yol:
 // textElement = checkboxElement.nextElementSibling;
}

// Metin stilini güncelle
if (textElement) {
console.log("Optimistic UI: Metin stili güncelleniyor.", textElement);
textElement.classList.toggle('line-through', isCompleted);
textElement.classList.toggle('text-gray-500', isCompleted);
textElement.classList.toggle('dark:text-gray-400', isCompleted);
textElement.classList.toggle('text-gray-700', !isCompleted);
textElement.classList.toggle('dark:text-gray-200', !isCompleted);
} else {
 console.warn("Optimistic UI: Metin elementi bulunamadı.");
}

// Liste öğesi arkaplanını güncelle
if (listItem) {
 console.log("Optimistic UI: Liste arkaplanı güncelleniyor.", listItem);
 listItem.classList.toggle('bg-green-50', isCompleted);
 listItem.classList.toggle('dark:bg-green-900/30', isCompleted);
 listItem.classList.toggle('bg-gray-50', !isCompleted);
 listItem.classList.toggle('dark:bg-gray-700', !isCompleted);
} else {
 console.warn("Optimistic UI: Liste öğesi (li) bulunamadı.");
}
// --- END: Optimistic UI Update ---


// Geçici olarak etkileşimi engelle
checkboxElement.style.opacity = '0.5';
checkboxElement.style.pointerEvents = 'none';

const programDocRef = db.collection('programs').doc(programId);

// Firestore get/update işlemi
programDocRef.get().then(doc => {
if (!doc.exists) throw new Error("Program bulunamadı!");
const programData = doc.data();
// Deep copy yaparken schedule'ın varlığını kontrol et
const newSchedule = programData.schedule ? JSON.parse(JSON.stringify(programData.schedule)) : [];
const daySchedule = newSchedule.find(d => d.day === day);

if (daySchedule && daySchedule.assignments && daySchedule.assignments[index] !== undefined) {
     const assignment = daySchedule.assignments[index];
     assignment.completed = isCompleted; // Yeni durumu ata
     console.log(`Firestore Update: ${day}-${index} durumu ${isCompleted} olarak ayarlanıyor.`);
     return programDocRef.update({ schedule: newSchedule });
} else {
     console.error("Güncellenecek ödev bulunamadı (Firestore get içinde). Day:", day, "Index:", index, "Schedule:", newSchedule);
     throw new Error("Ödev bulunamadı veya program yapısı bozuk.");
}
})
.then(() => {
console.log("Firestore Update Başarılı: Ödev durumu güncellendi.");
// Aktivite loglama
if (Array.isArray(window.programs)) {
    const program = window.programs.find(p => p.id === programId);
    if(program) {
        const dayData = program.schedule?.find(d => d.day === day);
        if (dayData?.assignments?.[index]) {
             const assignment = dayData.assignments[index];
             const activityMsg = `${program.studentName || '??'}: "${assignment.bookTitle || '??'}" (${assignment.pages || '?'}) ödevini ${isCompleted ? 'tamamladı' : 'tamamlanmadı olarak işaretledi'}.`;
             addActivityToFirebase(activityMsg, isCompleted ? 'completion' : 'uncompletion');
         } else {
             const activityMsg = `Bir ödev ${isCompleted ? 'tamamlandı' : 'tamamlanmadı olarak işaretlendi'} (Detay bulunamadı - Program: ${programId}, Gün: ${day}, Index: ${index}).`;
             addActivityToFirebase(activityMsg, isCompleted ? 'completion' : 'uncompletion');
             console.warn("Aktivite logu için assignment detayı bulunamadı", program.schedule, day, index);
         }
     } else {
         console.warn("Aktivite logu için program bulunamadı (window.programs içinde yok):", programId);
         const activityMsg = `Bir ödev ${isCompleted ? 'tamamlandı' : 'tamamlanmadı olarak işaretlendi'} (Program detayı bulunamadı - ID: ${programId}, Gün: ${day}, Index: ${index}).`;
         addActivityToFirebase(activityMsg, isCompleted ? 'completion' : 'uncompletion');
     }
} else {
     console.warn("Aktivite logu atlandı: window.programs henüz bir dizi değil.", window.programs);
     const activityMsg = `Bir ödev ${isCompleted ? 'tamamlandı' : 'tamamlanmadı olarak işaretlendi'} (Program listesi hazır değil - ID: ${programId}, Gün: ${day}, Index: ${index}).`;
     addActivityToFirebase(activityMsg, isCompleted ? 'completion' : 'uncompletion');
}
})
.catch(error => {
console.error("Firestore Update Hatası: ", error);
const findErrorMsg = error.message.includes("reading 'find'") ? " (Veri arama hatası)" : "";
showToast(`Ödev durumu güncellenirken hata: ${error.message}${findErrorMsg}`, "error");
if (error.code === 'permission-denied') {
   showToast('Ödev güncelleme izniniz yok.', 'error');
}

// --- START: Hata Durumunda UI'ı Geri Al ---
console.warn("Firestore güncelleme hatası, Optimistic UI geri alınıyor.");
if (checkboxElement) {
     checkboxElement.classList.toggle('checked', wasCompleted); // Eski duruma geri dön
     checkboxElement.setAttribute('aria-checked', wasCompleted);
}
if (textElement) {
     textElement.classList.toggle('line-through', wasCompleted);
     textElement.classList.toggle('text-gray-500', wasCompleted);
     textElement.classList.toggle('dark:text-gray-400', wasCompleted);
     textElement.classList.toggle('text-gray-700', !wasCompleted);
     textElement.classList.toggle('dark:text-gray-200', !wasCompleted);
}
 if (listItem) {
     listItem.classList.toggle('bg-green-50', wasCompleted);
     listItem.classList.toggle('dark:bg-green-900/30', wasCompleted);
     listItem.classList.toggle('bg-gray-50', !wasCompleted);
     listItem.classList.toggle('dark:bg-gray-700', !wasCompleted);
}
// --- END: Hata Durumunda UI'ı Geri Al ---

})
.finally(() => {
// Etkileşimi tekrar aç
if (checkboxElement) {
    checkboxElement.style.opacity = '1';
    checkboxElement.style.pointerEvents = 'auto';
}
});
}

// --- Activity Logging ---
function addActivityToFirebase(message, type = 'info') {
    if (!message) return;
    console.log("Aktivite ekleniyor:", message);
    db.collection('activities').add({
        message: message,
        type: type,
        date: firebase.firestore.FieldValue.serverTimestamp(),
        userId: auth.currentUser ? auth.currentUser.uid : null
    }).catch(error => {
        console.error("Aktivite kaydı hatası:", error);
        // Aktivite ekleme hatası genellikle kritik değildir, kullanıcıya göstermeyebiliriz.
         if (error.code === 'permission-denied') {
            console.warn('Aktivite ekleme izni yok.');
         }
    });
}


// --- UI Refresh Functions (Firebase'den gelen veriye göre çalışır) ---

function refreshStudentsList() {
console.log("refreshStudentsList fonksiyonu ÇAĞRILDI");
const studentsList = document.getElementById('students-list');
if (!studentsList) {
console.error("HATA: 'students-list' tbody elementi bulunamadı!");
return;
}
studentsList.innerHTML = '';

const currentStudents = window.students || [];
console.log("refreshStudentsList içindeki ÖĞRENCİ VERİSİ:", currentStudents);

if (currentStudents.length === 0) {
studentsList.innerHTML = `<tr><td colspan="5" class="text-center py-4 text-gray-500 dark:text-gray-400">Henüz öğrenci eklenmemiş</td></tr>`;
// Select'leri yine de güncelle (boş halleriyle)
populateStudentSelect();
populateBookStudentSelect();
populateStudentProgressFilter();
 // --- YENİ EKLENEN KISIM (Öğrenci yokken de ilerlemeyi temizle) ---
 console.log("Öğrenci yok, İlerleme sekmesi içeriği de temizleniyor/güncelleniyor...");
 refreshProgressCharts(''); // Filtresiz çağır
 refreshAssignmentCompletionList(''); // Filtresiz çağır
 // --- / YENİ EKLENEN KISIM ---
return;
}

currentStudents.forEach(student => {
// ... (öğrenci satırı oluşturma kodu aynı) ...
const studentPrograms = window.programs?.filter(p => p.studentId === student.id) || [];
const completionStats = calculateStudentCompletionStats(student.id);
const row = document.createElement('tr');
row.className = 'hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors';
row.innerHTML = `
    <td class="whitespace-nowrap py-3"> <div class="flex items-center"> <div class="avatar mr-3" style="background-color: ${stringToColor(student.name)}">${student.name.charAt(0).toUpperCase()}</div> <div> <div class="font-medium text-gray-800 dark:text-white">${student.name}</div> </div> </div> </td>
    <td class="whitespace-nowrap py-3 text-sm text-gray-600 dark:text-gray-300">${student.class || 'Yok'}</td>
    <td class="whitespace-nowrap py-3 text-sm text-center"> <span class="px-2 py-1 text-xs font-semibold rounded-full ${studentPrograms.length > 0 ? 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200' : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'}">${studentPrograms.length}</span> </td>
    <td class="whitespace-nowrap py-3"> <div class="flex flex-col"> <div class="text-xs text-gray-500 dark:text-gray-400 mb-1">${completionStats.completed}/${completionStats.total} (${completionStats.percentage}%)</div> <div class="progress-container h-2 w-32 rounded-full"> <div class="progress-bar rounded-full" style="width: ${completionStats.percentage}%"></div> </div> </div> </td>
    <td class="whitespace-nowrap py-3 text-sm space-x-2">
        <button class="view-student-programs action-btn action-btn-view touch-target" data-id="${student.id}" title="Programları Görüntüle"> <i class="fas fa-calendar-alt"></i> </button>
        <button class="delete-student action-btn action-btn-delete touch-target" data-id="${student.id}" title="Öğrenciyi Sil"> <i class="fas fa-trash-alt"></i> </button>
    </td>
`;
studentsList.appendChild(row);
// Event listeners
row.querySelector('.view-student-programs')?.addEventListener('click', () => viewStudentPrograms(student.id));
row.querySelector('.delete-student')?.addEventListener('click', () => confirmDeleteItem('öğrenciyi', deleteStudent, student.id, `Bu öğrenciye ait (${studentPrograms.length}) program da silinecektir.`));
});

// Select'leri güncelle
populateStudentSelect();
populateBookStudentSelect();
populateStudentProgressFilter();

// --- YENİ EKLENEN KISIM (Öğrenciler güncellenince ilerlemeyi de yenile) ---
console.log("Öğrenci listesi yenilendi, İlerleme sekmesi içeriği de güncelleniyor...");
const currentFilterValue = document.getElementById('progress-student-filter')?.value || '';
refreshProgressCharts(currentFilterValue);
refreshAssignmentCompletionList(currentFilterValue);
// --- / YENİ EKLENEN KISIM ---
}
function refreshBooksList() {
console.log("refreshBooksList fonksiyonu ÇAĞRILDI");
const booksList = document.getElementById('books-list');

if (!booksList) {
 console.error("HATA: 'books-list' tbody elementi bulunamadı!");
 return;
}
booksList.innerHTML = '';

// DÜZELTME: window objesi üzerinden erişim
const currentBooks = window.books || []; // window.books kullan ve boşsa [] yap

console.log("refreshBooksList içindeki KİTAP VERİSİ:", currentBooks); // currentBooks'u logla

if (currentBooks.length === 0) { // currentBooks'u kontrol et
booksList.innerHTML = `<tr><td colspan="4" class="text-center py-4 text-gray-500 dark:text-gray-400">Henüz kitap eklenmemiş</td></tr>`;
// updateProgramBookSelects'i çağırırken de window.books kullanmak daha güvenli olabilir
updateProgramBookSelects(document.getElementById('program-student')?.value);
return;
}

currentBooks.forEach((book, index) => { // currentBooks üzerinde dön
console.log(`Kitap ${index + 1} işleniyor:`, book);

// DÜZELTME: students ve programs'a da window üzerinden eriş
const assignedStudentNames = (book.studentIds || [])
    .map(id => window.students?.find(s => s.id === id)?.name) // window.students
    .filter(Boolean).join(', ') || 'Kimseye Atanmamış';
let usageCount = 0;
window.programs?.forEach(program => { // window.programs
   program.schedule?.forEach(day => {
       usageCount += day.assignments?.filter(a => a.bookId === book.id).length || 0;
   });
});
// ... (row.innerHTML ve sonrası aynı kalabilir) ...
const row = document.createElement('tr');
row.className = 'hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors';
row.innerHTML = `
    <td class="whitespace-nowrap py-3"> <div class="font-medium text-gray-800 dark:text-white">${book.title}</div> </td>
    <td class="whitespace-nowrap py-3 text-sm text-gray-600 dark:text-gray-300">${book.author || 'Yok'}</td>
    <td class="whitespace-nowrap py-3 text-xs text-gray-500 dark:text-gray-400"> <span class="block mb-1" title="${assignedStudentNames}"> ${(book.studentIds || []).length > 0 ? `${book.studentIds.length} Öğrenciye Atanmış` : 'Genel Kitap'} </span> <span class="px-2 py-0.5 text-[0.7rem] font-semibold rounded-full ${usageCount > 0 ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200' : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'}"> ${usageCount} Programda </span> </td>
    <td class="whitespace-nowrap py-3 text-sm space-x-2">
        <button class="delete-book action-btn action-btn-delete touch-target" data-id="${book.id}" title="Kitabı Sil"> <i class="fas fa-trash-alt"></i> </button>
    </td>
`;

try {
    booksList.appendChild(row);
     const deleteBtn = row.querySelector('.delete-book');
     deleteBtn?.addEventListener('click', () => {
        const warningMsg = usageCount > 0 ? `Bu kitap ${usageCount} programda kullanılıyor. Silme işlemi programlardaki ilgili ödevleri etkilemez ama referanslar kalır.` : '';
        confirmDeleteItem('kitabı', deleteBook, book.id, warningMsg);
     });
} catch(e) {
    console.error("Satır eklenirken hata oluştu:", e, "Satır HTML:", row.innerHTML);
}
});
// updateProgramBookSelects'i çağırırken de window.books kullanmak daha güvenli olabilir
updateProgramBookSelects(document.getElementById('program-student')?.value);
}
function refreshProgramsList() {
console.log("refreshProgramsList ÇAĞRILDI"); // Kontrol için log
const programsList = document.getElementById('programs-list');
if (!programsList) {
 console.error("HATA: 'programs-list' tbody elementi bulunamadı!");
 return;
}
programsList.innerHTML = ''; // Önce temizle

// DÜZELTME: window objesi üzerinden erişim
const currentPrograms = window.programs || [];
console.log("refreshProgramsList içindeki PROGRAM VERİSİ:", currentPrograms); // Kontrol için log

if (currentPrograms.length === 0) { // currentPrograms'u kontrol et
programsList.innerHTML = `<tr><td colspan="5" class="text-center py-4 text-gray-500 dark:text-gray-400">Henüz program oluşturulmamış</td></tr>`;
return;
}

currentPrograms.forEach(program => { // currentPrograms üzerinde dön
const programDate = program.date?.toDate ? program.date.toDate() : new Date();
const dateStr = programDate.toLocaleDateString('tr-TR');
// DÜZELTME: Bu fonksiyonun da window.programs kullandığından emin olmalıyız
const completionStats = calculateProgramCompletionStats(program.id);
const programType = program.isTimed ? 'Saatli' : 'Saatsiz';
const row = document.createElement('tr');
row.className = 'hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors';
row.innerHTML = `
    <td class="whitespace-nowrap py-3 text-sm text-gray-600 dark:text-gray-300">${dateStr}</td>
    <td class="whitespace-nowrap py-3 text-sm"> <div class="font-medium text-gray-800 dark:text-white">${program.studentName || 'Bilinmiyor'}</div> </td>
    <td class="whitespace-nowrap py-3 text-sm text-gray-700 dark:text-gray-300"> ${program.title} <span class="text-xs ml-1 px-1.5 py-0.5 rounded ${program.isTimed ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200'}">${programType}</span> </td>
    <td class="whitespace-nowrap py-3"> <div class="flex flex-col"> <div class="text-xs text-gray-500 dark:text-gray-400 mb-1">${completionStats.completed}/${completionStats.total} (${completionStats.percentage}%)</div> <div class="progress-container h-2 w-32 rounded-full"> <div class="progress-bar rounded-full" style="width: ${completionStats.percentage}%"></div> </div> </div> </td>
    <td class="whitespace-nowrap py-3 text-sm space-x-2">
        <button class="view-program action-btn action-btn-view touch-target" data-id="${program.id}" title="Programı Görüntüle"> <i class="fas fa-eye"></i> </button>
        <button class="delete-program action-btn action-btn-delete touch-target" data-id="${program.id}" title="Programı Sil"> <i class="fas fa-trash-alt"></i> </button>
    </td>
`;
programsList.appendChild(row);
// DÜZELTME: viewProgram içinde de window.programs kullanılmalı
row.querySelector('.view-program')?.addEventListener('click', () => viewProgram(program.id));
row.querySelector('.delete-program')?.addEventListener('click', () => confirmDeleteItem('programı', deleteProgram, program.id));
});
}

function refreshRecentPrograms() {
    const recentProgramsBody = document.getElementById('recent-programs');
    if (!recentProgramsBody) return;
    recentProgramsBody.innerHTML = '';

    // Global `programs` dizisini kullan
    if (programs.length === 0) {
        recentProgramsBody.innerHTML = `<tr><td colspan="5" class="text-center py-4 text-gray-500 dark:text-gray-400">Henüz program oluşturulmamış</td></tr>`;
        return;
    }

    const recentProgramsList = programs.slice(0, 5); // Global programlardan ilk 5'i al

    recentProgramsList.forEach(program => {
         const programDate = program.date?.toDate ? program.date.toDate() : new Date();
         const dateStr = programDate.toLocaleDateString('tr-TR');
        const completionStats = calculateProgramCompletionStats(program.id);
        const row = document.createElement('tr');
         row.className = 'hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors';
         row.innerHTML = `
             <td class="whitespace-nowrap py-3 text-sm text-gray-600 dark:text-gray-300">${dateStr}</td>
             <td class="whitespace-nowrap py-3 text-sm"> <div class="font-medium text-gray-800 dark:text-white">${program.studentName || 'Bilinmiyor'}</div> </td>
             <td class="whitespace-nowrap py-3 text-sm text-gray-700 dark:text-gray-300">${program.title}</td>
             <td class="whitespace-nowrap py-3"> <div class="flex flex-col"> <div class="text-xs text-gray-500 dark:text-gray-400 mb-1">${completionStats.completed}/${completionStats.total} (${completionStats.percentage}%)</div> <div class="progress-container h-2 w-32 rounded-full"> <div class="progress-bar rounded-full" style="width: ${completionStats.percentage}%"></div> </div> </div> </td>
             <td class="whitespace-nowrap py-3 text-sm"> <button class="view-program action-btn action-btn-view touch-target" data-id="${program.id}" title="Programı Görüntüle"> <i class="fas fa-eye"></i> </button> </td>
         `;
         recentProgramsBody.appendChild(row);
         row.querySelector('.view-program')?.addEventListener('click', () => viewProgram(program.id));
     });
}

function refreshCompletionRates() {
     const completionRatesContainer = document.getElementById('completion-rates-container');
     if (!completionRatesContainer) return;

     let totalAssignmentsOverall = 0;
     programs.forEach(p => {
        p.schedule?.forEach(d => { totalAssignmentsOverall += d.assignments?.length || 0; });
     });

     if (totalAssignmentsOverall === 0) {
         completionRatesContainer.innerHTML = `<div class="text-center py-8 text-gray-500 dark:text-gray-400">Henüz ödev içeren program yok.</div>`;
         return;
     }

     const studentStats = students.map(student => {
          const stats = calculateStudentCompletionStats(student.id);
          if (stats.total === 0) return null; // Ödevi olmayanları listede gösterme
          return { name: student.name, ...stats };
      }).filter(Boolean); // null olanları çıkar

     if (studentStats.length === 0) {
          completionRatesContainer.innerHTML = `<div class="text-center py-8 text-gray-500 dark:text-gray-400">Öğrencilere atanmış ödev bulunmuyor.</div>`;
          return;
     }

     completionRatesContainer.innerHTML = studentStats.map(stat => `
        <div class="flex items-center mb-4">
            <div class="avatar mr-3 text-sm w-8 h-8" style="background-color: ${stringToColor(stat.name)}">${stat.name.charAt(0).toUpperCase()}</div>
            <div class="flex-1">
                <div class="flex justify-between items-center mb-1">
                    <span class="text-sm font-medium text-gray-800 dark:text-white">${stat.name}</span>
                    <span class="text-xs text-gray-500 dark:text-gray-400">${stat.completed}/${stat.total} (${stat.percentage}%)</span>
                </div>
                <div class="progress-container h-2">
                    <div class="progress-bar" style="width: ${stat.percentage}%"></div>
                </div>
            </div>
        </div>
    `).join('');
}

function refreshRecentActivities() {
     const recentActivitiesEl = document.getElementById('recent-activities');
     if (!recentActivitiesEl) return;

     // Global `activities` dizisini kullan
     if (activities.length === 0) {
         recentActivitiesEl.innerHTML = `<div class="text-center py-8 text-gray-500 dark:text-gray-400">Henüz aktivite bulunmuyor</div>`;
         return;
     }

     recentActivitiesEl.innerHTML = activities.map(activity => {
         const activityDate = activity.date?.toDate ? activity.date.toDate() : new Date();
         const timeStr = activityDate.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
         const dateStr = activityDate.toLocaleDateString('tr-TR');
         let iconClass = 'fas fa-info-circle text-blue-500'; let textColor = 'text-gray-700 dark:text-gray-300';

         if (activity.type === 'success') iconClass = 'fas fa-check-circle text-green-500';
         else if (activity.type === 'warning') iconClass = 'fas fa-exclamation-triangle text-yellow-500';
         else if (activity.type === 'error') { iconClass = 'fas fa-times-circle text-red-500'; textColor = 'text-red-700 dark:text-red-400'; }
         else if (activity.type === 'completion') iconClass = 'fas fa-check text-green-600';
         else if (activity.type === 'uncompletion') iconClass = 'fas fa-undo text-yellow-600';

         return `
             <div class="py-3 flex items-start"> <div class="flex-shrink-0 mt-1 px-1"> <i class="${iconClass}"></i> </div> <div class="ml-2 flex-1"> <p class="text-sm ${textColor}">${activity.message}</p> <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">${dateStr} ${timeStr}</p> </div> </div>
         `;
      }).join('');
}

function refreshAssignmentCompletionList(filterStudentId = '') {
console.log(`refreshAssignmentCompletionList ÇAĞRILDI. Filtre: ${filterStudentId || 'Yok'}`);
const listEl = document.getElementById('assignment-completion-list');
// GÜNCELLEME: Element yoksa fonksiyondan çık
if (!listEl) {
console.warn("refreshAssignmentCompletionList -> '#assignment-completion-list' elementi DOM'da bulunamadı, işlem atlandı.");
return; // Element yoksa devam etme
}

// DÜZELTME: window.programs kullan
const currentPrograms = window.programs || [];
console.log("refreshAssignmentCompletionList içindeki PROGRAM VERİSİ:", currentPrograms); // Log

let completedAssignments = [];
currentPrograms.forEach(program => { // currentPrograms üzerinde dön
// Filtreleme
if (filterStudentId && program.studentId !== filterStudentId) return;

const programDate = program.date?.toDate ? program.date.toDate() : new Date();
// program.schedule ve day.assignments kontrolü ekle
program.schedule?.forEach(day => {
   day.assignments?.forEach((assignment, index) => {
       if (assignment.completed) {
            completedAssignments.push({
                studentName: program.studentName || 'Bilinmiyor',
                programTitle: program.title,
                programId: program.id,
                bookTitle: assignment.bookTitle || 'Kitap Yok',
                pages: assignment.pages || '?',
                day: day.day,
                date: programDate // Sıralama için Date nesnesini sakla
            });
        }
   });
});
});
completedAssignments.sort((a, b) => b.date - a.date); // Tarihe göre sırala

if (completedAssignments.length === 0) {
listEl.innerHTML = `<div class="text-center py-8 text-gray-500 dark:text-gray-400">${filterStudentId ? 'Seçili öğrenci için tamamlanmış ödev yok.' : 'Henüz tamamlanmış ödev yok.'}</div>`;
return;
}

listEl.innerHTML = completedAssignments.map(assignment => `
<div class="p-3 bg-gray-50 dark:bg-gray-750 rounded-lg flex items-center justify-between mb-2">
    <div>
        <p class="text-sm font-medium text-gray-800 dark:text-white">${assignment.studentName}: ${assignment.bookTitle} (${assignment.pages})</p>
        <p class="text-xs text-gray-500 dark:text-gray-400">Program: ${assignment.programTitle} - ${assignment.day} (${assignment.date.toLocaleDateString('tr-TR')})</p>
    </div>
    <button class="view-program action-btn action-btn-view btn-sm touch-target" data-id="${assignment.programId}" title="Programı Görüntüle">
        <i class="fas fa-eye"></i>
    </button>
</div>
`).join('');

// Listener'ları ekle (viewProgram'ın window.programs kullandığından emin ol)
listEl.querySelectorAll('.view-program').forEach(button => {
button.addEventListener('click', () => viewProgram(button.getAttribute('data-id')));
});
}
function refreshProgressCharts(filterStudentId = '') {
console.log(`refreshProgressCharts ÇAĞRILDI. Filtre: ${filterStudentId || 'Yok'}`);
const container = document.getElementById('progress-charts-container');
// GÜNCELLEME: Element yoksa fonksiyondan çık
if (!container) {
 console.warn("refreshProgressCharts -> '#progress-charts-container' elementi DOM'da bulunamadı, işlem atlandı.");
 return; // Element yoksa devam etme

}

// DÜZELTME: window objesi üzerinden erişim
const currentStudents = window.students || [];
const currentPrograms = window.programs || [];
console.log("refreshProgressCharts içindeki ÖĞRENCİ VERİSİ:", currentStudents); // Log
console.log("refreshProgressCharts içindeki PROGRAM VERİSİ:", currentPrograms); // Log

// Filtreleme
const studentsToDisplay = filterStudentId ? currentStudents.filter(s => s.id === filterStudentId) : currentStudents;

if (studentsToDisplay.length === 0 && filterStudentId) {
 container.innerHTML = `<div class="text-center py-8 text-gray-500 dark:text-gray-400 lg:col-span-2">Seçilen öğrenci bulunamadı.</div>`;
 return;
}
if (studentsToDisplay.length === 0 && !filterStudentId) {
 container.innerHTML = `<div class="text-center py-8 text-gray-500 dark:text-gray-400 lg:col-span-2">Henüz öğrenci verisi yok.</div>`;
 return;
}

// Öğrenci verilerini hesapla
const studentData = studentsToDisplay.map(student => {
// DÜZELTME: Bu fonksiyonun window.programs kullandığından emin ol
const stats = calculateStudentCompletionStats(student.id);
// Grafikte sadece ödevi olanları gösterelim
if (stats.total === 0 && !filterStudentId) return null; // Filtre yoksa ödevi olmayanı atla
 if (stats.total === 0 && filterStudentId) {
     // Eğer belirli bir öğrenci filtrelenmişse ve ödevi yoksa, bunu belirtelim
     return { name: student.name, isEmpty: true, overallStats: stats };
}


const studentPrograms = currentPrograms.filter(p => p.studentId === student.id); // currentPrograms kullan
const dailyCompletion = DAYS_OF_WEEK.map(dayName => {
    let dayTotal = 0;
    let dayCompleted = 0;
    studentPrograms.forEach(p => {
        // p.schedule ve daySchedule.assignments kontrolü
        const daySchedule = p.schedule?.find(d => d.day === dayName);
        if (daySchedule?.assignments) {
            dayTotal += daySchedule.assignments.length;
            dayCompleted += daySchedule.assignments.filter(a => a.completed).length;
        }
    });
    // Min %2 bar yüksekliği (0 olunca da görünsün diye)
    const percentage = dayTotal > 0 ? Math.max(2, Math.round((dayCompleted / dayTotal) * 100)) : 2;
    return { day: dayName, percentage: percentage };
});

return { name: student.name, overallStats: stats, dailyStats: dailyCompletion, isEmpty: false };
}).filter(Boolean); // null olanları çıkar (filtre yokken ödevi olmayanlar)

if (studentData.length === 0 && !filterStudentId) {
 container.innerHTML = `<div class="text-center py-8 text-gray-500 dark:text-gray-400 lg:col-span-2">Henüz ilerlemesi hesaplanacak ödevi olan öğrenci yok.</div>`;
 return;
}
if (studentData.length === 0 && filterStudentId) {
// Bu durum yukarıdaki studentsToDisplay kontrolünde yakalanmalı ama yine de kontrol edelim.
container.innerHTML = `<div class="text-center py-8 text-gray-500 dark:text-gray-400 lg:col-span-2">Seçilen öğrenci için veri bulunamadı.</div>`;
return;
}

// HTML'i oluştur
container.innerHTML = studentData.map(student => {
// Eğer öğrenci filtrelenmiş ve ödevi yoksa özel mesaj göster
 if (student.isEmpty) {
     return `
         <div class="card p-6 lg:col-span-2">
              <h4 class="text-base font-semibold text-gray-800 dark:text-white mb-4 flex items-center">
                  <div class="avatar mr-2 text-xs w-6 h-6" style="background-color: ${stringToColor(student.name)}">${student.name.charAt(0).toUpperCase()}</div>
                  ${student.name}
              </h4>
              <p class="text-center text-gray-500 dark:text-gray-400 py-4">Bu öğrenciye atanmış henüz ödev bulunmuyor.</p>
         </div>`;
 }
 // Ödevi varsa normal grafiği göster
 return `
    <div class="card p-6">
        <h4 class="text-base font-semibold text-gray-800 dark:text-white mb-4 flex items-center">
            <div class="avatar mr-2 text-xs w-6 h-6" style="background-color: ${stringToColor(student.name)}">${student.name.charAt(0).toUpperCase()}</div>
            ${student.name} - Genel İlerleme
        </h4>
        <div class="flex items-center mb-4">
            <div class="text-3xl font-bold mr-2">${student.overallStats.percentage}%</div>
            <div class="text-sm text-gray-500 dark:text-gray-400">(${student.overallStats.completed}/${student.overallStats.total} ödev)</div>
        </div>
        <div class="progress-container h-3 mb-6">
            <div class="progress-bar" style="width: ${student.overallStats.percentage}%"></div>
        </div>
        <h5 class="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Günlük Tamamlama Oranları (%)</h5>
        <div class="flex justify-between items-end space-x-1 h-24">
            ${student.dailyStats.map(dayStat => `
                <div class="flex flex-col items-center w-full">
                    <div class="w-full bg-gray-200 dark:bg-gray-600 rounded-t-md overflow-hidden flex items-end" style="height: 100%;">
                         <div class="w-full bg-success transition-all duration-300" style="height: ${dayStat.percentage}%;"></div>
                    </div>
                    <div class="text-[10px] text-gray-500 dark:text-gray-400 mt-1">${dayStat.day.substring(0,3)}</div>
                </div>
            `).join('')}
        </div>
    </div>
`;
}).join('');
}



// --- UI Interactions ---

function viewProgram(programIdToShow) {
console.log(`viewProgram çağrıldı (Yeni Sekmede Açılacak). ID: ${programIdToShow}`);

if (!programIdToShow) {
showToast("Program ID bulunamadı.", "error");
return;
}

// Yeni sekmede açılacak URL'yi oluştur
// ret.html sayfasının kendisini hedefliyoruz, ?program=ID parametresi ile
const viewUrl = `${baseUrl}?program=${programIdToShow}`;

// Yeni sekmede aç
window.open(viewUrl, '_blank');

// Artık modal ile ilgili kodlara gerek yok.
// currentProgramId = programIdToShow;
// const modalTitle = document.getElementById('modal-title');
// const modalContent = document.getElementById('modal-content');
// ... (modalı doldurma ve gösterme kodları silindi) ...
// programDetailModal?.classList.remove('hidden');

}
function showStudentView(programIdToShow) {
     console.log("Öğrenci görünümü yükleniyor, program ID:", programIdToShow);
     if (!studentViewContent) return;

     studentViewContent.innerHTML = `<div class="text-center py-10"><div class="loader mx-auto"></div><p class="mt-2 text-gray-500 dark:text-gray-400">Program yükleniyor...</p></div>`;

     if (!programIdToShow) {
          studentViewContent.innerHTML = `
              <div class="card p-8 mt-10 animate-fade-in text-center"> <i class="fas fa-exclamation-circle text-red-500 text-5xl mb-4"></i> <h2 class="text-2xl font-bold text-gray-800 dark:text-white mb-2">Program Bulunamadı</h2> <p class="text-gray-600 dark:text-gray-400 mb-6">İstenen program ID'si geçersiz veya bulunamadı.</p> <button onclick="window.location.href='${baseUrl}'" class="btn btn-primary touch-target"> Ana Sayfaya Dön </button> </div>
          `;
          return;
     }

     // Firestore'dan programı çek (Gerçek zamanlı dinleyiciye gerek yok)
     db.collection('programs').doc(programIdToShow).get()
         .then(doc => {
             if (!doc.exists) {
                 throw new Error("Program bulunamadı veya silinmiş.");
             }
             const program = { id: doc.id, ...doc.data() };
             console.log("Öğrenci görünümü için program bulundu:", program.title);

             const programDate = program.date?.toDate ? program.date.toDate() : new Date();
             const completionStats = calculateProgramCompletionStats(program.id, program); // Program verisini doğrudan gönder

             let content = `
                 <div class="card overflow-hidden mb-8">
                     <div class="bg-primary text-white p-6">
                         <h2 class="text-2xl font-bold">${program.title}</h2>
                         <p class="text-blue-100 mt-1">${program.studentName || 'Bilinmiyor'} - ${programDate.toLocaleDateString('tr-TR')}</p>
                     </div>
                     <div class="p-6">
                         <div class="mb-6">
                             <h3 class="text-lg font-semibold mb-2 text-gray-800 dark:text-white">Haftalık İlerleme</h3>
                             <div class="progress-container">
                                 <div class="progress-bar" style="width: ${completionStats.percentage}%"></div>
                             </div>
                             <div class="flex justify-between mt-2 text-sm text-gray-600 dark:text-gray-400">
                                 <span>${completionStats.completed} yapıldı</span>
                                 <span>${completionStats.total} ödev</span>
                             </div>
                         </div>
                         <div id="student-program-container" class="space-y-6">`; // Günler için container

             let hasAnyAssignment = false;
             program.schedule?.forEach(day => {
                 if (!day.assignments || day.assignments.length === 0) return;
                 hasAnyAssignment = true;
                 const dayCompletedCount = day.assignments.filter(a => a.completed).length;
                 const dayTotalCount = day.assignments.length;
                 const dayPercentage = dayTotalCount > 0 ? Math.round((dayCompletedCount / dayTotalCount) * 100) : 0;

                 content += `
                     <div class="card p-4 mb-4 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm">
                         <div class="flex justify-between items-center mb-3">
                             <h4 class="text-md font-semibold text-gray-800 dark:text-white">${day.day}</h4>
                             <div class="text-xs text-gray-500 dark:text-gray-400">${dayCompletedCount}/${dayTotalCount}</div>
                         </div>
                         <div class="progress-container h-1.5 mb-4 rounded-full">
                             <div class="progress-bar rounded-full" style="width: ${dayPercentage}%"></div>
                         </div>
                         <ul class="space-y-3">`;
                 day.assignments.forEach((assignment, index) => {
                    const isCompleted = assignment.completed;
                     content += `
                         <li class="flex items-start p-3 rounded-lg ${isCompleted ? 'bg-green-50 dark:bg-green-900/30' : 'bg-gray-50 dark:bg-gray-700'}">
                             <div class="custom-checkbox mt-1 touch-target ${isCompleted ? 'checked' : ''}" data-day="${day.day}" data-index="${index}" role="checkbox" aria-checked="${isCompleted}" tabindex="0">
                                 <i class="fas fa-check"></i>
                             </div>
                             <div class="ml-3 flex-1">
                                 <div class="text-sm ${isCompleted ? 'line-through text-gray-500 dark:text-gray-400' : 'text-gray-700 dark:text-gray-200'}">${assignment.bookTitle || 'Kitap Yok'}</div>
                                 <div class="text-sm ${isCompleted ? 'line-through text-gray-500 dark:text-gray-400' : 'text-gray-700 dark:text-gray-200'}">${assignment.pages || '?'}</div>
                                 ${program.isTimed && (assignment.startTime || assignment.endTime)
                                     ? `<span class="mt-1 text-xs px-1.5 py-0.5 bg-gray-200 dark:bg-gray-600 rounded text-gray-600 dark:text-gray-300 inline-block">
                                            ${assignment.startTime || '--:--'} - ${assignment.endTime || '--:--'}
                                         </span>`
                                     : ''}
                             </div>
                         </li>`;
                 });
                 content += `</ul></div>`;
             });

              if (!hasAnyAssignment) {
                content += `<div class="text-center text-gray-500 dark:text-gray-400 py-4">Bu programda ödev yok.</div>`;
              }

             content += `</div></div></div>`; // Container ve card kapandı
             studentViewContent.innerHTML = content; // Sonucu ekrana bas

             // Checkbox listener'larını ekle
             studentViewContent.querySelectorAll('.custom-checkbox').forEach(checkbox => {
                  checkbox.addEventListener('click', () => toggleAssignmentCompletionFirebase(checkbox, programIdToShow));
                  checkbox.addEventListener('keypress', (e) => { if (e.key === 'Enter' || e.key === ' ') toggleAssignmentCompletionFirebase(checkbox, programIdToShow); });
              });

         })
         .catch(error => {
             console.error("Öğrenci görünümü program yükleme hatası:", error);
             studentViewContent.innerHTML = `
                 <div class="card p-8 mt-10 animate-fade-in text-center">
                    <i class="fas fa-exclamation-circle text-red-500 text-5xl mb-4"></i>
                    <h2 class="text-2xl font-bold text-gray-800 dark:text-white mb-2">Program Yüklenemedi</h2>
                    <p class="text-gray-600 dark:text-gray-400 mb-6">${error.message}</p>
                    <button onclick="window.location.href='${baseUrl}'" class="btn btn-primary touch-target"> Ana Sayfaya Dön </button>
                 </div>
             `;
         });
 }

// --- Utility Functions ---

function initDarkMode() {
     const isDark = localStorage.getItem('darkMode') === 'true';
     if (isDark) {
         document.body.classList.add('dark');
     }
     updateThemeIcons(isDark);
}

function updateThemeIcons(isDark) {
    const moonIcon = '<i class="fas fa-moon"></i>';
    const sunIcon = '<i class="fas fa-sun"></i>';
    const themeIcon = isDark ? sunIcon : moonIcon;
    if(toggleThemeLoginBtn) toggleThemeLoginBtn.innerHTML = themeIcon;
    if(toggleThemeBtn) {
        const span = toggleThemeBtn.querySelector('span');
        toggleThemeBtn.innerHTML = (isDark ? sunIcon : moonIcon) + (span ? span.outerHTML : ''); // Keep text if exists
    }
    if(toggleThemeStudentBtn) toggleThemeStudentBtn.innerHTML = themeIcon;
}

function setRgbVariables() {
    const root = document.documentElement;
    const styles = getComputedStyle(root);
    const theme = document.body.classList.contains('dark') ? '.dark' : ':root';

    ['primary', 'secondary', 'danger', 'success', 'warning'].forEach(colorName => {
        const colorValue = styles.getPropertyValue(`--${colorName}`).trim();
        if (colorValue && colorValue.startsWith('#')) {
            const rgb = hexToRgb(colorValue);
            if (rgb) {
                 root.style.setProperty(`--${colorName}-rgb`, `${rgb.r}, ${rgb.g}, ${rgb.b}`);
            }
        }
    });
}

function hexToRgb(hex) {
     const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
     return result ? {
         r: parseInt(result[1], 16),
         g: parseInt(result[2], 16),
         b: parseInt(result[3], 16)
     } : null;
 }

function toggleTheme() {
     const isDark = document.body.classList.toggle('dark');
     localStorage.setItem('darkMode', isDark);
     updateThemeIcons(isDark);
     setRgbVariables(); // Update RGB vars after theme change
}

function switchTab(tabName) {
    tabContents.forEach(tab => {
        tab.classList.remove('active');
        tab.classList.remove('animate-fade-in'); // Remove animation class first
    });
    navLinks.forEach(link => {
        link.classList.remove('active');
    });

    const activeTab = document.getElementById(`${tabName}-tab`);
    const activeLink = document.querySelector(`.nav-link[data-tab="${tabName}"]`);

    if (activeTab) {
         setTimeout(() => { // Add a small delay for animation
            activeTab.classList.add('active');
            activeTab.classList.add('animate-fade-in');
         }, 50);
    }
    if (activeLink) {
         activeLink.classList.add('active');
         if(pageTitle) pageTitle.textContent = activeLink.querySelector('span')?.textContent || 'EduFlow';
    } else {
         // If link not found (e.g., switched via button), find based on tabName
         const fallbackLink = Array.from(navLinks).find(l => l.dataset.tab === tabName);
         if (fallbackLink) {
             fallbackLink.classList.add('active');
             if(pageTitle) pageTitle.textContent = fallbackLink.querySelector('span')?.textContent || 'EduFlow';
         }
    }

     // Close sidebar on mobile after switching tab
     if (window.innerWidth < 640 && sidebar) {
         sidebar.classList.add('-translate-x-full');
     }
}

function updateDashboardCounts() {
console.log("updateDashboardCounts ÇAĞRILDI");
const studentCountEl = document.getElementById('student-count');
const bookCountEl = document.getElementById('book-count');
const programCountEl = document.getElementById('program-count');

// DÜZELTME: window objesi üzerinden erişim
const studentLength = window.students?.length || 0; //?. ve || 0 eklendi
const bookLength = window.books?.length || 0;
const programLength = window.programs?.length || 0;

console.log(`  - updateDashboardCounts İÇİNDE: window.students.length = ${studentLength}`);
console.log(`  - updateDashboardCounts İÇİNDE: window.books.length = ${bookLength}`);
console.log(`  - updateDashboardCounts İÇİNDE: window.programs.length = ${programLength}`);

if (studentCountEl) {
studentCountEl.textContent = studentLength; // Düzeltilmiş değeri kullan
console.log(`  - #student-count güncellendi: ${studentLength}`);
} else {
console.warn("  - #student-count elementi bulunamadı!");
}
if (bookCountEl) {
bookCountEl.textContent = bookLength; // Düzeltilmiş değeri kullan
console.log(`  - #book-count güncellendi: ${bookLength}`);
} else {
console.warn("  - #book-count elementi bulunamadı!");
}
if (programCountEl) {
programCountEl.textContent = programLength; // Düzeltilmiş değeri kullan
console.log(`  - #program-count güncellendi: ${programLength}`);
} else {
console.warn("  - #program-count elementi bulunamadı!");
}
}

function getBooksForStudent(studentId) {
// DÜZELTME: window objesi üzerinden erişim
const currentBooks = window.books || [];
const currentStudents = window.students || []; // Öğrenci bilgisi de gerekebilir (nadiren)

// Tüm genel kitapları al
const generalBooks = currentBooks.filter(book => !book.studentIds || book.studentIds.length === 0);
// Öğrenciye atanmış kitapları al
const assignedBooks = studentId ? currentBooks.filter(book => book.studentIds && book.studentIds.includes(studentId)) : [];
// Birleştir ve benzersiz yap
const allRelevantBooks = [...generalBooks, ...assignedBooks];
const uniqueBooks = Array.from(new Map(allRelevantBooks.map(book => [book.id, book])).values());
console.log(`getBooksForStudent(${studentId}) -> bulunan kitaplar:`, uniqueBooks.length); // Log eklendi
return uniqueBooks.sort((a, b) => a.title.localeCompare(b.title));
}

function updateProgramBookSelects(studentId) {
     const bookSelects = document.querySelectorAll('#weekly-schedule .book-select');
     const relevantBooks = getBooksForStudent(studentId);

     bookSelects.forEach(select => {
         const currentVal = select.value; // Seçili değeri korumaya çalış
         select.innerHTML = '<option value="">Kitap Seçin</option>'; // Reset
         relevantBooks.forEach(book => {
             const option = document.createElement('option');
             option.value = book.id;
             option.textContent = book.title;
             select.appendChild(option);
         });
         // Eski değeri geri yükle (eğer hala geçerliyse)
         if (relevantBooks.some(b => b.id === currentVal)) {
             select.value = currentVal;
         }
     });
 }

function toggleTimeInputs() {
     const isTimed = document.querySelector('input[name="program-type"]:checked')?.value === 'timed';
     const timeInputs = document.querySelectorAll('#weekly-schedule .time-input-group');
     timeInputs.forEach(group => {
         group.classList.toggle('hidden', !isTimed);
         // Zamanlı değilse input değerlerini temizle (isteğe bağlı)
         if (!isTimed) {
             group.querySelectorAll('input[type="time"]').forEach(input => input.value = '');
         }
     });
 }

 function populateWeekDays(studentId = null) {
console.log(`populateWeekDays çağrıldı. studentId: ${studentId}`); // Log eklendi
const weeklyScheduleDiv = document.getElementById('weekly-schedule');
if (!weeklyScheduleDiv) return;
weeklyScheduleDiv.innerHTML = ''; // Önce temizle

// DÜZELTME: Doğru studentId ile kitapları al
const relevantBooks = getBooksForStudent(studentId);
console.log("populateWeekDays -> İlk yükleme için relevantBooks:", relevantBooks.length);

DAYS_OF_WEEK.forEach(day => {
const dayCard = document.createElement('div');
dayCard.className = 'card p-4 border border-gray-200 dark:border-gray-600 rounded-lg';
dayCard.innerHTML = `
    <div class="flex justify-between items-center mb-3">
        <h4 class="text-md font-semibold text-gray-800 dark:text-white">${day}</h4>
        <button class="add-assignment-btn btn btn-sm btn-light touch-target" data-day="${day}">
            <i class="fas fa-plus text-xs mr-1"></i> Ödev
        </button>
    </div>
    <div class="assignments-container space-y-3">
        <!-- Ödevler buraya eklenecek -->
    </div>
`;
weeklyScheduleDiv.appendChild(dayCard);

// İlk ödev satırını ekle (doğru kitap listesiyle)
const assignmentsContainer = dayCard.querySelector('.assignments-container');
if (assignmentsContainer) {
    addAssignmentToDay(assignmentsContainer, relevantBooks); // İlk satır için listeyi ilet
}

// "Ödev Ekle" butonu için listener
const addBtn = dayCard.querySelector('.add-assignment-btn');
if (addBtn) {
     addBtn.addEventListener('click', (e) => {
         // DÜZELTME: Tıklandığı anda güncel öğrenci ID'sini ve kitap listesini al
         const currentStudentId = document.getElementById('program-student')?.value;
         const currentRelevantBooks = getBooksForStudent(currentStudentId);
         const container = e.target.closest('.card')?.querySelector('.assignments-container');
         if (container) {
             addAssignmentToDay(container, currentRelevantBooks); // Güncel listeyi ilet
         } else {
              console.error("Ödev eklenecek assignments-container bulunamadı!");
         }
     });
}
});
toggleTimeInputs(); // Başlangıçta zaman girdilerinin durumunu ayarla
}

 // Belirli bir güne yeni ödev satırı ekleyen yardımcı fonksiyon
 function addAssignmentToDay(container, bookList) {
console.log("addAssignmentToDay çağrıldı. Gelen bookList:", bookList); // <-- Gelen listeyi logla
const assignmentDiv = document.createElement('div');
assignmentDiv.className = 'assignment flex items-center space-x-2 animate-fade-in';

const isTimed = document.querySelector('input[name="program-type"]:checked')?.value === 'timed';

// Oluşturulan HTML'i de loglayalım
const optionsHTML = bookList && bookList.length > 0
? bookList.map(book => `<option value="${book.id}">${book.title}</option>`).join('')
: '<option value="" disabled>Uygun Kitap Yok</option>'; // Kitap yoksa mesaj
console.log("addAssignmentToDay -> Oluşturulan Options HTML:", optionsHTML);

assignmentDiv.innerHTML = `
<select class="book-select flex-grow px-2 py-1 text-sm rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700">
    <option value="">Kitap Seçin</option>
    ${optionsHTML}
</select>
<input type="text" class="pages-input w-20 px-2 py-1 text-sm rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700" placeholder="Sayfa">
<div class="time-input-group flex space-x-1 ${isTimed ? '' : 'hidden'}">
    <input type="time" class="start-time-input w-24 px-1 py-1 text-xs rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700">
    <input type="time" class="end-time-input w-24 px-1 py-1 text-xs rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700">
</div>
<button class="remove-assignment-btn text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 p-1 touch-target">
    <i class="fas fa-times"></i>
</button>
`;
if (container) { // Konteyner var mı kontrol et
 container.appendChild(assignmentDiv);
  // Silme butonu listener'ı
 assignmentDiv.querySelector('.remove-assignment-btn')?.addEventListener('click', removeAssignment);
} else {
 console.error("addAssignmentToDay -> Ödev eklenecek konteyner bulunamadı!");
}
}
 // Ödev satırını silen fonksiyon
 function removeAssignment(e) {
     const assignmentDiv = e.target.closest('.assignment');
     if (assignmentDiv) {
         assignmentDiv.classList.add('animate-fade-out'); // Optional: Add fade-out animation
         setTimeout(() => assignmentDiv.remove(), 200); // Remove after animation
     }
 }

function generateUniqueId() { // Firestore ID ürettiği için pek kullanılmaz ama dursun.
     return Date.now().toString(36) + Math.random().toString(36).substring(2);
 }

 function viewStudentPrograms(studentId) {
console.log(`viewStudentPrograms çağrıldı. Student ID: ${studentId}`); // Log

// DÜZELTME: Öğrenciyi window.students içinden bul
const student = window.students?.find(s => s.id === studentId);

if (!student) {
console.error(`viewStudentPrograms -> Öğrenci bulunamadı! ID: ${studentId}`);
showToast("Öğrenci bilgisi bulunamadı.", "error");
return;
}

// 1. Programlar sekmesine geç
switchTab('programs');

// 2. Arama kutusunu bul ve öğrenci adını yaz
const searchInput = document.getElementById('search-programs');
if (searchInput) {
searchInput.value = student.name; // Arama kutusuna öğrenci adını yaz

// 3. Filtrelemeyi tetiklemek için manuel olarak 'input' olayını gönderelim
// Bu, arama kutusuna bağlı olan filterTable fonksiyonunun çalışmasını garantiler.
const inputEvent = new Event('input', { bubbles: true });
searchInput.dispatchEvent(inputEvent);

console.log(`viewStudentPrograms -> Arama kutusuna "${student.name}" yazıldı ve filtreleme tetiklendi.`);
showToast(`${student.name} için programlar filtrelendi.`, 'info');
} else {
console.warn("viewStudentPrograms -> #search-programs arama kutusu bulunamadı.");
showToast("Program arama kutusu bulunamadı, filtreleme yapılamadı.", "warning");
}
}

function confirmDeleteItem(itemTypeTurkish, callbackFunction, itemId, warningText = '') {
     if (!confirmDeleteModal || !deleteMessage || !deleteWarning || !confirmDelete) return;
     deleteMessage.textContent = `Bu ${itemTypeTurkish} silmek istediğinize emin misiniz? Bu işlem geri alınamaz.`;
     if (warningText) {
         deleteWarning.textContent = warningText;
         deleteWarning.classList.remove('hidden');
     } else {
         deleteWarning.classList.add('hidden');
         deleteWarning.textContent = '';
     }
     deleteCallback = callbackFunction;
     deleteItemId = itemId;
     confirmDeleteModal.classList.remove('hidden');
 }

function copyProgramLink() {
     if (!currentProgramId) {
         showToast("Önce bir program görüntülenmeli.", "warning");
         return;
     }
     const shareUrl = `${baseUrl}?program=${currentProgramId}`;
     navigator.clipboard.writeText(shareUrl).then(() => {
         showToast("Öğrenci görünümü linki kopyalandı!", "success");
     }).catch(err => {
         console.error('Link kopyalanamadı: ', err);
         showToast("Link kopyalanamadı.", "error");
         // Fallback: Prompt user to copy manually
         // window.prompt("Kopyalamak için: Ctrl+C, Enter", shareUrl);
     });
 }

function showToast(message, type = 'info') {
    if (!toastElement || !toastMessage) return;
    toastMessage.textContent = message;
    // Reset classes
    toastElement.classList.remove('bg-primary', 'bg-success', 'bg-warning', 'bg-danger', 'dark:bg-primary-light', 'dark:bg-success', 'dark:bg-warning', 'dark:bg-danger');
    let bgColor = 'bg-primary dark:bg-primary-light'; // Default: info
    if (type === 'success') bgColor = 'bg-success dark:bg-success';
    else if (type === 'warning') bgColor = 'bg-warning dark:bg-warning text-button-text-alt dark:text-button-text-alt'; // Warning often needs dark text
    else if (type === 'error') bgColor = 'bg-danger dark:bg-danger';
     toastElement.classList.add(...bgColor.split(' ')); // Add new classes

     toastElement.classList.add('show');
     setTimeout(() => { toastElement.classList.remove('show'); }, 3000); // 3 saniye sonra gizle
}

function calculateProgramCompletionStats(programIdToCalc, directProgramData = null) {
// DÜZELTME: window.programs kullan
const program = directProgramData || window.programs?.find(p => p.id === programIdToCalc);
// Güvenlik kontrolü: program veya schedule yoksa 0 döndür
if (!program || !program.schedule) return { completed: 0, total: 0, percentage: 0 };
let total = 0; let completed = 0;
program.schedule.forEach(day => {
if (day.assignments) { // Güvenlik kontrolü
   total += day.assignments.length;
   completed += day.assignments.filter(a => a.completed).length;
}
});
const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
return { completed, total, percentage };
}

function calculateStudentCompletionStats(studentIdToCalc) {
console.log(`calculateStudentCompletionStats çağrıldı. studentId: ${studentIdToCalc}`); // Log eklendi
let total = 0; let completed = 0;
// DÜZELTME: window.programs kullan
const currentPrograms = window.programs || [];
const studentPrograms = currentPrograms.filter(p => p.studentId === studentIdToCalc);

studentPrograms.forEach(program => {
if (program.schedule) {
     program.schedule.forEach(day => {
        if (day.assignments) {
           total += day.assignments.length;
           completed += day.assignments.filter(a => a.completed).length;
        }
    });
}
});
const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
console.log(`  -> Sonuç: completed=${completed}, total=${total}, percentage=${percentage}`); // Log eklendi
return { completed, total, percentage };
}
function filterTable(tableBodyId, searchTerm, columnIndices) {
    const tableBody = document.getElementById(tableBodyId);
    if (!tableBody) return;
    const rows = tableBody.getElementsByTagName('tr');
    let visibleCount = 0;

    for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        let found = false;
        if (searchTerm === '') {
            found = true; // Arama boşsa tümünü göster
        } else {
             columnIndices.forEach(colIndex => {
                const cell = row.getElementsByTagName('td')[colIndex];
                if (cell) {
                    const cellText = cell.textContent || cell.innerText;
                    if (cellText.toLowerCase().includes(searchTerm)) {
                        found = true;
                    }
                }
            });
        }

        row.style.display = found ? '' : 'none';
        if(found) visibleCount++;
    }
     // Eğer arama sonucu hiç satır yoksa mesaj göster (opsiyonel)
     // Bu kısım, "veri yok" mesajı olan satırları da gizleyebileceği için dikkatli kullanılmalı.
     // Belki de sadece arama terimi varken ve visibleCount=0 iken ek bir mesaj satırı eklemek daha iyi olur.
}

function stringToColor(str) {
    if (!str) return '#4361ee'; // Default color if string is empty
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    let color = '#';
    for (let i = 0; i < 3; i++) {
        let value = (hash >> (i * 8)) & 0xFF;
        // Avoid very light colors by ensuring a minimum value (e.g., 50)
        // And avoid very dark colors (e.g., max 200) for better contrast with white text
        value = Math.max(50, Math.min(200, value));
        color += ('00' + value.toString(16)).slice(-2);
    }
    return color;
}

function populateStudentSelect() {
console.log("populateStudentSelect ÇAĞRILDI"); // <-- Log 1: Ne zaman çağrıldı?
const select = document.getElementById('program-student');
if (!select) {
// Eğer bu hatayı alıyorsanız, fonksiyon çağrıldığında ilgili HTML elementi DOM'da mevcut değil demektir.
console.error("HATA: populateStudentSelect -> 'program-student' ID'li select elementi bulunamadı!");
return;
}
const currentVal = select.value; // Seçili değeri korumaya çalış
select.innerHTML = '<option value="">Öğrenci Seçin</option>'; // Reset

// window.students kullan ve boşsa [] yap
const currentStudents = window.students || [];
// Log 2: Fonksiyon içindeki veri ne?
console.log("populateStudentSelect içindeki ÖĞRENCİ VERİSİ:", currentStudents);

if (currentStudents.length === 0) {
 select.innerHTML = '<option value="">Öğrenci Yok</option>';
 console.log("populateStudentSelect -> Öğrenci yok, select güncellendi."); // Log 3a
 return;
}

// Öğrencileri ekle
currentStudents.forEach((student, index) => {
const option = document.createElement('option');
option.value = student.id;
option.textContent = student.name;
try {
    select.appendChild(option);
} catch (e) {
     console.error(`populateStudentSelect -> ${index}. öğrenci (${student.name}) eklenirken hata:`, e); // Log 3b - Hata olursa
}
});
console.log(`populateStudentSelect -> ${currentStudents.length} öğrenci seçeneği eklendi.`); // Log 3c - Başarılıysa

// Eski değeri geri yükle (eğer hala listedeyse)
if (currentStudents.some(s => s.id === currentVal)) {
select.value = currentVal;
} else {
// Eğer eski seçili öğrenci artık listede yoksa (silinmişse vb.)
// Haftalık program alanını sıfırla (bu kısım zaten vardı)
const weeklyScheduleDiv = document.getElementById('weekly-schedule');
if (weeklyScheduleDiv) {
   weeklyScheduleDiv.classList.add('opacity-50', 'pointer-events-none');
   weeklyScheduleDiv.innerHTML = '';
}
}
}

function populateBookStudentSelect() {
console.log("populateBookStudentSelect ÇAĞRILDI"); // Kontrol için log
const select = document.getElementById('book-students');
if (!select) {
console.error("HATA: populateBookStudentSelect -> 'book-students' ID'li select elementi bulunamadı!");
return;
}
select.innerHTML = ''; // Reset

// DÜZELTME: window objesi üzerinden erişim
const currentStudents = window.students || [];
console.log("populateBookStudentSelect içindeki ÖĞRENCİ VERİSİ:", currentStudents); // Kontrol için log

if (currentStudents.length === 0) {
 select.innerHTML = '<option disabled>Öğrenci Yok</option>'; // "disabled" eklendi, seçilemez
 console.log("populateBookStudentSelect -> Öğrenci yok, select güncellendi.");
 return;
}

// Öğrencileri ekle
currentStudents.forEach((student, index) => {
const option = document.createElement('option');
option.value = student.id;
// Öğrenci adı ve sınıfını gösterelim
option.textContent = `${student.name} (${student.class || 'Sınıf Yok'})`;
try {
    select.appendChild(option);
} catch (e) {
     console.error(`populateBookStudentSelect -> ${index}. öğrenci (${student.name}) eklenirken hata:`, e);
}
});
console.log(`populateBookStudentSelect -> ${currentStudents.length} öğrenci seçeneği eklendi.`);
}
function populateStudentProgressFilter() {
console.log("populateStudentProgressFilter ÇAĞRILDI"); // Kontrol için log
const select = document.getElementById('progress-student-filter');
if (!select) {
console.error("HATA: populateStudentProgressFilter -> 'progress-student-filter' ID'li select elementi bulunamadı!");
return;
}
const currentVal = select.value; // Seçili değeri korumaya çalış
select.innerHTML = '<option value="">Tüm Öğrenciler</option>'; // Reset with "All" option

// DÜZELTME: window objesi üzerinden erişim
const currentStudents = window.students || [];
console.log("populateStudentProgressFilter içindeki ÖĞRENCİ VERİSİ:", currentStudents); // Kontrol için log

if (currentStudents.length === 0) {
 // Öğrenci yoksa başka seçenek eklemeye gerek yok, "Tüm Öğrenciler" yeterli.
 console.log("populateStudentProgressFilter -> Öğrenci yok.");
 return; // Zaten "Tüm Öğrenciler" var, çık.
}

// Öğrencileri ekle
currentStudents.forEach((student, index) => {
const option = document.createElement('option');
option.value = student.id;
option.textContent = student.name;
try {
    select.appendChild(option);
} catch (e) {
     console.error(`populateStudentProgressFilter -> ${index}. öğrenci (${student.name}) eklenirken hata:`, e);
}
});
console.log(`populateStudentProgressFilter -> ${currentStudents.length} öğrenci seçeneği eklendi.`);

// Eski değeri geri yükle (eğer hala listedeyse)
if (currentStudents.some(s => s.id === currentVal)) {
select.value = currentVal;
}
// Eğer eski değer yoksa veya "Tüm Öğrenciler" seçiliyse bir şey yapmaya gerek yok.
}

// --- Modal QR Code Generation ---
 function generateModalQRCode() {
     if (!currentProgramId) {
         showToast("Önce bir program görüntülenmeli.", "warning");
         return;
     }
     if (!modalQrContainer || !modalQrcodeDiv) return;

     const shareUrl = `${baseUrl}?program=${currentProgramId}`;
     modalQrContainer.classList.remove('hidden');
     modalQrcodeDiv.innerHTML = '<div class="loader mx-auto"></div>'; // Yükleniyor

     // Ensure qrcode library is loaded
     if (typeof window.qrcode !== 'function') {
          console.error("QR Code library (qrcode-generator) not loaded.");
          modalQrcodeDiv.innerHTML = '<p class="text-red-500 text-xs">QR kod kitaplığı yüklenemedi.</p>';
          showToast("QR Kod oluşturulamadı.", "error");
          return;
     }
    }