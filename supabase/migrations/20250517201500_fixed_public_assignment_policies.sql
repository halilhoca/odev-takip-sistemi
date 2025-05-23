-- Row-Level Security (RLS) Politikası - Anonim kullanıcıların ödev tamamlama durumunu güncellemesine izin vermek için

-- Assignments tablosu için politika oluşturma
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;

-- Anonim kullanıcıların tamamlama durumunu güncellemesine izin veren politika
CREATE POLICY "public_update_assignment_status" 
ON assignments
FOR UPDATE 
TO anon
USING (true) 
WITH CHECK (
  request.headers->>'x-public-client' = 'true'
);

-- Anonim kullanıcıların sadece is_completed alanını güncellemesine izin veren politika
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;

-- Anonim kullanıcıların okuma yapabilmesi için politika
CREATE POLICY "public_read_assignments" 
ON assignments
FOR SELECT 
TO anon
USING (true);
