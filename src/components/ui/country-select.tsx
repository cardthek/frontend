"use client";

import { useMemo, useRef, useState } from "react";
import { Check, ChevronDown, MapPin, Search } from "lucide-react";
import { countryOptions } from "@/data/countries";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export function CountrySelect({
  id,
  value,
  onChange,
  disabled,
  placeholder = "搜索国家或地区，也可直接输入代码",
}: {
  id?: string;
  value: string;
  onChange: (code: string) => void;
  disabled?: boolean;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const selected = countryOptions.find((option) => option.code === value);
  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return countryOptions;
    return countryOptions.filter((option) =>
      option.code.toLowerCase().includes(normalized) ||
      option.name.toLowerCase().includes(normalized),
    );
  }, [query]);

  function select(code: string) {
    onChange(code);
    setQuery("");
    setOpen(false);
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Escape") {
      setOpen(false);
      return;
    }
    if (event.key === "Enter") {
      event.preventDefault();
      if (filtered[0]) select(filtered[0].code);
    }
  }

  const inputValue = open ? query : selected ? `${selected.name} · ${selected.code}` : "";

  return (
    <div
      ref={containerRef}
      className="relative"
      onBlur={(event) => {
        if (!containerRef.current?.contains(event.relatedTarget as Node | null)) setOpen(false);
      }}
    >
      <MapPin className="pointer-events-none absolute left-4 top-[13px] z-10 size-4 text-muted-foreground" />
      <Search className="pointer-events-none absolute right-10 top-[13px] z-10 size-3.5 text-muted-foreground/70" />
      <Input
        id={id}
        value={inputValue}
        placeholder={placeholder}
        disabled={disabled}
        autoComplete="off"
        role="combobox"
        aria-expanded={open}
        aria-controls={id ? `${id}-options` : undefined}
        className="pl-10 pr-9"
        onFocus={() => {
          if (disabled) return;
          setOpen(true);
          setQuery("");
        }}
        onChange={(event) => {
          setOpen(true);
          setQuery(event.target.value);
        }}
        onKeyDown={handleKeyDown}
      />
      <ChevronDown className={cn("pointer-events-none absolute right-3.5 top-3.5 size-4 text-muted-foreground transition-transform", open && "rotate-180")} />
      {open && (
        <div id={id ? `${id}-options` : undefined} className="absolute z-50 mt-2 max-h-64 w-full overflow-y-auto rounded-ui border border-border bg-card p-1.5 shadow-float">
          {!query.trim() && (
            <button type="button" onMouseDown={(event) => event.preventDefault()} onClick={() => select("")} className="flex w-full items-center justify-between gap-3 rounded-ui px-3 py-2 text-left text-sm text-muted-foreground transition-colors hover:bg-surface">
              <span>不填写</span>
              {!value && <Check className="size-3.5 text-secondary" />}
            </button>
          )}
          {filtered.length ? filtered.map((option) => (
            <button
              key={option.code}
              type="button"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => select(option.code)}
              className={cn("flex w-full items-center justify-between gap-3 rounded-ui px-3 py-2 text-left text-sm transition-colors hover:bg-surface", option.code === value && "bg-surface")}
            >
              <span className="truncate">{option.name}</span>
              <span className="flex shrink-0 items-center gap-2 font-mono text-[0.65rem] text-muted-foreground">{option.code}{option.code === value && <Check className="size-3.5 text-secondary" />}</span>
            </button>
          )) : (
            <p className="px-3 py-5 text-center text-xs text-muted-foreground">没有匹配的国家或地区，请检查名称或二字母代码。</p>
          )}
        </div>
      )}
    </div>
  );
}
