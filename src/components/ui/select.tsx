"use client";

import * as React from "react";
import { Select as S } from "radix-ui";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps {
  id?: string;
  value?: string;
  defaultValue?: string;
  onValueChange?: (v: string) => void;
  options: SelectOption[];
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  name?: string;
  "aria-describedby"?: string;
  "aria-invalid"?: boolean;
  "aria-label"?: string;
}

export function Select({ id, options, placeholder, className, ...props }: SelectProps) {
  const { value, defaultValue, onValueChange, disabled, name } = props;
  return (
    <S.Root
      value={value}
      defaultValue={defaultValue}
      onValueChange={onValueChange}
      disabled={disabled}
      name={name}
    >
      <S.Trigger
        id={id}
        aria-describedby={props["aria-describedby"]}
        aria-invalid={props["aria-invalid"]}
        aria-label={props["aria-label"]}
        className={cn(
          "bg-paper text-ink border-field-line flex h-12 w-full items-center justify-between gap-2 rounded-[14px] border px-4 text-left",
          "hover:border-graphite focus:border-brand focus:bg-paper data-[placeholder]:text-graphite aria-[invalid=true]:border-danger focus-visible:outline-brand focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-solid",
          className,
        )}
      >
        <S.Value placeholder={placeholder} />
        <S.Icon>
          <ChevronDown className="text-graphite size-5 stroke-[1.75]" aria-hidden />
        </S.Icon>
      </S.Trigger>
      <S.Portal>
        <S.Content
          position="popper"
          sideOffset={8}
          className="border-line bg-paper shadow-float z-50 max-h-[min(var(--radix-select-content-available-height),360px)] w-[var(--radix-select-trigger-width)] overflow-hidden rounded-[20px] border p-1.5 data-[state=open]:animate-[able-drop_220ms_var(--ease-smooth)]"
        >
          <S.Viewport>
            {options.map((o) => (
              <S.Item
                key={o.value}
                value={o.value}
                className="text-small data-[highlighted]:bg-mist flex min-h-11 cursor-pointer items-center justify-between gap-2 rounded-[14px] px-3 outline-none select-none data-[state=checked]:font-medium"
              >
                <S.ItemText>{o.label}</S.ItemText>
                <S.ItemIndicator>
                  <Check className="text-brand size-4" aria-hidden />
                </S.ItemIndicator>
              </S.Item>
            ))}
          </S.Viewport>
        </S.Content>
      </S.Portal>
    </S.Root>
  );
}
