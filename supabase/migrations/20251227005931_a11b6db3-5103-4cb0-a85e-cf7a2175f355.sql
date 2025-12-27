-- Create evidence_packs table for compliance tracking
CREATE TABLE public.evidence_packs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  due_date DATE,
  status TEXT NOT NULL DEFAULT 'draft',
  progress INTEGER NOT NULL DEFAULT 0,
  total_items INTEGER NOT NULL DEFAULT 0,
  completed_items INTEGER NOT NULL DEFAULT 0,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create evidence_items table for individual evidence documents
CREATE TABLE public.evidence_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pack_id UUID NOT NULL REFERENCES public.evidence_packs(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  file_url TEXT,
  file_name TEXT,
  file_type TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  uploaded_by UUID REFERENCES auth.users(id),
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.evidence_packs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evidence_items ENABLE ROW LEVEL SECURITY;

-- RLS policies for evidence_packs
CREATE POLICY "Users with evidence.read can view evidence packs"
  ON public.evidence_packs FOR SELECT
  USING (has_permission(auth.uid(), 'evidence.read'));

CREATE POLICY "Users with evidence.write can insert evidence packs"
  ON public.evidence_packs FOR INSERT
  WITH CHECK (has_permission(auth.uid(), 'evidence.write'));

CREATE POLICY "Users with evidence.write can update evidence packs"
  ON public.evidence_packs FOR UPDATE
  USING (has_permission(auth.uid(), 'evidence.write'))
  WITH CHECK (has_permission(auth.uid(), 'evidence.write'));

CREATE POLICY "Users with evidence.write can delete evidence packs"
  ON public.evidence_packs FOR DELETE
  USING (has_permission(auth.uid(), 'evidence.write'));

-- RLS policies for evidence_items
CREATE POLICY "Users with evidence.read can view evidence items"
  ON public.evidence_items FOR SELECT
  USING (has_permission(auth.uid(), 'evidence.read'));

CREATE POLICY "Users with evidence.write can insert evidence items"
  ON public.evidence_items FOR INSERT
  WITH CHECK (has_permission(auth.uid(), 'evidence.write'));

CREATE POLICY "Users with evidence.write can update evidence items"
  ON public.evidence_items FOR UPDATE
  USING (has_permission(auth.uid(), 'evidence.write'))
  WITH CHECK (has_permission(auth.uid(), 'evidence.write'));

CREATE POLICY "Users with evidence.write can delete evidence items"
  ON public.evidence_items FOR DELETE
  USING (has_permission(auth.uid(), 'evidence.write'));

-- Triggers for updated_at
CREATE TRIGGER update_evidence_packs_updated_at
  BEFORE UPDATE ON public.evidence_packs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_evidence_items_updated_at
  BEFORE UPDATE ON public.evidence_items
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Indexes
CREATE INDEX idx_evidence_packs_status ON public.evidence_packs(status);
CREATE INDEX idx_evidence_packs_category ON public.evidence_packs(category);
CREATE INDEX idx_evidence_packs_due_date ON public.evidence_packs(due_date);
CREATE INDEX idx_evidence_items_pack_id ON public.evidence_items(pack_id);
CREATE INDEX idx_evidence_items_status ON public.evidence_items(status);