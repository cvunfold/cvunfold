# CVUnfold agent rules

## External-resource preflight

Neopadel and every resource owned by another employer or client are **FORBIDDEN**.
Before every external write, identify and record: service, account, organization/team,
project, and environment. Write only when all five unambiguously belong to CVUnfold
or the owner's private business. Otherwise stop the external write and continue locally.
Never copy credentials, billing, domains, repositories, databases, Stripe resources,
OpenAI projects, DNS, or Vercel projects from Neopadel.

CVUnfold and Neopadel may use the same Gmail identity. A shared email address is never
proof that a resource is safe. Ownership is determined by the explicit organization/team,
project and environment visible in the service. GitHub resources must belong to the
separate CVUnfold organization. If any of those fields is missing or ambiguous, treat the
resource as UNKNOWN and do not write. Never cross-link, import or reuse Neopadel assets.

Never commit `.env`, echo secrets, log CV contents, send CV/report content to analytics,
or expose a full report before a verified server-side paid check.
