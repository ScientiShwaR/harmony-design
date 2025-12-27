-- Create certificate_templates table
CREATE TABLE public.certificate_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  template_type TEXT NOT NULL DEFAULT 'achievement',
  header_text TEXT NOT NULL DEFAULT 'Certificate of Achievement',
  body_template TEXT NOT NULL DEFAULT 'This is to certify that {{student_name}} of {{class_name}} has successfully {{achievement}}.',
  footer_text TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Create certificates table for issued certificates
CREATE TABLE public.certificates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  template_id UUID NOT NULL REFERENCES public.certificate_templates(id) ON DELETE RESTRICT,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  class_id UUID REFERENCES public.classes(id) ON DELETE SET NULL,
  certificate_number TEXT NOT NULL UNIQUE,
  issued_date DATE NOT NULL DEFAULT CURRENT_DATE,
  achievement_text TEXT,
  custom_fields JSONB,
  status TEXT NOT NULL DEFAULT 'issued',
  issued_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.certificate_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;

-- Certificate templates policies
CREATE POLICY "Authenticated users can view certificate templates"
ON public.certificate_templates
FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users with students.write can manage certificate templates"
ON public.certificate_templates
FOR ALL
USING (has_permission(auth.uid(), 'students.write'))
WITH CHECK (has_permission(auth.uid(), 'students.write'));

-- Certificates policies
CREATE POLICY "Authenticated users can view certificates"
ON public.certificates
FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users with students.write can manage certificates"
ON public.certificates
FOR ALL
USING (has_permission(auth.uid(), 'students.write'))
WITH CHECK (has_permission(auth.uid(), 'students.write'));

-- Triggers
CREATE TRIGGER update_certificate_templates_updated_at
BEFORE UPDATE ON public.certificate_templates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_certificates_updated_at
BEFORE UPDATE ON public.certificates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default templates
INSERT INTO public.certificate_templates (name, template_type, header_text, body_template, footer_text) VALUES
('Achievement Certificate', 'achievement', 'Certificate of Achievement', 'This is to certify that {{student_name}} of Class {{class_name}} has demonstrated outstanding achievement in {{achievement}}.', 'Awarded with pride and appreciation.'),
('Completion Certificate', 'completion', 'Certificate of Completion', 'This is to certify that {{student_name}} has successfully completed {{achievement}} during the academic year {{academic_year}}.', 'Congratulations on this accomplishment!'),
('Merit Certificate', 'merit', 'Certificate of Merit', 'This certificate is awarded to {{student_name}} of Class {{class_name}} in recognition of exceptional performance and dedication in {{achievement}}.', 'Keep up the excellent work!'),
('Participation Certificate', 'participation', 'Certificate of Participation', 'This is to certify that {{student_name}} of Class {{class_name}} has actively participated in {{achievement}}.', 'Thank you for your participation!');