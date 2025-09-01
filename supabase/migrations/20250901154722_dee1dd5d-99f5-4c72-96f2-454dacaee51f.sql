-- Fix RLS policy performance warning by avoiding per-row auth function re-evaluation
-- Recreate the SELECT policy using (select auth.uid()) form
DROP POLICY IF EXISTS "Users can view their own achievements" ON public.user_achievements;
CREATE POLICY "Users can view their own achievements"
ON public.user_achievements
FOR SELECT
USING ((select auth.uid()) = user_id);