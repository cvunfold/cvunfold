# Privacy and retention

Default retention is 30 days and configurable through `REPORT_RETENTION_DAYS`. Source files are deleted immediately after parsing/analysis. The cleanup endpoint requires `CRON_SECRET`. Users can delete a report immediately with their random access token.

Never log CV text, prompts or reports. For failed document extraction, runtime logs may contain only privacy-safe technical diagnostics: document kind (`pdf`/`docx`), a coarse file-size bucket, parser and parser version, page/text-item counts, extracted character count, parser warning count and a closed failure-reason enum. The allowed extraction reasons are `pdf_no_text_items`, `pdf_empty_text_items`, `pdf_page_extraction_failed`, `pdf_parse_failed`, `pdf_encrypted`, `docx_no_text`, `docx_parse_failed` and `text_below_threshold`. Never log the filename, document text, warning/error message, file hash, private URL, access token or contact data. Analytics allow only event names and non-PII acquisition metadata. Private pages emit `noindex`. Supabase storage must be private; service-role credentials remain backend-only.

The model-perceived role may be used once, inside the server/database transaction that stores a completed report, to increment an anonymous audience-fit counter. The permanent aggregate contains only:

- `role_category`: `supported_it`, `other_it`, `non_it` or `unclear`;
- `source_bucket`: `google_cpc` or `other`;
- `analysis_count`: a cumulative count.

It contains no analysis/report identifier, raw perceived role, timestamp, locale, model or prompt version, IP address, filename, click identifier, UTM, CV content or report content. It is not sent to GA4 or Google Ads and is not used to make a decision about a person. The raw perceived role remains only inside the report and follows report deletion and the 30-day retention limit. Admin diagnostics suppress role cells below five analyses.
