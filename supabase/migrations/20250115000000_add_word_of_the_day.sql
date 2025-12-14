-- Create word_of_the_day table to store daily words
CREATE TABLE public.word_of_the_day (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  word TEXT NOT NULL,
  word_date DATE NOT NULL DEFAULT CURRENT_DATE,
  is_admin_selected BOOLEAN NOT NULL DEFAULT false,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(word_date)
);

-- Create index on word_date for fast lookups
CREATE INDEX idx_word_of_the_day_date ON public.word_of_the_day(word_date);

-- Enable RLS
ALTER TABLE public.word_of_the_day ENABLE ROW LEVEL SECURITY;

-- Everyone can view the word of the day
CREATE POLICY "Everyone can view word of the day"
ON public.word_of_the_day
FOR SELECT
TO public
USING (true);

-- Admins can insert word of the day
CREATE POLICY "Admins can create word of the day"
ON public.word_of_the_day
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Admins can update word of the day
CREATE POLICY "Admins can update word of the day"
ON public.word_of_the_day
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Admins can delete word of the day
CREATE POLICY "Admins can delete word of the day"
ON public.word_of_the_day
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Function to get or generate word of the day for a specific date
-- If no word exists for the date, it will return null (to be handled by application)
CREATE OR REPLACE FUNCTION public.get_word_of_the_day(p_date DATE DEFAULT CURRENT_DATE)
RETURNS TABLE (
  word TEXT,
  word_date DATE,
  is_admin_selected BOOLEAN
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    w.word,
    w.word_date,
    w.is_admin_selected
  FROM public.word_of_the_day w
  WHERE w.word_date = p_date
  LIMIT 1;
$$;
