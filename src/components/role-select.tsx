"use client";

import { PopoverSelect } from "@/components/popover-select";
import { getTargetRoleOptions, getTargetRoleProfile, type TargetRoleId } from "@/lib/roles";
import type { Locale } from "@/lib/i18n";

type RoleSelectProps = {
  value: TargetRoleId | null;
  required?: boolean;
  onChange: (value: TargetRoleId) => void;
  disabled?: boolean;
  locale: Locale;
};

export function RoleSelect({ value, onChange, disabled = false, locale, required = false }: RoleSelectProps) {
  const roles = getTargetRoleOptions(locale);
  const selected = value ? getTargetRoleProfile(value, locale) : null;
  return <PopoverSelect
    label={<>{locale === "pl" ? "Rola docelowa" : "Target role"}{required ? <span className="role-label-optional"> ({locale === "pl" ? "wymagane" : "required"})</span> : null}</>}
    placeholder={locale === "pl" ? "Wybierz rolę docelową" : "Choose a target role"}
    required={required}
    value={value}
    options={roles.map((role) => ({ id: role.id, mark: role.shortLabel, label: role.label, description: role.description }))}
    onChange={onChange}
    disabled={disabled}
    popoverTitle={locale === "pl" ? "Wybierz specjalizację" : "Choose a specialisation"}
    popoverSubtitle={locale === "pl" ? "Kryteria raportu dopasują się do roli." : "The report criteria adapt to the role."}
    // Pilot roles retain specialised criteria; the generic fallback is separate.
    helper={selected?.pilot ? <small className="role-helper" role="note">
      {locale === "pl"
        ? "Specjalizacja AI w pilotażu. Wynik traktuj jako orientacyjny i sprawdź wskazówki przed zmianą CV."
        : "AI specialisation pilot. Treat the score as indicative and check the recommendations before editing your CV."}
    </small> : selected?.experimental ? <small className="role-helper experimental" role="note">
      {locale === "pl"
        ? "Tryb eksperymentalny: analizę CV Unfold zoptymalizowaliśmy i przetestowaliśmy dla wymienionych ról IT. Dla pozostałych specjalizacji użyjemy kryteriów ogólnych, więc wynik może być mniej precyzyjny. Bezpłatny wynik wstępny zobaczysz przed zakupem."
        : "Experimental mode: we optimised and tested CV Unfold for the listed IT roles. Other specialisations use general criteria, so the result may be less precise. You will see the free initial result before purchase."}
    </small> : null}
  />;
}
