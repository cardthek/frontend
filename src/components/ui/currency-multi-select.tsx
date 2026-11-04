"use client";

import { useMemo, useRef, useState } from "react";
import { Check, ChevronDown, Search, X } from "lucide-react";
import {
  ALL_CURRENCIES_CODE,
  allCurrencyOptionsIncludingPriority,
  otherCurrencyOptions,
  priorityCurrencyOptions,
} from "@/data/currencies";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export function CurrencyMultiSelect({
  id,
  value,
  onChange,
  disabled,
}: {
  id?: string;
  value: string[];
  onChange: (codes: string[]) => void;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const selected = new Set(value);
  const normalized = query.trim().toLowerCase();
  const filtered = useMemo(() => {
    if (!normalized) return [];
    return allCurrencyOptionsIncludingPriority.filter((option) =>
      option.code.toLowerCase().includes(normalized) ||
      option.name.toLowerCase().includes(normalized),
    );
  }, [normalized]);
  const visibleOptions = normalized ? filtered : [...priorityCurrencyOptions, ...otherCurrencyOptions];

  function toggle(code: string) {
    if (code === ALL_CURRENCIES_CODE) {
      onChange(selected.has(ALL_CURRENCIES_CODE) ? [] : [ALL_CURRENCIES_CODE]);
      return;
    }
    const withoutAll = value.filter((item) => item !== ALL_CURRENCIES_CODE);
    onChange(selected.has(code) ? withoutAll.filter((item) => item !== code) : [...withoutAll, code]);
  }

  const showAllOption = !normalized || "全币种".includes(normalized) || "all".includes(normalized);

  return (
    <div
      ref={containerRef}
      className="relative"
      onBlur={(event) => {
        if (!containerRef.current?.contains(event.relatedTarget as Node | null)) setOpen(false);
      }}
    >
      <div
        className={cn(
          "min-h-11 w-full rounded-pill border border-input bg-card px-3 py-2 transition-colors focus-within:border-ring",
          disabled && "cursor-not-allowed opacity-50",
        )}
      >
        <div className="flex flex-wrap items-center gap-1.5">
          {value.map((code) => (
            <span key={code} className="inline-flex items-center gap-1 rounded-pill bg-surface px-2.5 py-1 text-sm font-semibold">
              {code === ALL_CURRENCIES_CODE ? "全币种" : code}
              {!disabled && <button type="button" onClick={() => toggle(code)} aria-label={`移除 ${code}`}><X className="size-3" /></button>}
            </span>
          ))}
          <div className="relative min-w-28 flex-1">
            <Search className="pointer-events-none absolute left-2 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              id={id}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onFocus={() => { if (!disabled) setOpen(true); }}
              onKeyDown={(event) => {
                if (event.key === "Escape") setOpen(false);
                if (event.key === "Enter") {
                  event.preventDefault();
                  if (visibleOptions[0]) toggle(visibleOptions[0].code);
                }
              }}
              placeholder={value.length ? "继续添加币种" : "搜索币种名称或代码"}
              disabled={disabled}
              autoComplete="off"
              role="combobox"
              aria-expanded={open}
              aria-controls={id ? `${id}-options` : undefined}
              className="h-7 rounded-none border-0 bg-transparent px-7 text-sm shadow-none focus:border-0"
            />
            <ChevronDown className="pointer-events-none absolute right-1 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          </div>
        </div>
      </div>
      {open && !disabled && (
        <div id={id ? `${id}-options` : undefined} className="absolute z-50 mt-2 max-h-72 w-full overflow-y-auto rounded-ui border border-border bg-card p-1.5 shadow-float">
          {showAllOption && <button type="button" onMouseDown={(event) => event.preventDefault()} onClick={() => toggle(ALL_CURRENCIES_CODE)} className={cn("flex w-full items-center justify-between gap-3 rounded-ui px-3 py-2 text-left text-sm transition-colors hover:bg-surface", selected.has(ALL_CURRENCIES_CODE) && "bg-surface")}><span>全币种</span><span className="flex items-center gap-2 text-[0.65rem] font-semibold text-muted-foreground">不限具体币种{selected.has(ALL_CURRENCIES_CODE) && <Check className="size-3.5 text-secondary" />}</span></button>}
          {!normalized && <p className="border-t border-border/60 px-3 pb-1 pt-3 text-[0.6rem] font-bold tracking-wider text-muted-foreground">常用币种</p>}
          {visibleOptions.map((option, index) => (
            <div key={option.code}>
              {!normalized && index === priorityCurrencyOptions.length && <p className="mt-1 border-t border-border/60 px-3 pb-1 pt-3 text-[0.6rem] font-bold tracking-wider text-muted-foreground">其他币种</p>}
              <button
                type="button"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => toggle(option.code)}
                className={cn("flex w-full items-center justify-between gap-3 rounded-ui px-3 py-2 text-left text-sm transition-colors hover:bg-surface", selected.has(option.code) && "bg-surface")}
              >
                <span className="truncate">{option.name}</span>
                <span className="flex shrink-0 items-center gap-2 font-mono text-[0.65rem] text-muted-foreground">{option.code}{selected.has(option.code) && <Check className="size-3.5 text-secondary" />}</span>
              </button>
            </div>
          ))}
          {!visibleOptions.length && <p className="px-3 py-5 text-center text-xs text-muted-foreground">没有匹配的币种，请检查名称或三字母代码。</p>}
        </div>
      )}
    </div>
  );
}
