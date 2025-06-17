import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { publicSupabase } from '../../lib/publicSupabase';
import { BookOpen, FileText, GraduationCap, Calendar } from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface StudentData {
  id: string;
  name: string;
  email?: string;
  school?: string;
  grade?: string;
  field?: string;
}

const PublicReport: React.FC = () => {
  const { studentId } = useParams<{ studentId: string; reportId: string }>();  const [student, setStudent] = useState<StudentData | null>(null);  const [questionStatsData, setQuestionStatsData] = useState<any[]>([]);
  const [readingStatusData, setReadingStatusData] = useState<any[]>([]);
  const [coachNotes, setCoachNotes] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchStudentData();
  }, [studentId]);

  const fetchStudentData = async () => {
    if (!studentId) return;

    try {
      setLoading(true);
        // Öğrenci bilgilerini al
      const { data: studentData, error: studentError } = await publicSupabase
        .from('students')
        .select('id, name, email, school, grade, field')
        .eq('id', studentId)
        .single();

      if (studentError) throw studentError;

      setStudent(studentData);

      // Soru istatistiklerini al
      const { data: assignments, error: assignmentsError } = await publicSupabase
        .from('assignments')
        .select(`
          id,
          correct_answers,
          wrong_answers,
          blank_answers,
          programs(title),
          books(title)
        `)
        .eq('student_id', studentId);

      if (assignmentsError) throw assignmentsError;

      // Sadece soru istatistiği olan kayıtları filtrele
      const filteredAssignments = (assignments || []).filter((assignment: any) => 
        assignment.correct_answers !== null || 
        assignment.wrong_answers !== null || 
        assignment.blank_answers !== null
      );      setQuestionStatsData(filteredAssignments);      // Koç notlarını al
      const { data: coachNotesData, error: notesError } = await publicSupabase
        .from('coach_notes')
        .select('notes')
        .eq('student_id', studentId)
        .order('updated_at', { ascending: false })
        .limit(1)
        .single();if (notesError && notesError.code !== 'PGRST116') {
        console.error('Error fetching coach notes:', notesError);      } else if (coachNotesData) {
        setCoachNotes(coachNotesData.notes || '');
      }      // Reading status'u al
      const { data: readingData, error: readingError } = await publicSupabase
        .from('reading_status')
        .select(`
          *,
          books(id, title, author, is_story_book)
        `)
        .eq('student_id', studentId);

      if (readingError && readingError.code !== 'PGRST116') {
        console.error('Error fetching reading status:', readingError);
      } else if (readingData) {
        setReadingStatusData(readingData || []);
      }

    } catch (error: any) {
      console.error('Error fetching student data:', error);
      setError('Rapor yüklenirken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  // Grafik verileri hazırlama
  const prepareChartData = () => {
    if (!questionStatsData.length) return null;

    const bookStats: Record<string, { correct: number; wrong: number; blank: number }> = {};
    
    questionStatsData.forEach((assignment: any) => {
      const bookTitle = assignment.books?.title || 'Bilinmeyen Kitap';
      
      if (!bookStats[bookTitle]) {
        bookStats[bookTitle] = { correct: 0, wrong: 0, blank: 0 };
      }
      
      bookStats[bookTitle].correct += assignment.correct_answers || 0;
      bookStats[bookTitle].wrong += assignment.wrong_answers || 0;
      bookStats[bookTitle].blank += assignment.blank_answers || 0;
    });

    const chartData = {
      labels: Object.keys(bookStats),
      datasets: [
        {
          label: 'Doğru',
          data: Object.values(bookStats).map(stats => stats.correct),
          backgroundColor: 'rgba(34, 197, 94, 0.8)',
          borderColor: 'rgba(34, 197, 94, 1)',
          borderWidth: 1,
        },
        {
          label: 'Yanlış',
          data: Object.values(bookStats).map(stats => stats.wrong),
          backgroundColor: 'rgba(239, 68, 68, 0.8)',
          borderColor: 'rgba(239, 68, 68, 1)',
          borderWidth: 1,
        },
        {
          label: 'Boş',
          data: Object.values(bookStats).map(stats => stats.blank),
          backgroundColor: 'rgba(156, 163, 175, 0.8)',
          borderColor: 'rgba(156, 163, 175, 1)',
          borderWidth: 1,
        },
      ],
    };

    return { chartData, bookStats };
  };

  // Kitap bazında istatistikler
  const getBookStatistics = () => {
    if (!questionStatsData.length) return [];

    const bookStats: Record<string, { correct: number; wrong: number; blank: number }> = {};
    
    questionStatsData.forEach((assignment: any) => {
      const bookTitle = assignment.books?.title || 'Bilinmeyen Kitap';
      
      if (!bookStats[bookTitle]) {
        bookStats[bookTitle] = { correct: 0, wrong: 0, blank: 0 };
      }
      
      bookStats[bookTitle].correct += assignment.correct_answers || 0;
      bookStats[bookTitle].wrong += assignment.wrong_answers || 0;
      bookStats[bookTitle].blank += assignment.blank_answers || 0;
    });

    return Object.keys(bookStats).map(bookTitle => {
      const stats = bookStats[bookTitle];
      const totalQuestions = stats.correct + stats.wrong + stats.blank;
      const successRate = totalQuestions > 0 ? Math.round((stats.correct / totalQuestions) * 100) : 0;
      
      return {
        bookTitle,
        totalQuestions,
        successRate,
        correct: stats.correct,
        wrong: stats.wrong,
        blank: stats.blank
      };
    });
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Kitap Bazında Soru Çözme İstatistikleri',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1,
        },
      },
    },
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Rapor yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (error || !student) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h2 className="text-2xl font-bold text-red-600 mb-2">Rapor Bulunamadı</h2>
          <p className="text-gray-600">{error || 'Bu rapor mevcut değil veya erişim izniniz bulunmuyor.'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <GraduationCap className="h-8 w-8 text-blue-600 mr-3" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{student.name} - Öğrenci Raporu</h1>
                <p className="text-gray-600">Akademik Performans Raporu</p>
              </div>
            </div>
            <div className="text-right text-sm text-gray-500">
              <div className="flex items-center">
                <Calendar className="h-4 w-4 mr-1" />
                {new Date().toLocaleDateString('tr-TR')}
              </div>
            </div>
          </div>

          {/* Öğrenci Bilgileri */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
            <div>
              <span className="text-sm font-medium text-gray-600">Email:</span>
              <p className="text-gray-900">{student.email || 'Belirtilmemiş'}</p>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-600">Okul:</span>
              <p className="text-gray-900">{student.school || 'Belirtilmemiş'}</p>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-600">Sınıf:</span>
              <p className="text-gray-900">{student.grade || 'Belirtilmemiş'}</p>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-600">Alan:</span>
              <p className="text-gray-900">{student.field || 'Belirtilmemiş'}</p>
            </div>
          </div>
        </div>

        {/* Soru İstatistikleri */}
        {questionStatsData.length > 0 ? (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Soru Çözme İstatistikleri</h2>
            
            {/* Grafik */}
            <div className="h-80 mb-6">
              {prepareChartData() && <Bar data={prepareChartData()!.chartData} options={chartOptions} />}
            </div>
            
            {/* Özet İstatistikler */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-700">
                  {questionStatsData.reduce((sum: number, item: any) => 
                    sum + (item.correct_answers || 0) + (item.wrong_answers || 0) + (item.blank_answers || 0), 0)}
                </div>
                <div className="text-blue-600 font-medium">Toplam Soru</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-700">
                  {questionStatsData.reduce((sum: number, item: any) => sum + (item.correct_answers || 0), 0)}
                </div>
                <div className="text-green-600 font-medium">Toplam Doğru</div>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <div className="text-2xl font-bold text-red-700">
                  {questionStatsData.reduce((sum: number, item: any) => sum + (item.wrong_answers || 0), 0)}
                </div>
                <div className="text-red-600 font-medium">Toplam Yanlış</div>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-gray-700">
                  {questionStatsData.reduce((sum: number, item: any) => sum + (item.blank_answers || 0), 0)}
                </div>
                <div className="text-gray-600 font-medium">Toplam Boş</div>
              </div>
            </div>
            
            {/* Kitap Bazında Detaylar */}
            {getBookStatistics().length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Kitap Bazında Detaylı İstatistikler</h3>
                <div className="grid gap-4">
                  {getBookStatistics().map((book: any, index: number) => (
                    <div key={index} className="bg-gray-50 p-4 rounded-lg border">
                      <div className="flex justify-between items-start mb-3">
                        <h4 className="font-medium text-gray-800 text-lg">{book.bookTitle}</h4>
                        <div className="text-right">
                          <div className="text-xl font-bold text-blue-600">{book.successRate}%</div>
                          <div className="text-sm text-gray-500">Başarı Oranı</div>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                        <div className="text-center p-3 bg-blue-100 rounded">
                          <div className="font-semibold text-blue-700 text-lg">{book.totalQuestions}</div>
                          <div className="text-blue-600">Toplam Soru</div>
                        </div>
                        <div className="text-center p-3 bg-green-100 rounded">
                          <div className="font-semibold text-green-700 text-lg">{book.correct}</div>
                          <div className="text-green-600">Doğru</div>
                        </div>
                        <div className="text-center p-3 bg-red-100 rounded">
                          <div className="font-semibold text-red-700 text-lg">{book.wrong}</div>
                          <div className="text-red-600">Yanlış</div>
                        </div>
                        <div className="text-center p-3 bg-gray-100 rounded">
                          <div className="font-semibold text-gray-700 text-lg">{book.blank}</div>
                          <div className="text-gray-600">Boş</div>
                        </div>
                      </div>
                      
                      {/* Progress Bar */}
                      <div className="mt-4">
                        <div className="w-full bg-gray-200 rounded-full h-3">
                          <div 
                            className="bg-green-500 h-3 rounded-full transition-all duration-300"
                            style={{ width: `${book.successRate}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <BookOpen className="mx-auto h-16 w-16 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Henüz Soru İstatistiği Yok</h3>
            <p className="text-gray-600">Bu öğrenci için henüz soru çözme verisi bulunmuyor.</p>
          </div>        )}

        {/* Okunan Hikaye Kitapları */}
        {readingStatusData.filter((item: any) => item.books?.is_story_book && item.is_read).length > 0 && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
              <BookOpen className="mr-3 h-6 w-6 text-green-600" />
              Okunan Hikaye Kitapları
            </h2>
            <div className="grid gap-4">
              {readingStatusData
                .filter((item: any) => item.books?.is_story_book && item.is_read)
                .map((item: any, index: number) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-green-50 rounded-lg border-l-4 border-green-500">
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-800 text-lg">{item.books?.title}</h3>
                      {item.books?.author && (
                        <p className="text-gray-600 mt-1">Yazar: {item.books.author}</p>
                      )}
                      {item.reading_date && (
                        <p className="text-sm text-gray-500 mt-1">
                          Okunma Tarihi: {new Date(item.reading_date).toLocaleDateString('tr-TR')}
                        </p>
                      )}
                      {item.notes && (
                        <p className="text-sm text-gray-600 mt-2 italic">"{item.notes}"</p>
                      )}
                    </div>
                    <div className="text-green-600 ml-4">
                      <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                      </svg>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Koç Notları */}
        {coachNotes && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
              <FileText className="mr-3 h-6 w-6 text-blue-600" />
              Koç Değerlendirmesi
            </h2>
            <div className="bg-gray-50 p-4 rounded-lg border-l-4 border-blue-500">
              <p className="text-gray-800 whitespace-pre-wrap">{coachNotes}</p>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="text-center text-gray-500 text-sm mt-8 pb-4">
          <p>Bu rapor öğrenci takip sistemi tarafından otomatik olarak oluşturulmuştur.</p>
          <p className="mt-1">© 2025 Ödev Takip Sistemi</p>
        </div>
      </div>
    </div>
  );
};

export default PublicReport;
