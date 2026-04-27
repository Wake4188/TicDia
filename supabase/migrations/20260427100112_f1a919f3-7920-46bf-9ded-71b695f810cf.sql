
-- 1. Explicitly block non-admin writes to user_roles (defense in depth against privilege escalation)
-- RLS already denies by default, but explicit policies make the intent clear.
CREATE POLICY "Only admins can insert user roles"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Only admins can update user roles"
ON public.user_roles
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Only admins can delete user roles"
ON public.user_roles
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role));

-- Allow admins to view all user roles (for admin panel)
CREATE POLICY "Admins can view all user roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role));

-- 2. Harden contact_messages: when an authenticated user submits, the user_id MUST match auth.uid().
-- Anonymous submissions (user_id IS NULL) are still allowed for the public contact form.
DROP POLICY IF EXISTS "Anyone can submit contact messages" ON public.contact_messages;

CREATE POLICY "Anyone can submit contact messages"
ON public.contact_messages
FOR INSERT
TO public
WITH CHECK (
  -- Anonymous submission: user_id must be NULL
  (auth.uid() IS NULL AND user_id IS NULL)
  OR
  -- Authenticated submission: user_id must match the authenticated user
  (auth.uid() IS NOT NULL AND user_id = auth.uid())
);

-- 3. Add a per-IP/per-user rate limit trigger for contact_messages to prevent spam abuse.
-- Limits: max 5 messages per user_id per hour, max 20 anonymous messages per hour globally.
CREATE OR REPLACE FUNCTION public.check_contact_message_rate_limit()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Authenticated user rate limit: 5 messages per hour
  IF NEW.user_id IS NOT NULL THEN
    IF (SELECT COUNT(*) FROM public.contact_messages
        WHERE user_id = NEW.user_id
          AND created_at > NOW() - INTERVAL '1 hour') >= 5 THEN
      RAISE EXCEPTION 'Rate limit exceeded: maximum 5 contact messages per hour';
    END IF;
  ELSE
    -- Anonymous global rate limit: 20 messages per hour total
    IF (SELECT COUNT(*) FROM public.contact_messages
        WHERE user_id IS NULL
          AND created_at > NOW() - INTERVAL '1 hour') >= 20 THEN
      RAISE EXCEPTION 'Rate limit exceeded: too many anonymous submissions, please try again later';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS contact_messages_rate_limit ON public.contact_messages;
CREATE TRIGGER contact_messages_rate_limit
BEFORE INSERT ON public.contact_messages
FOR EACH ROW
EXECUTE FUNCTION public.check_contact_message_rate_limit();
