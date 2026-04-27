ALTER TABLE public.user_preferences
  ADD COLUMN IF NOT EXISTS smoke_effect boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS text_animation boolean NOT NULL DEFAULT true;