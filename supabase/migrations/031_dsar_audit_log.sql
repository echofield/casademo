-- Batch 5 hardening: DSAR audit trail for export/anonymize actions

CREATE TABLE IF NOT EXISTS public.dsar_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action_type TEXT NOT NULL CHECK (action_type IN ('export', 'anonymize')),
  actor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE RESTRICT,
  action_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  details JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_dsar_audit_log_client_id
  ON public.dsar_audit_log (client_id, action_at DESC);

CREATE INDEX IF NOT EXISTS idx_dsar_audit_log_actor_id
  ON public.dsar_audit_log (actor_id, action_at DESC);

ALTER TABLE public.dsar_audit_log ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.dsar_audit_log FROM PUBLIC;
GRANT SELECT, INSERT ON TABLE public.dsar_audit_log TO authenticated;
GRANT ALL ON TABLE public.dsar_audit_log TO service_role;

DROP POLICY IF EXISTS dsar_audit_log_supervisor_select ON public.dsar_audit_log;
CREATE POLICY dsar_audit_log_supervisor_select ON public.dsar_audit_log
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.role = 'supervisor'
      AND p.active = true
  )
);

DROP POLICY IF EXISTS dsar_audit_log_supervisor_insert ON public.dsar_audit_log;
CREATE POLICY dsar_audit_log_supervisor_insert ON public.dsar_audit_log
FOR INSERT
WITH CHECK (
  actor_id = auth.uid()
  AND EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.role = 'supervisor'
      AND p.active = true
  )
);
