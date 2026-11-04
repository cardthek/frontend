"use client";

import { useState } from "react";
import { Filter, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { CardTile } from "@/components/cards/card-tile";
import { EmptyState } from "@/components/common/empty-state";
import { useDemoStore, useDictionary } from "@/lib/demo-store";
import { countryName } from "@/data/countries";
import { currencyName } from "@/data/currencies";

export default function CardsPage() {
  const { state } = useDemoStore();
  const dictionary = useDictionary();
  const [query, setQuery] = useState("");
  const [network, setNetwork] = useState("all");
  const [country, setCountry] = useState("all");
  const [year, setYear] = useState("all");
  const [tag, setTag] = useState<string | null>(null);

  const published = state.cards.filter((card) => card.status === "published");
  const networks = state.dictionaries.filter((item) => item.type === "network" && item.active);
  const countryCodes = [...new Set(published.map((card) => card.countryCode))].filter((code): code is string => Boolean(code)).sort();
  const countries = countryCodes.map((code) => ({ code, label: countryName(code) }));
  const years = [...new Set(published.map((card) => card.releaseYear))].filter((year): year is number => year !== undefined).sort((a, b) => b - a);
  const tags = [...new Set(published.flatMap((card) => card.tags))].slice(0, 12);

  const normalized = query.trim().toLowerCase();
  const filtered = published.filter((card) => {
    const haystack = [
      card.title,
      card.bin,
      card.description,
      dictionary(card.issuerId),
      dictionary(card.networkId),
      dictionary(card.cardTypeId),
      ...(card.countryCode ? [countryName(card.countryCode), card.countryCode] : []),
      ...(card.currencyCodes ?? []).flatMap((code) => code === "*" ? ["全币种"] : [code, currencyName(code)]),
      ...card.tags,
    ].join(" ").toLowerCase();
    return (
      (!normalized || haystack.includes(normalized)) &&
      (network === "all" || card.networkId === network) &&
      (country === "all" || card.countryCode === country) &&
      (year === "all" || String(card.releaseYear) === year) &&
      (!tag || card.tags.includes(tag))
    );
  });

  const hasFilters = Boolean(query) || network !== "all" || country !== "all" || year !== "all" || Boolean(tag);

  function clearFilters() {
    setQuery("");
    setNetwork("all");
    setCountry("all");
    setYear("all");
    setTag(null);
  }

  return (
    <div className="container-page py-10 md:py-16">
      <div className="grid gap-6 border-b border-border pb-8 md:grid-cols-[1fr_auto] md:items-end">
        <div>
          <p className="label-caps mb-3">Card Archive</p>
          <h1 className="section-title">卡面档案</h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-muted-foreground">按设计语言、发行国家/地区与年代翻阅公开卡面。地区使用 ISO 3166-1 二字母代码。</p>
        </div>
        <p className="text-sm text-muted-foreground">共 <span className="font-serif text-2xl font-bold text-foreground">{published.length}</span> 张公开卡面</p>
      </div>

      <div className="mt-7 rounded-card border border-border bg-card p-4 md:p-5">
        <div className="grid gap-3 md:grid-cols-[minmax(14rem,1fr)_repeat(3,10rem)]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索标题、发行方、标签…" className="pl-10" />
          </div>
          <Select value={network} onChange={(event) => setNetwork(event.target.value)} aria-label="按卡组织筛选">
            <option value="all">全部卡组织</option>
            {networks.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
          </Select>
          <Select value={country} onChange={(event) => setCountry(event.target.value)} aria-label="按地区筛选">
            <option value="all">全部地区</option>
            {countries.map((item) => <option key={item.code} value={item.code}>{item.label} · {item.code}</option>)}
          </Select>
          <Select value={year} onChange={(event) => setYear(event.target.value)} aria-label="按年份筛选">
            <option value="all">全部年份</option>
            {years.map((item) => <option key={item} value={item}>{item}</option>)}
          </Select>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-border/70 pt-4">
          <span className="mr-1 flex items-center gap-1.5 text-xs font-semibold text-muted-foreground"><Filter className="size-3.5" />标签</span>
          {tags.map((item) => (
            <button key={item} onClick={() => setTag(tag === item ? null : item)}>
              <Badge variant={tag === item ? "primary" : "outline"}>{item}</Badge>
            </button>
          ))}
          {hasFilters && (
            <Button variant="ghost" size="sm" className="ml-auto" onClick={clearFilters}><X className="size-3.5" />清除筛选</Button>
          )}
        </div>
      </div>

      <div className="mt-7 flex items-center justify-between">
        <p className="text-sm text-muted-foreground">找到 {filtered.length} 张卡片</p>
      </div>

      {filtered.length > 0 ? (
        <div className="mt-6 grid gap-x-5 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((card) => <CardTile key={card.uuid} card={card} />)}
        </div>
      ) : (
        <div className="mt-6">
          <EmptyState title="没有找到匹配的卡片" description="试试减少筛选条件，或换一个关键词重新搜索。" action={<Button variant="outline" onClick={clearFilters}>清除全部筛选</Button>} />
        </div>
      )}
    </div>
  );
}
