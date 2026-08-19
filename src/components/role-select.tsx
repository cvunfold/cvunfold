"use client";

import { PopoverSelect } from "@/components/popover-select";
import { getTargetRoleOptions, getTargetRoleProfile, type TargetRoleId } from "@/lib/roles";
import type { Locale } from "@/lib/i18n";

type RoleSelectProps = {
  value: TargetRoleId;
  onChange: (value: TargetRoleId) => void;
  disabled?: boolean;
  locale: Locale;
};

export function RoleSelect({ value, onChange, disabled = false, locale }: RoleSelectProps) {
  const roles = getTargetRoleOptions(locale);
  const selected = getTargetRoleProfile(value, locale);
  return <PopoverSelect
    label={locale === "pl" ? "Rola docelowa" : "Target role"}
    value={value}
    options={roles.map((role) => ({ id: role.id, mark: role.shortLabel, label: role.label, description: role.description }))}
    onChange={onChange}
    disabled={disabled}
    popoverTitle={locale === "pl" ? "Wybierz specjalizację" : "Choose a specialisation"}
    popoverSubtitle={locale === "pl" ? "Kryteria raportu dopasują się do roli." : "The report criteria adapt to the role."}
    // Only the experimental case has anything to add: the report already uses
    // role-specific criteria by default, so saying so for every other option
    // would just repeat what picking a role already implies.
    helper={selected.experimental ? <small className="role-helper experimental" role="note">
      {locale === "pl"
        ? "Tryb eksperymentalny: analizę CV Unfold zoptymalizowaliśmy i przetestowaliśmy dla wymienionych ról IT. Dla pozostałych specjalizacji użyjemy kryteriów ogólnych, więc wynik może być mniej precyzyjny. Bezpłatny wynik wstępny zobaczysz przed zakupem."
        : "Experimental mode: we optimised and tested CV Unfold for the listed IT roles. Other specialisations use general criteria, so the result may be less precise. You will see the free initial result before purchase."}
    </small> : null}
  />;
}
