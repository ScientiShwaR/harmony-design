-- Create students table
CREATE TABLE public.students (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  admission_number TEXT NOT NULL UNIQUE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  date_of_birth DATE NOT NULL,
  gender TEXT NOT NULL CHECK (gender IN ('male', 'female', 'other')),
  class_id TEXT,
  section TEXT,
  guardian_name TEXT NOT NULL,
  guardian_phone TEXT NOT NULL,
  guardian_email TEXT,
  address TEXT,
  blood_group TEXT,
  medical_notes TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'transferred', 'graduated')),
  admission_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;

-- Create RLS policies using existing permission functions
CREATE POLICY "Users with students.read can view students"
ON public.students
FOR SELECT
USING (public.has_permission(auth.uid(), 'students.read'));

CREATE POLICY "Users with students.write can insert students"
ON public.students
FOR INSERT
WITH CHECK (public.has_permission(auth.uid(), 'students.write'));

CREATE POLICY "Users with students.write can update students"
ON public.students
FOR UPDATE
USING (public.has_permission(auth.uid(), 'students.write'))
WITH CHECK (public.has_permission(auth.uid(), 'students.write'));

CREATE POLICY "Users with students.write can delete students"
ON public.students
FOR DELETE
USING (public.has_permission(auth.uid(), 'students.write'));

-- Create trigger for updated_at
CREATE TRIGGER update_students_updated_at
  BEFORE UPDATE ON public.students
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for common queries
CREATE INDEX idx_students_admission_number ON public.students(admission_number);
CREATE INDEX idx_students_class_section ON public.students(class_id, section);
CREATE INDEX idx_students_status ON public.students(status);
CREATE INDEX idx_students_name ON public.students(first_name, last_name);