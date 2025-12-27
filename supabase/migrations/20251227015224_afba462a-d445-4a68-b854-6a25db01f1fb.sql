-- Create report_cards table for storing generated report cards
CREATE TABLE public.report_cards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  term TEXT NOT NULL,
  academic_year TEXT NOT NULL,
  total_marks NUMERIC(7,2),
  obtained_marks NUMERIC(7,2),
  percentage NUMERIC(5,2),
  grade TEXT,
  rank INTEGER,
  teacher_remarks TEXT,
  principal_remarks TEXT,
  attendance_percentage NUMERIC(5,2),
  status TEXT NOT NULL DEFAULT 'draft',
  generated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  published_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  UNIQUE(student_id, term, academic_year)
);

-- Create report_card_subjects for individual subject grades
CREATE TABLE public.report_card_subjects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  report_card_id UUID NOT NULL REFERENCES public.report_cards(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  max_marks NUMERIC(5,2) NOT NULL,
  obtained_marks NUMERIC(5,2),
  grade TEXT,
  teacher_id UUID REFERENCES public.staff(id) ON DELETE SET NULL,
  remarks TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.report_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_card_subjects ENABLE ROW LEVEL SECURITY;

-- Report cards policies
CREATE POLICY "Authenticated users can view report cards"
ON public.report_cards
FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users with students.write can insert report cards"
ON public.report_cards
FOR INSERT
WITH CHECK (has_permission(auth.uid(), 'students.write'));

CREATE POLICY "Users with students.write can update report cards"
ON public.report_cards
FOR UPDATE
USING (has_permission(auth.uid(), 'students.write'))
WITH CHECK (has_permission(auth.uid(), 'students.write'));

CREATE POLICY "Users with students.write can delete report cards"
ON public.report_cards
FOR DELETE
USING (has_permission(auth.uid(), 'students.write'));

-- Report card subjects policies
CREATE POLICY "Authenticated users can view report card subjects"
ON public.report_card_subjects
FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users with students.write can manage report card subjects"
ON public.report_card_subjects
FOR ALL
USING (has_permission(auth.uid(), 'students.write'))
WITH CHECK (has_permission(auth.uid(), 'students.write'));

-- Triggers
CREATE TRIGGER update_report_cards_updated_at
BEFORE UPDATE ON public.report_cards
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();