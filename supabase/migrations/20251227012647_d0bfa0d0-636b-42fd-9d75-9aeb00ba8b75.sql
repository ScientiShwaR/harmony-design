-- Create assessments table for exams/tests
CREATE TABLE public.assessments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  assessment_type TEXT NOT NULL DEFAULT 'exam',
  max_marks INTEGER NOT NULL DEFAULT 100,
  passing_marks INTEGER NOT NULL DEFAULT 40,
  assessment_date DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  is_active BOOLEAN NOT NULL DEFAULT true
);

-- Create student_grades table for storing marks
CREATE TABLE public.student_grades (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  assessment_id UUID NOT NULL REFERENCES public.assessments(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  marks_obtained NUMERIC(5,2),
  grade TEXT,
  remarks TEXT,
  graded_by UUID REFERENCES auth.users(id),
  graded_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(assessment_id, student_id)
);

-- Enable RLS
ALTER TABLE public.assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_grades ENABLE ROW LEVEL SECURITY;

-- Assessments policies
CREATE POLICY "Authenticated users can view assessments"
ON public.assessments
FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users with students.write can insert assessments"
ON public.assessments
FOR INSERT
WITH CHECK (has_permission(auth.uid(), 'students.write'));

CREATE POLICY "Users with students.write can update assessments"
ON public.assessments
FOR UPDATE
USING (has_permission(auth.uid(), 'students.write'))
WITH CHECK (has_permission(auth.uid(), 'students.write'));

CREATE POLICY "Users with students.write can delete assessments"
ON public.assessments
FOR DELETE
USING (has_permission(auth.uid(), 'students.write'));

-- Student grades policies
CREATE POLICY "Authenticated users can view student grades"
ON public.student_grades
FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users with students.write can insert grades"
ON public.student_grades
FOR INSERT
WITH CHECK (has_permission(auth.uid(), 'students.write'));

CREATE POLICY "Users with students.write can update grades"
ON public.student_grades
FOR UPDATE
USING (has_permission(auth.uid(), 'students.write'))
WITH CHECK (has_permission(auth.uid(), 'students.write'));

CREATE POLICY "Users with students.write can delete grades"
ON public.student_grades
FOR DELETE
USING (has_permission(auth.uid(), 'students.write'));

-- Triggers for updated_at
CREATE TRIGGER update_assessments_updated_at
BEFORE UPDATE ON public.assessments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_student_grades_updated_at
BEFORE UPDATE ON public.student_grades
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();