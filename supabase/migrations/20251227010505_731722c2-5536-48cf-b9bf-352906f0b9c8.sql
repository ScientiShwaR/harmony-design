-- Create classes table
CREATE TABLE public.classes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  section TEXT,
  academic_year TEXT NOT NULL,
  class_teacher_id UUID REFERENCES public.staff(id),
  room_number TEXT,
  capacity INTEGER DEFAULT 40,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;

-- RLS policies for classes (all authenticated users can read)
CREATE POLICY "Authenticated users can view classes"
  ON public.classes FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users with students.write can manage classes"
  ON public.classes FOR INSERT
  WITH CHECK (has_permission(auth.uid(), 'students.write'));

CREATE POLICY "Users with students.write can update classes"
  ON public.classes FOR UPDATE
  USING (has_permission(auth.uid(), 'students.write'))
  WITH CHECK (has_permission(auth.uid(), 'students.write'));

CREATE POLICY "Users with students.write can delete classes"
  ON public.classes FOR DELETE
  USING (has_permission(auth.uid(), 'students.write'));

-- Trigger for updated_at
CREATE TRIGGER update_classes_updated_at
  BEFORE UPDATE ON public.classes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Indexes
CREATE INDEX idx_classes_academic_year ON public.classes(academic_year);
CREATE INDEX idx_classes_is_active ON public.classes(is_active);
CREATE INDEX idx_classes_class_teacher ON public.classes(class_teacher_id);

-- Update students table to reference classes properly
ALTER TABLE public.students 
  ALTER COLUMN class_id TYPE UUID USING class_id::uuid;