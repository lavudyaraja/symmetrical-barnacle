-- Fix the missing foreign key relationship between posts and comments
ALTER TABLE public.comments ADD CONSTRAINT comments_post_id_fkey FOREIGN KEY (post_id) REFERENCES public.posts(id) ON DELETE CASCADE;

-- Create collaborative posts table
CREATE TABLE public.collaborative_posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  creator_id UUID NOT NULL,
  collaborators UUID[] DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'draft',
  content TEXT,
  media_urls TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for collaborative posts
ALTER TABLE public.collaborative_posts ENABLE ROW LEVEL SECURITY;

-- Collaborative posts policies
CREATE POLICY "Users can view collaborative posts they're part of"
ON public.collaborative_posts FOR SELECT
USING (creator_id = auth.uid() OR auth.uid() = ANY(collaborators));

CREATE POLICY "Users can create collaborative posts"
ON public.collaborative_posts FOR INSERT
WITH CHECK (creator_id = auth.uid());

CREATE POLICY "Creators and collaborators can update posts"
ON public.collaborative_posts FOR UPDATE
USING (creator_id = auth.uid() OR auth.uid() = ANY(collaborators));

-- Add updated_at trigger
CREATE TRIGGER update_collaborative_posts_updated_at
BEFORE UPDATE ON public.collaborative_posts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create AI features table for storing AI-generated content
CREATE TABLE public.ai_features (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  feature_type TEXT NOT NULL, -- 'caption', 'translation', 'summary', 'smart_reply'
  input_content TEXT NOT NULL,
  output_content TEXT NOT NULL,
  language_from TEXT,
  language_to TEXT,
  confidence_score DECIMAL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for AI features
ALTER TABLE public.ai_features ENABLE ROW LEVEL SECURITY;

-- AI features policies
CREATE POLICY "Users can view their own AI features"
ON public.ai_features FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create AI features"
ON public.ai_features FOR INSERT
WITH CHECK (auth.uid() = user_id);