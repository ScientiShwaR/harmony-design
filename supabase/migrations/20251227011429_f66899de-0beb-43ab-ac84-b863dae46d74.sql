-- Create timetable_slots table for storing class schedules
CREATE TABLE public.timetable_slots (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  room_number TEXT,
  teacher_id UUID REFERENCES public.staff(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  is_active BOOLEAN NOT NULL DEFAULT true,
  CONSTRAINT valid_time_range CHECK (end_time > start_time)
);

-- Enable RLS
ALTER TABLE public.timetable_slots ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Authenticated users can view timetable slots"
ON public.timetable_slots
FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users with students.write can insert timetable slots"
ON public.timetable_slots
FOR INSERT
WITH CHECK (has_permission(auth.uid(), 'students.write'));

CREATE POLICY "Users with students.write can update timetable slots"
ON public.timetable_slots
FOR UPDATE
USING (has_permission(auth.uid(), 'students.write'))
WITH CHECK (has_permission(auth.uid(), 'students.write'));

CREATE POLICY "Users with students.write can delete timetable slots"
ON public.timetable_slots
FOR DELETE
USING (has_permission(auth.uid(), 'students.write'));

-- Create trigger for updated_at
CREATE TRIGGER update_timetable_slots_updated_at
BEFORE UPDATE ON public.timetable_slots
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();