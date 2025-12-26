-- =====================================================
-- SCHOOL OS v1.0 GOVERNANCE CORE - DATABASE SCHEMA
-- =====================================================

-- 1. Create app_role enum for role types
CREATE TYPE public.app_role AS ENUM ('teacher', 'clerk', 'principal', 'admin');

-- 2. Create profiles table (linked to auth.users)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles RLS: Users can read all profiles, update own
CREATE POLICY "Users can view all profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- 3. Create roles table
CREATE TABLE public.roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name public.app_role NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read roles"
  ON public.roles FOR SELECT
  TO authenticated
  USING (true);

-- 4. Create role_permissions table
CREATE TABLE public.role_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_id UUID NOT NULL REFERENCES public.roles(id) ON DELETE CASCADE,
  permission TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (role_id, permission)
);

ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read role_permissions"
  ON public.role_permissions FOR SELECT
  TO authenticated
  USING (true);

-- 5. Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  assigned_by UUID REFERENCES auth.users(id),
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 6. Create security definer function for role checks (prevents RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Check if user has any of the admin roles
CREATE OR REPLACE FUNCTION public.is_admin(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role IN ('admin', 'principal')
  )
$$;

-- Get all permissions for a user
CREATE OR REPLACE FUNCTION public.get_user_permissions(_user_id UUID)
RETURNS TEXT[]
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(array_agg(DISTINCT rp.permission), ARRAY[]::TEXT[])
  FROM public.user_roles ur
  JOIN public.roles r ON r.name = ur.role
  JOIN public.role_permissions rp ON rp.role_id = r.id
  WHERE ur.user_id = _user_id
$$;

-- Check if user has specific permission
CREATE OR REPLACE FUNCTION public.has_permission(_user_id UUID, _permission TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    -- Admins and principals have all permissions
    public.is_admin(_user_id)
    OR 
    -- Check specific permission
    EXISTS (
      SELECT 1
      FROM public.user_roles ur
      JOIN public.roles r ON r.name = ur.role
      JOIN public.role_permissions rp ON rp.role_id = r.id
      WHERE ur.user_id = _user_id
        AND rp.permission = _permission
    )
$$;

-- User roles RLS: Users can see their own, admins can see all
CREATE POLICY "Users can view own roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR public.is_admin(auth.uid()));

CREATE POLICY "Admins can manage user roles"
  ON public.user_roles FOR ALL
  TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- 7. Create policies table (versioned configuration)
CREATE TABLE public.policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  version INTEGER NOT NULL DEFAULT 1,
  policy_key TEXT NOT NULL,
  policy_value JSONB NOT NULL,
  description TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  is_active BOOLEAN NOT NULL DEFAULT true
);

-- Create index for efficient lookups
CREATE INDEX idx_policies_key_active ON public.policies(policy_key, is_active);
CREATE INDEX idx_policies_version ON public.policies(policy_key, version DESC);

ALTER TABLE public.policies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read active policies"
  ON public.policies FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Policy admins can insert new policy versions"
  ON public.policies FOR INSERT
  TO authenticated
  WITH CHECK (public.has_permission(auth.uid(), 'policies.write'));

-- No UPDATE/DELETE on policies (versioned append-only)

-- 8. Create audit_events table (APPEND-ONLY)
CREATE TABLE public.audit_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  actor_user_id UUID REFERENCES auth.users(id),
  actor_roles TEXT[],
  command_type TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  before_json JSONB,
  after_json JSONB,
  reason TEXT,
  metadata_json JSONB,
  device_id TEXT,
  ip_address INET
);

-- Create indexes for efficient querying
CREATE INDEX idx_audit_events_created_at ON public.audit_events(created_at DESC);
CREATE INDEX idx_audit_events_actor ON public.audit_events(actor_user_id);
CREATE INDEX idx_audit_events_command_type ON public.audit_events(command_type);
CREATE INDEX idx_audit_events_entity ON public.audit_events(entity_type, entity_id);

ALTER TABLE public.audit_events ENABLE ROW LEVEL SECURITY;

-- Audit RLS: audit.read can read, audit.admin can read all
CREATE POLICY "Users with audit.read can view audit events"
  ON public.audit_events FOR SELECT
  TO authenticated
  USING (public.has_permission(auth.uid(), 'audit.read'));

