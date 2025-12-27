-- Create attendance table
CREATE TABLE public.attendance (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('present', 'absent', 'late', 'excused')),
  check_in_time TIME,
  check_out_time TIME,
  notes TEXT,
  marked_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(student_id, date)
);

-- Enable RLS
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users with attendance.read can view attendance"
ON public.attendance
FOR SELECT
USING (public.has_permission(auth.uid(), 'attendance.read'));

CREATE POLICY "Users with attendance.mark can insert attendance"
ON public.attendance
FOR INSERT
WITH CHECK (public.has_permission(auth.uid(), 'attendance.mark'));

CREATE POLICY "Users with attendance.edit can update attendance"
ON public.attendance
FOR UPDATE
USING (public.has_permission(auth.uid(), 'attendance.edit'))
WITH CHECK (public.has_permission(auth.uid(), 'attendance.edit'));

-- Create trigger for updated_at
CREATE TRIGGER update_attendance_updated_at
  BEFORE UPDATE ON public.attendance
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes
CREATE INDEX idx_attendance_student_date ON public.attendance(student_id, date);
CREATE INDEX idx_attendance_date ON public.attendance(date);
CREATE INDEX idx_attendance_status ON public.attendance(status);