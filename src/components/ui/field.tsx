import * as React from "react";
import { AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

/** Accessible label + hint + error wrapper. Error is linked via aria-describedby. */
export interface FieldProps {
  id: string;
  label: React.ReactNode;
  hint?: React.ReactNode;
  error?: React.ReactNode;
  required?: boolean;
  requiredLabel?: string;
  optionalLabel?: string;
  className?: string;
  children: (a11y: {
    id: string;
    "aria-describedby"?: string;
    "aria-invalid"?: boolean;
    "aria-required"?: boolean;
  }) => React.ReactNode;
}

export function Field({
  id,
  label,
  hint,
  error,
  required,
  requiredLabel = "Required",
  optionalLabel,
  className,
  children,
}: FieldProps) {
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(" ") || undefined;
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <label htmlFor={id} className="text-small text-ink flex items-baseline gap-2 font-medium">
        {label}
        {required ? (
          <span className="text-caption text-graphite font-normal">({requiredLabel})</span>
        ) : optionalLabel ? (
          <span className="text-caption text-graphite font-normal">({optionalLabel})</span>
        ) : null}
      </label>
      {children({
        id,
        "aria-describedby": describedBy,
        "aria-invalid": error ? true : undefined,
        "aria-required": required || undefined,
      })}
      {hint ? (
        <p id={hintId} className="text-caption text-graphite">
          {hint}
        </p>
      ) : null}
      <div aria-live="polite">
        {error ? (
          <p id={errorId} className="text-caption text-danger flex items-center gap-1.5">
            <AlertCircle className="size-4" aria-hidden />
            {error}
          </p>
        ) : null}
      </div>
    </div>
  );
}
