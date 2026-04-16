-- Add seller_id column to missed_opportunities table
-- seller_id references the profiles table (the seller who handled the interaction)

ALTER TABLE public.missed_opportunities
  ADD COLUMN IF NOT EXISTS seller_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS missed_opportunities_seller_id_idx
  ON public.missed_opportunities(seller_id);

COMMENT ON COLUMN public.missed_opportunities.seller_id IS
  'The seller who handled the missed interaction (may differ from the note author).';
