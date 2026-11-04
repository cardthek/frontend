"use client";

import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export function Checkbox({
  checked,
  onCheckedChange,
  className,
  "aria-label": ariaLabel,
  disabled,
}: {
  checked: boolean;
  onCheckedChange: (checked: boolean | "indeterminate") => void;
  className?: string;
  "aria-label"?: string;
  disabled?: boolean;
}) {
  return (
    <CheckboxPrimitive.Root
      checked={checked}
      onCheckedChange={onCheckedChange}
      aria-label={ariaLabel}
      disabled={disabled}
      className={cn(
        "inline-flex size-5 shrink-0 items-center justify-center rounded-[0.35rem] border border-border bg-card text-primary-foreground data-[state=checked]:border-primary data-[state=checked]:bg-primary disabled:cursor-not-allowed disabled:opacity-40",
        className,
      )}
    >
      <CheckboxPrimitive.Indicator>
        <Check className="size-3.5" strokeWidth={3} />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  );
}
