-- Replaces the single "non_it" catch-all with a closed set of specific non-IT categories,
-- so "who clicks the ad by mistake" is answerable without ever storing free text or a
-- per-analysis timestamp. Same anonymization as before: a fixed enum, no analysis/report
-- identifier, no timestamp, and cells below ANONYMOUS_ROLE_MIN_CELL_COUNT stay suppressed
-- in the app layer. This must be kept in lockstep with src/lib/analytics/anonymous-role-statistics.ts.
-- The old constraint must go first: it does not allow other_non_it, so the fold-in below
-- would violate it. The table is briefly unconstrained on this column between here and the
-- new constraint a few statements down, all within one migration transaction.
alter table public.anonymous_role_aggregates drop constraint anonymous_role_aggregates_role_category_check;

-- Fold existing non_it rows into the new other_non_it catch-all. The raw perceived role
-- behind these counts was never retained, so retroactive reclassification into a finer
-- bucket is not possible or attempted.
insert into public.anonymous_role_aggregates (role_category, source_bucket, analysis_count)
select 'other_non_it', source_bucket, analysis_count
from public.anonymous_role_aggregates
where role_category = 'non_it'
on conflict (role_category, source_bucket)
do update set analysis_count = public.anonymous_role_aggregates.analysis_count + excluded.analysis_count;
delete from public.anonymous_role_aggregates where role_category = 'non_it';

alter table public.anonymous_role_aggregates add constraint anonymous_role_aggregates_role_category_check
  check (role_category in (
    'supported_it', 'other_it', 'unclear',
    'architecture_construction', 'healthcare_medical', 'legal', 'education_academia',
    'finance_accounting', 'sales_marketing', 'hr_recruiting', 'public_sector',
    'hospitality_retail', 'creative_arts_media', 'engineering_manufacturing_nonit',
    'skilled_trades', 'science_research_nonit', 'other_non_it'
  ));

create or replace function private.classify_anonymous_perceived_role(p_role text)
returns text
language plpgsql
immutable
security invoker
set search_path = ''
as $$
declare
  normalized text := regexp_replace(
    translate(lower(trim(coalesce(p_role, ''))), 'ąćęłńóśźż', 'acelnoszz'),
    '[^a-z0-9+#.-]+', ' ', 'g'
  );
begin
  normalized := trim(regexp_replace(normalized, '[[:space:]]+', ' ', 'g'));

  if normalized = ''
    or normalized ~ '^(unknown|unclear|n a|not specified|not clear|nieznan[ay]|niejasn[ay]|nieokreslon[ay]|brak danych|student|freelancer|consultant|manager|specialist|engineer)$'
    or normalized ~ '(cannot|unable to|insufficient).*(determine|infer)'
    or normalized ~ 'nie (mozna|da sie).*(okreslic|ustalic)'
  then return 'unclear';
  end if;

  -- Checked before the bare "developer" pattern below: business/sales development titles
  -- contain "developer" but describe sales work, not software work.
  if normalized ~ '(business|sales) development|business developer' then return 'sales_marketing'; end if;

  if normalized ~ '(front[- ]?end|back[- ]?end|full[- ]?stack|software|web|mobile|android|ios|embedded|game) (developer|engineer|programmer|programist(a|ka))'
    or normalized ~ '(^| )(developer|programmer|programist(a|ka))( |$)'
    or normalized ~ '(^| )(qa|quality assurance|software tester|test automation|automation tester|tester automatyzujacy)( |$)'
    or normalized ~ '(^| )(devops|site reliability engineer|sre|platform engineer)( |$)'
  then return 'supported_it';
  end if;

  if normalized ~ '(data (engineer|scientist|analyst)|machine learning|ml engineer|ai engineer|security engineer|cybersecurity|cloud engineer|infrastructure engineer|network engineer|system administrator|administrator systemow|database administrator|dba|it support|help ?desk|solutions architect|software architect|product manager|product owner|scrum master|business analyst|technical writer|technical project manager|it recruiter|recruiter it)'
    or normalized ~ '(^| )(ux|ui) (designer|researcher)( |$)'
  then return 'other_it';
  end if;

  if normalized ~ 'architek(t|tka|tura)|urbanist(a|ka)|budownictwo|konstruktor budowlany|architect(ure)?|urban plan(ner|ning)|building design' then return 'architecture_construction'; end if;
  if normalized ~ 'lekar(z|ka)|pielegniar(z|ka)|ratownik medyczny|stomatolog|dentyst(a|ka)|farmaceut(a|ka)|fizjoterapeut(a|ka)|weterynarz|physician|doctor|nurse|dentist|pharmacist|physiotherapist|veterinarian|medical|healthcare' then return 'healthcare_medical'; end if;
  if normalized ~ 'prawni(k|czka)|adwokat(ka)?|radca prawny|notariusz|sedzia|prokurator(ka)?|lawyer|attorney|solicitor|legal counsel|paralegal|judge' then return 'legal'; end if;
  if normalized ~ 'nauczyciel(ka)?|pedagog|wykladowca|nauczyciel akademicki|profesor|teacher|professor|lecturer|tutor|academic' then return 'education_academia'; end if;
  if normalized ~ 'ksiegow(y|a|osc)|analityk finansowy|doradca finansowy|kontroler finansowy|bankowiec|accountant|accounting|bookkeep(er|ing)|financial analyst|auditor|financial controller|bank(ing|er)' then return 'finance_accounting'; end if;
  if normalized ~ 'sprzedawc(a|zyni)|sprzedaz|handlowiec|przedstawiciel handlowy|marketing(owiec)?|specjalist(a|ka) ds marketingu|sales(person)?|marketer|account executive|brand manager' then return 'sales_marketing'; end if;
  if normalized ~ 'kadry|dzial personalny|specjalist(a|ka) hr|human resources|hr (specialist|business partner)|talent acquisition' then return 'hr_recruiting'; end if;
  if normalized ~ 'urzednik|administracja publiczna|samorzad|policjant(ka)?|straza(k|czka)|zolnierz|civil servant|public administration|police officer|firefighter|military|government official' then return 'public_sector'; end if;
  if normalized ~ 'kelner(ka)?|kucharz|szef kuchni|barista|recepcjonist(a|ka)|kasjer(ka)?|waiter|waitress|chef|cook|receptionist|retail (associate|worker)|cashier|hospitality' then return 'hospitality_retail'; end if;
  if normalized ~ 'grafik|ilustrator(ka)?|fotograf(ka)?|dziennikarz|dziennikarka|redaktor(ka)?|aktor(ka)?|muzyk|artyst(a|ka)|graphic designer|illustrator|photographer|journalist|editor|actor|musician|artist' then return 'creative_arts_media'; end if;
  if normalized ~ 'inzynier (mechanik|elektryk|budownictwa|produkcji|procesu|chemik)|mechanical engineer|electrical engineer|civil engineer|production engineer|process engineer|chemical engineer' then return 'engineering_manufacturing_nonit'; end if;
  if normalized ~ 'elektryk|hydraulik|spawacz|mechanik samochodowy|stolarz|murarz|electrician|plumber|welder|(auto|car) mechanic|carpenter|mason' then return 'skilled_trades'; end if;
  if normalized ~ 'biolog(ka)?|chemik|fizyk(iem)?|naukowiec|badacz(ka)?|biologist|chemist|physicist|scientist|researcher' then return 'science_research_nonit'; end if;

  return 'other_non_it';
end;
$$;

revoke all on function private.classify_anonymous_perceived_role(text) from public, anon, authenticated;
grant execute on function private.classify_anonymous_perceived_role(text) to service_role;
