-- The report insert runs through the server-side service_role client. Keep the
-- aggregate private, while allowing the trigger to call its private helpers.
grant usage on schema private to service_role;
grant execute on function private.classify_anonymous_perceived_role(text) to service_role;
grant execute on function private.classify_anonymous_acquisition_source(jsonb) to service_role;
grant execute on function private.aggregate_anonymous_perceived_role() to service_role;
