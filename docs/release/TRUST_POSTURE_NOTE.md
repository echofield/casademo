# Casa One Trust Posture Note (Client-Safe)

Casa One has completed a structured local hardening cycle across access control, data protection, and operational reliability.

Implemented controls include:
- role-based data boundaries (seller vs supervisor)
- inactive-user blocking at application and database levels
- hardened notification generation under explicit privilege model
- removal of direct client-side writes to sensitive tables
- DSAR surfaces for supervisor-controlled export (JSON) and anonymization
- DSAR audit logging with actor/client/timestamp traceability
- security headers and CI secret scanning baseline

Operational status:
- Active pilot usage confirms user adoption and workflow value.
- Production remains unchanged during this freeze phase.
- Release is staged behind migration and validation gates.

Governance note:
- Technical controls are implemented.
- Final GDPR posture also requires customer governance artifacts (RoPA, DPA, retention policy, DSAR process ownership).
