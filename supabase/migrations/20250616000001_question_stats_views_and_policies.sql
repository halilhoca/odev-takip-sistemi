-- SQL kodları için Supabase veritabanı yapılandırması

-- 1. Assignments tablosuna soru istatistikleri kolonları ekle (zaten eklendi)
-- Bu migration zaten mevcut: 20250616000000_add_question_stats.sql

-- 2. Soru istatistikleri için view oluştur
CREATE OR REPLACE VIEW student_question_stats AS
SELECT 
    s.id as student_id,
    s.name as student_name,
    p.id as program_id,
    p.title as program_title,
    b.title as book_title,
    a.correct_answers,
    a.wrong_answers,
    a.blank_answers,
    (a.correct_answers + a.wrong_answers + a.blank_answers) as total_questions,
    CASE 
        WHEN (a.correct_answers + a.wrong_answers + a.blank_answers) > 0 
        THEN ROUND((a.correct_answers::float / (a.correct_answers + a.wrong_answers + a.blank_answers)) * 100, 2)
        ELSE 0 
    END as success_rate,
    a.day,
    a.created_at
FROM students s
JOIN assignments a ON s.id = a.student_id
JOIN programs p ON a.program_id = p.id
JOIN books b ON a.book_id = b.id
WHERE a.correct_answers IS NOT NULL 
   OR a.wrong_answers IS NOT NULL 
   OR a.blank_answers IS NOT NULL;

-- 3. Öğrenci raporu için toplu istatistik view
CREATE OR REPLACE VIEW student_report_summary AS
SELECT 
    s.id as student_id,
    s.name as student_name,
    COUNT(DISTINCT p.id) as total_programs,
    COUNT(DISTINCT CASE WHEN a.is_completed = true THEN p.id END) as completed_programs,
    COUNT(DISTINCT CASE WHEN a.is_completed = false THEN p.id END) as incomplete_programs,
    SUM(a.correct_answers) as total_correct,
    SUM(a.wrong_answers) as total_wrong,
    SUM(a.blank_answers) as total_blank,
    SUM(a.correct_answers + a.wrong_answers + a.blank_answers) as total_questions,
    CASE 
        WHEN SUM(a.correct_answers + a.wrong_answers + a.blank_answers) > 0 
        THEN ROUND((SUM(a.correct_answers)::float / SUM(a.correct_answers + a.wrong_answers + a.blank_answers)) * 100, 2)
        ELSE 0 
    END as overall_success_rate
FROM students s
LEFT JOIN assignments a ON s.id = a.student_id
LEFT JOIN programs p ON a.program_id = p.id
GROUP BY s.id, s.name;

-- 4. Günlük istatistikler için view
CREATE OR REPLACE VIEW daily_question_stats AS
SELECT 
    s.id as student_id,
    s.name as student_name,
    a.day,
    COUNT(*) as assignment_count,
    SUM(a.correct_answers) as daily_correct,
    SUM(a.wrong_answers) as daily_wrong,
    SUM(a.blank_answers) as daily_blank,
    SUM(a.correct_answers + a.wrong_answers + a.blank_answers) as daily_total,
    CASE 
        WHEN SUM(a.correct_answers + a.wrong_answers + a.blank_answers) > 0 
        THEN ROUND((SUM(a.correct_answers)::float / SUM(a.correct_answers + a.wrong_answers + a.blank_answers)) * 100, 2)
        ELSE 0 
    END as daily_success_rate
FROM students s
JOIN assignments a ON s.id = a.student_id
WHERE a.correct_answers IS NOT NULL 
   OR a.wrong_answers IS NOT NULL 
   OR a.blank_answers IS NOT NULL
GROUP BY s.id, s.name, a.day
ORDER BY s.name, a.day;

-- 5. Assignments tablosunda soru istatistikleri için trigger (otomatik hesaplama)
CREATE OR REPLACE FUNCTION calculate_assignment_totals()
RETURNS TRIGGER AS $$
BEGIN
    -- Toplam soru sayısını hesapla ve yüzdelik başarı oranını güncelle
    NEW.total_questions = COALESCE(NEW.correct_answers, 0) + COALESCE(NEW.wrong_answers, 0) + COALESCE(NEW.blank_answers, 0);
    
    IF NEW.total_questions > 0 THEN
        NEW.success_rate = ROUND((COALESCE(NEW.correct_answers, 0)::float / NEW.total_questions) * 100, 2);
    ELSE
        NEW.success_rate = 0;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger'ı assignments tablosuna ekle
DROP TRIGGER IF EXISTS trigger_calculate_assignment_totals ON assignments;
CREATE TRIGGER trigger_calculate_assignment_totals
    BEFORE INSERT OR UPDATE ON assignments
    FOR EACH ROW
    EXECUTE FUNCTION calculate_assignment_totals();

-- 6. RLS (Row Level Security) politikalarını güncelle
-- Öğrenci kendi soru istatistiklerini görebilsin
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;

-- Öğretmen kendi öğrencilerinin verilerini görebilsin
CREATE POLICY "Users can view their own student assignments" ON assignments
    FOR SELECT USING (
        program_id IN (
            SELECT id FROM programs WHERE user_id = auth.uid()
        )
    );

-- Öğretmen kendi öğrencilerinin verilerini güncelleyebilsin
CREATE POLICY "Users can update their own student assignments" ON assignments
    FOR UPDATE USING (
        program_id IN (
            SELECT id FROM programs WHERE user_id = auth.uid()
        )
    );

-- 7. View'lar için RLS politikaları
CREATE POLICY "Users can view their students' question stats" ON student_question_stats
    FOR SELECT USING (
        program_id IN (
            SELECT id FROM programs WHERE user_id = auth.uid()
        )
    );

-- 8. Index'ler için performans optimizasyonu
CREATE INDEX IF NOT EXISTS idx_assignments_student_stats ON assignments(student_id, correct_answers, wrong_answers, blank_answers);
CREATE INDEX IF NOT EXISTS idx_assignments_program_day ON assignments(program_id, day);
CREATE INDEX IF NOT EXISTS idx_assignments_student_day ON assignments(student_id, day);
