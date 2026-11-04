"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, LoaderCircle, Send } from "lucide-react";
import { toast } from "sonner";
import { AuthGuard } from "@/components/auth/auth-guard";
import { PageHeading } from "@/components/common/page-heading";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CountrySelect } from "@/components/ui/country-select";
import { CurrencyMultiSelect } from "@/components/ui/currency-multi-select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useAppStore } from "@/lib/app-store";
import type { ContributionChanges, DictionaryType } from "@/lib/types";

export function CardContributionClient({ uuid }: { uuid: string }) {
  return <AuthGuard><CardContributionForm uuid={uuid} /></AuthGuard>;
}

function CardContributionForm({ uuid }: { uuid: string }) {
  const router = useRouter();
  const { state, currentUser, createContribution } = useAppStore();
  const card = state.cards.find((item) => item.uuid === uuid);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("");
  const [form, setForm] = useState(() => ({
    title: card?.title ?? "",
    bin: card?.bin ?? "",
    issuerId: card?.issuerId ?? "",
    networkId: card?.networkId ?? "",
    cardTypeId: card?.cardTypeId ?? "",
    levelId: card?.levelId ?? "",
    countryCode: card?.countryCode ?? "",
    currencyCodes: card?.currencyCodes ?? [],
    releaseYear: card?.releaseYear ? String(card.releaseYear) : "",
    tags: card?.tags.join("，") ?? "",
    description: card?.description ?? "",
    sourceUrl: card?.sourceUrl ?? "",
  }));

  if (!card || !currentUser) return null;

  if (card.ownerId === currentUser.id) {
    return (
      <div className="container-page py-20 text-center">
        <h1 className="font-serif text-3xl font-bold">你是这张卡片的作者</h1>
        <p className="mt-3 text-sm text-muted-foreground">作者可以直接编辑自己的投稿，不需要提交协作修改。</p>
        <Button asChild className="mt-6"><Link href={`/me/submissions/${card.uuid}/edit`}>编辑投稿</Link></Button>
      </div>
    );
  }

  function update<K extends keyof typeof form>(field: K, value: (typeof form)[K]) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function dictionaries(type: DictionaryType) {
    return state.dictionaries.filter((item) => item.type === type && item.active);
  }

  const levels = dictionaries("level").filter((item) => item.parentId === form.networkId);

  function buildChanges(): ContributionChanges {
    if (!card) return {};
    const changes: ContributionChanges = {};
    const title = form.title.trim();
    if (title !== card.title) changes.title = title;
    const bin = form.bin.trim() || undefined;
    if (bin !== card.bin) changes.bin = bin;
    if (form.issuerId !== card.issuerId) changes.issuerId = form.issuerId;
    if (form.networkId !== card.networkId) changes.networkId = form.networkId;
    if (form.cardTypeId !== card.cardTypeId) changes.cardTypeId = form.cardTypeId;
    const levelId = form.levelId || undefined;
    if (levelId !== card.levelId) changes.levelId = levelId;
    const countryCode = form.countryCode || undefined;
    if (countryCode !== card.countryCode) changes.countryCode = countryCode;
    const currencyCodes = form.currencyCodes.length ? form.currencyCodes : undefined;
    if (JSON.stringify(currencyCodes) !== JSON.stringify(card.currencyCodes)) changes.currencyCodes = currencyCodes;
    const releaseYear = form.releaseYear.trim() ? Number(form.releaseYear) : undefined;
    if (releaseYear !== card.releaseYear) changes.releaseYear = releaseYear;
    const tags = form.tags.split(/[，,]/).map((tag) => tag.trim()).filter(Boolean);
    if (JSON.stringify(tags) !== JSON.stringify(card.tags)) changes.tags = tags;
    const description = form.description.trim() || undefined;
    if (description !== card.description) changes.description = description;
    const sourceUrl = form.sourceUrl.trim() || undefined;
    if (sourceUrl !== card.sourceUrl) changes.sourceUrl = sourceUrl;
    return changes;
  }

  async function submit() {
    if (!card) return;
    if (!form.title.trim() || !form.issuerId || !form.networkId || !form.cardTypeId) return toast.error("请填写标题并选择发行方、卡组织和卡片类型");
    if (form.bin.trim() && !/^\d{6,8}$/.test(form.bin.trim())) return toast.error("卡 BIN 需要填写 6–8 位数字");
    if (form.releaseYear.trim()) {
      const year = Number(form.releaseYear);
      if (!Number.isInteger(year) || year < 1990 || year > 2035) return toast.error("请输入有效发行年份");
    }
    if (form.sourceUrl && !/^https?:\/\//.test(form.sourceUrl)) return toast.error("来源链接需要以 http:// 或 https:// 开头");
    if (!note.trim()) return toast.error("请填写修改说明");
    const changes = buildChanges();
    if (!Object.keys(changes).length) return toast.error("没有检测到修改内容");
    setBusy(true);
    const result = await createContribution(card.uuid, changes, note);
    setBusy(false);
    if (!result.ok) return toast.error(result.message);
    toast.success(result.message);
    router.push(`/cards/${card.uuid}`);
  }

  return (
    <div className="container-page py-10 md:py-16">
      <Button asChild variant="ghost" size="sm" className="mb-5 px-0"><Link href={`/cards/${card.uuid}`}><ArrowLeft className="size-4" />返回卡片</Link></Button>
      <PageHeading eyebrow="Collaborative Edit" title={`补充或纠错：${card.title}`} description="修改内容不会立即生效。管理员审核通过后，修改会合并到卡片档案，你也会被记录为档案贡献者。" actions={<Badge variant="outline">等待审核后生效</Badge>} />

      <section className="paper-panel mt-7 p-5 md:p-7">
        <div className="space-y-5">
          <div><Label htmlFor="title">卡片标题 *</Label><Input id="title" value={form.title} onChange={(event) => update("title", event.target.value)} /></div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div><Label htmlFor="bin">卡 BIN</Label><Input id="bin" value={form.bin} onChange={(event) => update("bin", event.target.value.replace(/\D/g, "").slice(0, 8))} inputMode="numeric" maxLength={8} placeholder="6–8 位数字" /></div>
            <div><Label htmlFor="issuer">发行方 *</Label><Select id="issuer" value={form.issuerId} onChange={(event) => update("issuerId", event.target.value)}><option value="">请选择</option>{dictionaries("issuer").map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</Select></div>
            <div><Label htmlFor="network">卡组织 *</Label><Select id="network" value={form.networkId} onChange={(event) => setForm((current) => ({ ...current, networkId: event.target.value, levelId: "" }))}><option value="">请选择</option>{dictionaries("network").map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</Select></div>
            <div><Label htmlFor="cardType">卡片类型 *</Label><Select id="cardType" value={form.cardTypeId} onChange={(event) => update("cardTypeId", event.target.value)}><option value="">请选择</option>{dictionaries("cardType").map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</Select></div>
            <div><Label htmlFor="level">卡片等级</Label><Select id="level" value={form.levelId} onChange={(event) => update("levelId", event.target.value)} disabled={!form.networkId}><option value="">不填写</option>{levels.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</Select></div>
            <div><Label htmlFor="country">发行国家 / 地区</Label><CountrySelect id="country" value={form.countryCode} onChange={(code) => update("countryCode", code)} /></div>
            <div><Label htmlFor="currency">币种</Label><CurrencyMultiSelect id="currency" value={form.currencyCodes} onChange={(codes) => update("currencyCodes", codes)} /></div>
            <div><Label htmlFor="year">发行年份</Label><Input id="year" type="number" min={1990} max={2035} value={form.releaseYear} onChange={(event) => update("releaseYear", event.target.value)} /></div>
          </div>
          <div><Label htmlFor="tags">设计标签</Label><Input id="tags" value={form.tags} onChange={(event) => update("tags", event.target.value)} placeholder="用逗号分隔" /></div>
          <div><Label htmlFor="description">卡面介绍</Label><Textarea id="description" value={form.description} onChange={(event) => update("description", event.target.value)} /></div>
          <div><Label htmlFor="sourceUrl">资料来源</Label><Input id="sourceUrl" value={form.sourceUrl} onChange={(event) => update("sourceUrl", event.target.value)} placeholder="https://…" /></div>
          <div><Label htmlFor="note">修改说明 *</Label><Textarea id="note" className="min-h-28" value={note} onChange={(event) => setNote(event.target.value)} placeholder="说明补充了哪些资料、修正了什么错误，以及依据是什么。" /></div>
        </div>
        <div className="mt-6 flex flex-col-reverse gap-3 border-t border-border/70 pt-5 sm:flex-row sm:justify-end"><Button asChild variant="ghost"><Link href={`/cards/${card.uuid}`}>取消</Link></Button><Button onClick={submit} disabled={busy}>{busy ? <LoaderCircle className="size-4 animate-spin" /> : <Send className="size-4" />}提交修改建议</Button></div>
      </section>
    </div>
  );
}
