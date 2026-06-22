"use client";

import { useCallback } from "react";

export interface BackgroundOption {
  label: string;
  value: string;
}

export const BACKGROUNDS: BackgroundOption[] = [
  { label: "Midnight", value: "#1a1a2e" },
  { label: "Royal Blue", value: "#1e3a8a" },
  { label: "Emerald", value: "#065f46" },
  { label: "Coral", value: "#dc2626" },
  { label: "Amber", value: "#d97706" },
  { label: "Indigo", value: "#4f46e5" },
  {
    label: "Ocean",
    value: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
  },
  {
    label: "Sunset",
    value: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
  },
  {
    label: "Aurora",
    value: "radial-gradient(circle, #43e97b 0%, #38f9d7 100%)",
  },
];

interface BackgroundPickerProps {
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  name?: string;
  "aria-invalid"?: boolean;
  "aria-describedby"?: string;
}

export function BackgroundPicker({
  value,
  onChange,
  onBlur,
  name,
  ...ariaProps
}: BackgroundPickerProps) {
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent, index: number) => {
      const lastIndex = BACKGROUNDS.length - 1;

      if (e.key === "ArrowRight" || e.key === "ArrowDown") {
        e.preventDefault();
        const nextIndex = index < lastIndex ? index + 1 : 0;
        onChange(BACKGROUNDS[nextIndex].value);
        (
          e.currentTarget.parentElement?.children[nextIndex] as HTMLElement
        )?.focus();
        return;
      }
      if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
        e.preventDefault();
        const prevIndex = index > 0 ? index - 1 : lastIndex;
        onChange(BACKGROUNDS[prevIndex].value);
        (
          e.currentTarget.parentElement?.children[prevIndex] as HTMLElement
        )?.focus();
        return;
      }
    },
    [onChange],
  );

  return (
    <div
      role="radiogroup"
      aria-label="Board background"
      className="flex flex-wrap gap-3"
      onBlur={onBlur}
      {...ariaProps}
    >
      {BACKGROUNDS.map((option, index) => {
        const isSelected = option.value === value;

        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={isSelected}
            aria-label={option.label}
            tabIndex={isSelected ? 0 : -1}
            name={name}
            onClick={() => onChange(option.value)}
            onKeyDown={(e) => handleKeyDown(e, index)}
            className={`h-12 w-12 rounded-lg border-2 transition-shadow focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
              isSelected
                ? "border-primary ring-2 ring-primary ring-offset-2"
                : "border-border"
            }`}
            style={{ background: option.value }}
          />
        );
      })}
    </div>
  );
}