"use client";

import { useId, useRef, useState } from "react";
import {
  formatUgNationalDisplay,
  parseUgNationalDigits,
  ugNationalToE164,
} from "@/lib/ug-phone";

type UgPhoneInputProps = {
  id?: string;
  /** Form field name for E.164 value (+256XXXXXXXXX) */
  name?: string;
  /** Up to 9 national digits (no leading 0 / 256) — e.g. from `e164ToUgNationalDigits` */
  initialNationalDigits?: string;
  disabled?: boolean;
  autoComplete?: string;
};

export function UgPhoneInput({
  id,
  name = "phone",
  initialNationalDigits = "",
  disabled,
  autoComplete = "tel-national",
}: UgPhoneInputProps) {
  const reactId = useId();
  const inputId = id ?? `ug-phone-${reactId.replace(/:/g, "")}`;
  const inputRef = useRef<HTMLInputElement>(null);
  const [national, setNational] = useState(() =>
    parseUgNationalDigits(initialNationalDigits),
  );

  const e164 = ugNationalToE164(national);
  const display = formatUgNationalDisplay(national);

  return (
    <div className="lum-phone-field-wrap">
      <label htmlFor={inputId} className="lum-phone-field-caption">
        Phone number
      </label>
      <div
        className={`lum-phone-shell ${disabled ? "is-disabled" : ""}`}
        onMouseDown={(e) => {
          if (disabled) return;
          if (
            (e.target as HTMLElement).closest("input.lum-phone-shell-input")
          ) {
            return;
          }
          e.preventDefault();
          inputRef.current?.focus();
        }}
      >
        <div className="lum-phone-shell-row">
          <span className="lum-phone-shell-prefix">+256</span>
          <div className="lum-phone-shell-digit-well">
            <span className="lum-phone-shell-sep" aria-hidden="true" />
            <input
              ref={inputRef}
              id={inputId}
              className="lum-phone-shell-input"
              type="tel"
              inputMode="numeric"
              autoComplete={autoComplete}
              disabled={disabled}
              placeholder="700 123 456"
              value={display}
              onChange={(e) => {
                setNational(parseUgNationalDigits(e.target.value));
              }}
              onPaste={(e) => {
                e.preventDefault();
                const text = e.clipboardData.getData("text/plain");
                setNational(parseUgNationalDigits(text));
              }}
            />
          </div>
        </div>
        <input type="hidden" name={name} value={e164 ?? ""} readOnly />
      </div>
    </div>
  );
}
