import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { publicSupabase } from '../../lib/publicSupabase';
import { BookOpen, FileText, GraduationCap, Calendar, Download } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
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
  const [coachNotes, setCoachNotes] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchStudentData();
  }, [studentId]);
  const fetchStudentData = async () => {
    if (!studentId) return;

    console.log('Fetching data for studentId:', studentId);

    try {
      setLoading(true);
        // Öğrenci bilgilerini al
      const { data: studentData, error: studentError } = await publicSupabase
        .from('students')
        .select('id, name, email, school, grade, field')
        .eq('id', studentId)
        .single();

      if (studentError) throw studentError;

      setStudent(studentData);      // Soru istatistiklerini al
      const { data: assignments, error: assignmentsError } = await publicSupabase
        .from('assignments')
        .select(`
          id,
          correct_answers,
          wrong_answers,
          blank_answers,
          programs(title),
          books(title, subject)
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
        .single();      if (notesError && notesError.code !== 'PGRST116') {
        console.error('Error fetching coach notes:', notesError);      } else if (coachNotesData) {
        setCoachNotes(coachNotesData.notes || '');
      }

    } catch (error: any) {
      console.error('Error fetching student data:', error);
      setError('Rapor yüklenirken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };
  // Grafik verileri hazırlama - ders bazında toplama
  const prepareChartData = () => {
    if (!questionStatsData.length) return null;

    const subjectStats: Record<string, { correct: number; wrong: number; blank: number }> = {};
    
    questionStatsData.forEach((assignment: any) => {
      const subject = assignment.books?.subject || 'Belirtilmemiş Ders';
      
      if (!subjectStats[subject]) {
        subjectStats[subject] = { correct: 0, wrong: 0, blank: 0 };
      }
      
      subjectStats[subject].correct += assignment.correct_answers || 0;
      subjectStats[subject].wrong += assignment.wrong_answers || 0;
      subjectStats[subject].blank += assignment.blank_answers || 0;
    });

    const chartData = {
      labels: Object.keys(subjectStats),
      datasets: [
        {
          label: 'Doğru',
          data: Object.values(subjectStats).map(stats => stats.correct),
          backgroundColor: 'rgba(34, 197, 94, 0.8)',
          borderColor: 'rgba(34, 197, 94, 1)',
          borderWidth: 1,
        },
        {
          label: 'Yanlış',
          data: Object.values(subjectStats).map(stats => stats.wrong),
          backgroundColor: 'rgba(239, 68, 68, 0.8)',
          borderColor: 'rgba(239, 68, 68, 1)',
          borderWidth: 1,
        },
        {
          label: 'Boş',
          data: Object.values(subjectStats).map(stats => stats.blank),
          backgroundColor: 'rgba(156, 163, 175, 0.8)',
          borderColor: 'rgba(156, 163, 175, 1)',
          borderWidth: 1,
        },
      ],
    };

    return { chartData, subjectStats };
  };
  // Ders bazında istatistikler
  const getSubjectStatistics = () => {
    if (!questionStatsData.length) return [];

    const subjectStats: Record<string, { correct: number; wrong: number; blank: number }> = {};
    
    questionStatsData.forEach((assignment: any) => {
      const subject = assignment.books?.subject || 'Belirtilmemiş Ders';
      
      if (!subjectStats[subject]) {
        subjectStats[subject] = { correct: 0, wrong: 0, blank: 0 };
      }
      
      subjectStats[subject].correct += assignment.correct_answers || 0;
      subjectStats[subject].wrong += assignment.wrong_answers || 0;
      subjectStats[subject].blank += assignment.blank_answers || 0;
    });

    return Object.keys(subjectStats).map(subject => {
      const stats = subjectStats[subject];
      const totalQuestions = stats.correct + stats.wrong + stats.blank;
      const successRate = totalQuestions > 0 ? Math.round((stats.correct / totalQuestions) * 100) : 0;
      
      return {
        subject,
        totalQuestions,
        successRate,
        correct: stats.correct,
        wrong: stats.wrong,
        blank: stats.blank      };
    }).sort((a, b) => b.totalQuestions - a.totalQuestions); // En çok soru çözülen dersten başla
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
        text: 'Ders Bazında Soru Çözme İstatistikleri',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1,
        },
      },
    },  };
  const generatePDF = async () => {
    if (!student) return;

    try {
      // PDF butonunu gizle
      const pdfButton = document.querySelector('button') as HTMLElement;
      if (pdfButton) pdfButton.style.display = 'none';

      // Sayfanın screenshot'ını al
      const element = document.getElementById('pdf-content');
      if (!element) return;

      const canvas = await html2canvas(element, {
        scale: 2, // Yüksek kalite için
        useCORS: true,
        allowTaint: false,
        backgroundColor: '#f9fafb', // bg-gray-50
        width: element.scrollWidth,
        height: element.scrollHeight,
      });

      // PDF oluştur
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const canvasAspectRatio = canvas.height / canvas.width;
      const pdfAspectRatio = pdfHeight / pdfWidth;

      let imgWidth, imgHeight, xOffset = 0, yOffset = 0;

      if (canvasAspectRatio > pdfAspectRatio) {
        // Canvas daha uzun - yüksekliğe göre ölçekle
        imgHeight = pdfHeight;
        imgWidth = imgHeight / canvasAspectRatio;
        xOffset = (pdfWidth - imgWidth) / 2;
      } else {
        // Canvas daha geniş - genişliğe göre ölçekle
        imgWidth = pdfWidth;
        imgHeight = imgWidth * canvasAspectRatio;
        yOffset = (pdfHeight - imgHeight) / 2;
      }

      // Eğer sayfa çok uzunsa birden fazla sayfaya böl
      if (imgHeight > pdfHeight) {
        const totalPages = Math.ceil(imgHeight / pdfHeight);
        const singlePageHeight = canvas.height / totalPages;

        for (let page = 0; page < totalPages; page++) {
          if (page > 0) pdf.addPage();

          const sourceY = page * singlePageHeight;
          const pageCanvas = document.createElement('canvas');
          const pageCtx = pageCanvas.getContext('2d');
          
          pageCanvas.width = canvas.width;
          pageCanvas.height = singlePageHeight;
          
          if (pageCtx) {
            pageCtx.drawImage(canvas, 0, -sourceY);
            const pageImgData = pageCanvas.toDataURL('image/png');
            pdf.addImage(pageImgData, 'PNG', xOffset, 0, imgWidth, pdfHeight);
          }
        }
      } else {
        pdf.addImage(imgData, 'PNG', xOffset, yOffset, imgWidth, imgHeight);
      }

      // PDF'i indir
      pdf.save(`${student.name}-raporu.pdf`);

      // PDF butonunu tekrar göster
      if (pdfButton) pdfButton.style.display = 'flex';

    } catch (error) {
      console.error('PDF oluşturulurken hata:', error);
      alert('PDF oluşturulurken bir hata oluştu.');
    }
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
    <div id="pdf-content" className="min-h-screen bg-gray-50 py-8">
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
            </div>            <div className="flex items-center space-x-4">
              <button
                onClick={generatePDF}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Download className="h-4 w-4 mr-2" />
                PDF İndir
              </button>
              <div className="text-right text-sm text-gray-500">
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-1" />
                  {new Date().toLocaleDateString('tr-TR')}
                </div>
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
              {/* Ders Bazında Detaylar */}
            {getSubjectStatistics().length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Ders Bazında Detaylı İstatistikler</h3>
                <div className="grid gap-4">
                  {getSubjectStatistics().map((subject: any, index: number) => (
                    <div key={index} className="bg-gray-50 p-4 rounded-lg border">
                      <div className="flex justify-between items-start mb-3">
                        <h4 className="font-medium text-gray-800 text-lg">{subject.subject}</h4>
                        <div className="text-right">
                          <div className="text-xl font-bold text-blue-600">{subject.successRate}%</div>
                          <div className="text-sm text-gray-500">Başarı Oranı</div>
                        </div>
                      </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                        <div className="text-center p-3 bg-blue-100 rounded">
                          <div className="font-semibold text-blue-700 text-lg">{subject.totalQuestions}</div>
                          <div className="text-blue-600">Toplam Soru</div>
                        </div>
                        <div className="text-center p-3 bg-green-100 rounded">
                          <div className="font-semibold text-green-700 text-lg">{subject.correct}</div>
                          <div className="text-green-600">Doğru</div>
                        </div>
                        <div className="text-center p-3 bg-red-100 rounded">
                          <div className="font-semibold text-red-700 text-lg">{subject.wrong}</div>
                          <div className="text-red-600">Yanlış</div>
                        </div>
                        <div className="text-center p-3 bg-gray-100 rounded">
                          <div className="font-semibold text-gray-700 text-lg">{subject.blank}</div>
                          <div className="text-gray-600">Boş</div>
                        </div>
                      </div>
                      
                      {/* Progress Bar */}
                      <div className="mt-4">
                        <div className="w-full bg-gray-200 rounded-full h-3">
                          <div 
                            className="bg-green-500 h-3 rounded-full transition-all duration-300"
                            style={{ width: `${subject.successRate}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <BookOpen className="mx-auto h-16 w-16 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Henüz Soru İstatistiği Yok</h3>
            <p className="text-gray-600">Bu öğrenci için henüz soru çözme verisi bulunmuyor.</p>
          </div>        )}

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
