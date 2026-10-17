"use client";

import { useId, useState } from "react";
import { Star } from "lucide-react";
import type { Locale } from "@/lib/i18n";

const ratings = [1, 2, 3, 4, 5] as const;

export function StarRating({ label = "Ocena", name = "rating", defaultValue = 5, disabled = false, locale = "pl" }: {
  label?: string; name?: string; defaultValue?: number; disabled?: boolean; locale?: Locale;
}) {
  const labelId = useId();
  const [value, setValue] = useState(defaultValue);
  const [hovered, setHovered] = useState<number | null>(null);
  const preview = disabled ? value : hovered ?? value;

  return <fieldset className="star-rating" role="radiogroup" aria-labelledby={labelId} disabled={disabled}>
    <legend id={labelId}>{label}</legend>
    <div className="star-rating-control" onMouseLeave={() => setHovered(null)}>
      <div className="star-rating-stars">
        {ratings.map(rating => <label className={`star-rating-choice${rating <= preview ? " is-filled" : ""}`} key={rating} onMouseEnter={() => setHovered(rating)}>
          <input type="radio" name={name} value={rating} checked={value === rating} onChange={() => { setValue(rating); setHovered(null); }} aria-label={locale === "pl" ? `Ocena ${rating} z 5` : `Rating ${rating} of 5`}/>
          <Star aria-hidden="true" size={27} strokeWidth={1.7}/>
        </label>)}
      </div>
      <span className="star-rating-value" aria-hidden="true">{value}<span>/5</span></span>
    </div>
  </fieldset>;
}
