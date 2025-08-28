# Security & Compliance Posture

## Core Security
- Authentication: Clerk (MFA encouraged); session management best practices
- Authorization: scoped tool permissions; least-privilege defaults
- Encryption: AES-256-GCM for provider tokens; server-side only
- Webhooks: signature verification; replay protection; audit logging
- Secrets: never exposed client-side; rotate periodically

## AI/CV Safeguards
- AI: confirmations for destructive/bulk; audit tool runs
- CV: explicit consent; mode indicators; local-only with redaction; retention policy

## Compliance (guidance)
- SOC 2 readiness: logging, change management, access reviews, backups, incident response
- GDPR: DPIA for CV; consent logs; right to access/erasure; data minimization
- CCPA: transparency; opt-out pathways; retention schedules

## Auditing & Monitoring
- Audit logs: tool calls, consent changes, security events
- Monitoring: alert on anomalous rates (tool failures, auth errors)
- Reviews: quarterly security reviews; annual policy updates
