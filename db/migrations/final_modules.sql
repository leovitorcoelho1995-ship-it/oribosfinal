-- Module 1: Onboarding
ALTER TABLE companies 
ADD COLUMN IF NOT EXISTS onboarding_completed boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS first_login_at timestamp;

-- Module 2: Support
CREATE TABLE IF NOT EXISTS support_messages (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  company_name text NOT NULL,
  subject text NOT NULL,
  message text NOT NULL,
  status text DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved')),
  priority text DEFAULT 'normal' CHECK (priority IN ('normal', 'high')),
  admin_reply text,
  replied_at timestamp,
  created_at timestamp DEFAULT now()
);

-- RLS for support_messages
ALTER TABLE support_messages ENABLE ROW LEVEL SECURITY;

-- Remove existing policies if they exist to allow re-run
DROP POLICY IF EXISTS "Admins view all support messages" ON support_messages;
DROP POLICY IF EXISTS "Admins update support messages" ON support_messages;
DROP POLICY IF EXISTS "Companies view own support messages" ON support_messages;
DROP POLICY IF EXISTS "Companies insert own support messages" ON support_messages;

-- Policy: Admins can see all messages
CREATE POLICY "Admins view all support messages" 
ON support_messages FOR SELECT 
TO authenticated 
USING ( public.is_admin() );

-- Policy: Admins can update messages (to reply)
CREATE POLICY "Admins update support messages" 
ON support_messages FOR UPDATE 
TO authenticated 
USING ( public.is_admin() );

-- Policy: Companies can view their own messages
-- Assumes auth.uid() corresponds to companies.owner_id
CREATE POLICY "Companies view own support messages"
ON support_messages FOR SELECT
TO authenticated
USING (
  company_id IN (
    SELECT id FROM companies WHERE owner_id = auth.uid()
  )
);

-- Policy: Companies can insert their own messages
CREATE POLICY "Companies insert own support messages"
ON support_messages FOR INSERT
TO authenticated
WITH CHECK (
  company_id IN (
    SELECT id FROM companies WHERE owner_id = auth.uid()
  )
);

-- Module 3: Health Dashboard (System Logs)
CREATE TABLE IF NOT EXISTS system_logs (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id uuid REFERENCES companies(id) ON DELETE SET NULL,
    level text DEFAULT 'error' CHECK (level IN ('info', 'warn', 'error', 'critical')),
    message text NOT NULL,
    details jsonb,
    created_at timestamp DEFAULT now()
);

-- RLS for system_logs
ALTER TABLE system_logs ENABLE ROW LEVEL SECURITY;

-- Remove existing policies if they exist
DROP POLICY IF EXISTS "Admins view all system logs" ON system_logs;
DROP POLICY IF EXISTS "Authenticated insert system logs" ON system_logs;

-- Policy: Admins can view all logs
CREATE POLICY "Admins view all system logs"
ON system_logs FOR SELECT
TO authenticated
USING ( public.is_admin() );

-- Policy: Authenticated users (and backend) can insert logs
CREATE POLICY "Authenticated insert system logs"
ON system_logs FOR INSERT
TO authenticated
WITH CHECK ( true );
