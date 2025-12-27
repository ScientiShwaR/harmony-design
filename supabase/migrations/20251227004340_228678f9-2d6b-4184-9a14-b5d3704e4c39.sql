-- Create staff table
CREATE TABLE public.staff (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id TEXT NOT NULL UNIQUE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT NOT NULL,
  date_of_birth DATE,
  gender TEXT CHECK (gender IN ('male', 'female', 'other')),
  designation TEXT NOT NULL,
  department TEXT,
  qualification TEXT,
  experience_years INTEGER DEFAULT 0,
  join_date DATE NOT NULL DEFAULT CURRENT_DATE,
  address TEXT,
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,
  blood_group TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'on_leave', 'resigned')),
  user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.staff ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users with staff.read can view staff"
ON public.staff
FOR SELECT
USING (public.has_permission(auth.uid(), 'staff.read'));

CREATE POLICY "Users with staff.write can insert staff"
ON public.staff
FOR INSERT
WITH CHECK (public.has_permission(auth.uid(), 'staff.write'));

CREATE POLICY "Users with staff.write can update staff"
ON public.staff
FOR UPDATE
USING (public.has_permission(auth.uid(), 'staff.write'))
WITH CHECK (public.has_permission(auth.uid(), 'staff.write'));

CREATE POLICY "Users with staff.write can delete staff"
ON public.staff
FOR DELETE
USING (public.has_permission(auth.uid(), 'staff.write'));

-- Create trigger for updated_at
CREATE TRIGGER update_staff_updated_at
  BEFORE UPDATE ON public.staff
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes
CREATE INDEX idx_staff_employee_id ON public.staff(employee_id);
CREATE INDEX idx_staff_department ON public.staff(department);
CREATE INDEX idx_staff_status ON public.staff(status);
CREATE INDEX idx_staff_name ON public.staff(first_name, last_name);