-- NO UPDATE OR DELETE policies - audit is append-only

-- 9. Seed default roles
INSERT INTO public.roles (name, display_name, description) VALUES
  ('teacher', 'Teacher', 'Teaching staff with access to academic features'),
  ('clerk', 'Clerk', 'Administrative staff with access to records management'),
  ('principal', 'Principal', 'School principal with full access'),
  ('admin', 'Administrator', 'System administrator with full access');

-- 10. Seed role permissions

-- Get role IDs
DO $$
DECLARE
  teacher_id UUID;
  clerk_id UUID;
  principal_id UUID;
  admin_id UUID;
BEGIN
  SELECT id INTO teacher_id FROM public.roles WHERE name = 'teacher';
  SELECT id INTO clerk_id FROM public.roles WHERE name = 'clerk';
  SELECT id INTO principal_id FROM public.roles WHERE name = 'principal';
  SELECT id INTO admin_id FROM public.roles WHERE name = 'admin';

  -- Teacher permissions
  INSERT INTO public.role_permissions (role_id, permission) VALUES
    (teacher_id, 'students.read'),
    (teacher_id, 'attendance.read'),
    (teacher_id, 'attendance.mark'),
    (teacher_id, 'evidence.read');

  -- Clerk permissions
  INSERT INTO public.role_permissions (role_id, permission) VALUES
    (clerk_id, 'students.read'),
    (clerk_id, 'students.write'),
    (clerk_id, 'staff.read'),
    (clerk_id, 'evidence.read'),
    (clerk_id, 'evidence.write'),
    (clerk_id, 'exports.generate');

  -- Principal permissions (full access represented by these + is_admin check)
  INSERT INTO public.role_permissions (role_id, permission) VALUES
    (principal_id, 'students.read'),
    (principal_id, 'students.write'),
    (principal_id, 'staff.read'),
    (principal_id, 'staff.write'),
    (principal_id, 'attendance.read'),
    (principal_id, 'attendance.mark'),
    (principal_id, 'attendance.edit'),
    (principal_id, 'evidence.read'),
    (principal_id, 'evidence.write'),
    (principal_id, 'exports.generate'),
    (principal_id, 'audit.read'),
    (principal_id, 'audit.admin'),
    (principal_id, 'policies.read'),
    (principal_id, 'policies.write'),
    (principal_id, 'users.read'),
    (principal_id, 'users.admin'),
    (principal_id, 'roles.read'),
    (principal_id, 'roles.admin');

  -- Admin permissions (same as principal)
  INSERT INTO public.role_permissions (role_id, permission) VALUES
    (admin_id, 'students.read'),
    (admin_id, 'students.write'),
    (admin_id, 'staff.read'),
    (admin_id, 'staff.write'),
    (admin_id, 'attendance.read'),
    (admin_id, 'attendance.mark'),
    (admin_id, 'attendance.edit'),
    (admin_id, 'evidence.read'),
    (admin_id, 'evidence.write'),
    (admin_id, 'exports.generate'),
    (admin_id, 'audit.read'),
    (admin_id, 'audit.admin'),
    (admin_id, 'policies.read'),
    (admin_id, 'policies.write'),
    (admin_id, 'users.read'),
    (admin_id, 'users.admin'),
    (admin_id, 'roles.read'),
    (admin_id, 'roles.admin');
END $$;

-- 11. Seed default policies
INSERT INTO public.policies (policy_key, policy_value, description) VALUES
  ('attendance_edit_window_days', '3', 'Number of days attendance can be edited after marking'),
  ('requires_reason_on_edit', 'true', 'Whether a reason is required when editing records'),
  ('export_permission_required', 'true', 'Whether exports require specific permission'),
  ('break_glass_enabled', 'true', 'Whether break-glass emergency access is enabled'),
  ('break_glass_roles', '["principal", "admin"]', 'Roles that can use break-glass access'),
  ('break_glass_reason_required', 'true', 'Whether break-glass requires a reason');

-- 12. Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
  );
  RETURN NEW;
END;
$$;

-- Create trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 13. Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();