# Privacy and retention

Default retention is 30 days and configurable through `REPORT_RETENTION_DAYS`. Source files are deleted immediately after parsing/analysis. The cleanup endpoint requires `CRON_SECRET`. Users can delete a report immediately with their random access token.

Never log CV text, prompts or reports. Analytics allow only event names and non-PII acquisition metadata. Private pages emit `noindex`. Supabase storage must be private; service-role credentials remain backend-only.
