-- 1. Loosen experiments SELECT to public read (keep write policies owner-only)
DROP POLICY IF EXISTS "Users can view own experiments" ON public.experiments;
CREATE POLICY "Experiments are publicly viewable"
  ON public.experiments FOR SELECT
  USING (true);

-- 2. Comments table
CREATE TABLE public.experiment_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  experiment_id UUID NOT NULL REFERENCES public.experiments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  parent_id UUID REFERENCES public.experiment_comments(id) ON DELETE CASCADE,
  body TEXT NOT NULL CHECK (char_length(body) BETWEEN 1 AND 4000),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_experiment_comments_experiment ON public.experiment_comments(experiment_id, created_at);
CREATE INDEX idx_experiment_comments_parent ON public.experiment_comments(parent_id);

ALTER TABLE public.experiment_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Comments are publicly viewable"
  ON public.experiment_comments FOR SELECT USING (true);

CREATE POLICY "Authenticated users can post comments"
  ON public.experiment_comments FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own comments"
  ON public.experiment_comments FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own comments"
  ON public.experiment_comments FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE TRIGGER experiment_comments_set_updated_at
  BEFORE UPDATE ON public.experiment_comments
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 3. Allow profile lookup so commenter names/avatars can render in discussions
DROP POLICY IF EXISTS "Profiles are viewable by owner" ON public.profiles;
CREATE POLICY "Profiles are publicly viewable"
  ON public.profiles FOR SELECT USING (true);

-- 4. Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.experiment_comments;