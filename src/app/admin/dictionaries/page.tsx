"use client";

import { useMemo, useState } from "react";
import { BookOpen, Pencil, Plus, Save, Search, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { AuthGuard } from "@/components/auth/auth-guard";
import { EmptyState } from "@/components/common/empty-state";
import { PageHeading } from "@/components/common/page-heading";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useAppStore } from "@/lib/app-store";
import type { Card, DictionaryItem, DictionaryType } from "@/lib/types";
import { cn, isAsciiSlug, slugify } from "@/lib/utils";

const typeLabels: Record<DictionaryType, { label: string; note: string }> = {
  issuer: { label: "发行方", note: "银行与发卡机构" },
  network: { label: "卡组织", note: "支付网络与卡组织" },
  cardType: { label: "卡片类型", note: "借记卡、信用卡等" },
  level: { label: "卡片等级", note: "按卡组织分别维护等级" },
};

const types = Object.keys(typeLabels) as DictionaryType[];
const slugPrefixes: Record<DictionaryType, string> = {
  issuer: "issuer",
  network: "network",
  cardType: "type",
  level: "level",
};
const fieldByType: Record<DictionaryType, keyof Card> = {
  issuer: "issuerId",
  network: "networkId",
  cardType: "cardTypeId",
  level: "levelId",
};

interface EditForm {
  type: DictionaryType;
  parentId: string;
  label: string;
  slug: string;
  description: string;
  active: boolean;
}

export default function AdminDictionariesPage() {
  return <AuthGuard permission="dictionaries.manage"><DictionaryManagement /></AuthGuard>;
}

function DictionaryManagement() {
  const { state, addDictionaryItem, updateDictionaryItem, toggleDictionaryItem, removeDictionaryItem } = useAppStore();
  const [type, setType] = useState<DictionaryType>("issuer");
  const [query, setQuery] = useState("");
  const [label, setLabel] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [parentId, setParentId] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<EditForm | null>(null);
  const networks = state.dictionaries.filter((item) => item.type === "network");
  const items = useMemo(() => state.dictionaries.filter((item) => {
    const matchesType = item.type === type;
    const matchesQuery = `${item.label} ${item.slug}`.toLowerCase().includes(query.trim().toLowerCase());
    return matchesType && matchesQuery;
  }), [query, state.dictionaries, type]);

  function usageCount(item: DictionaryItem) {
    return state.cards.filter((card) => card[fieldByType[item.type]] === item.id).length;
  }

  async function add() {
    if (!label.trim()) return toast.error("请填写字典项名称");
    if (type === "level" && !parentId) return toast.error("请选择等级所属卡组织");
    const normalizedSlug = slug.trim().toLowerCase();
    if (normalizedSlug && !isAsciiSlug(normalizedSlug)) {
      return toast.error("slug 只能包含小写英文字母、数字和单个连字符");
    }
    if (!normalizedSlug && !slugify(label)) {
      return toast.error("中文名称无法自动生成 slug，请填写英文 slug");
    }
    const result = await addDictionaryItem({
      type,
      parentId: type === "level" ? parentId : undefined,
      label: label.trim(),
      slug: normalizedSlug || undefined,
      description: description.trim() || undefined,
    });
    if (!result.ok) return toast.error(result.message);
    setLabel("");
    setSlug("");
    setDescription("");
    setParentId("");
    toast.success(result.message);
  }

  function startEdit(item: DictionaryItem) {
    const prefix = `${slugPrefixes[item.type]}-`;
    setEditingId(item.id);
    setEditForm({
      type: item.type,
      parentId: item.parentId ?? "",
      label: item.label,
      slug: item.slug.startsWith(prefix)
        ? item.slug.slice(prefix.length)
        : item.slug,
      description: item.description ?? "",
      active: item.active,
    });
  }

  async function saveEdit(item: DictionaryItem) {
    if (!editForm) return;
    const normalizedSlug = editForm.slug.trim().toLowerCase();
    if (!isAsciiSlug(normalizedSlug)) {
      return toast.error("slug 只能包含小写英文字母、数字和单个连字符");
    }
    const result = await updateDictionaryItem(item.id, {
      ...editForm,
      slug: normalizedSlug,
      parentId: editForm.type === "level" ? editForm.parentId : undefined,
    });
    if (!result.ok) return toast.error(result.message);
    setEditingId(null);
    setEditForm(null);
    toast.success(result.message);
  }

  async function remove(item: DictionaryItem) {
    const childLevels = item.type === "network"
      ? state.dictionaries.filter((candidate) => candidate.type === "level" && candidate.parentId === item.id).length
      : 0;
    const message = childLevels
      ? `确定删除「${item.label}」吗？其下属 ${childLevels} 个卡片等级也会一并删除。`
      : `确定删除「${item.label}」吗？`;
    if (!window.confirm(message)) return;
    const result = await removeDictionaryItem(item.id);
    if (!result.ok) return toast.error(result.message);
    toast.success(result.message);
  }

  return (
    <div>
      <PageHeading
        eyebrow="Taxonomy"
        title="字典管理"
        description="维护卡片分类与发行信息。卡片等级属于具体卡组织，不同卡组织可拥有独立等级体系。"
        actions={<Badge variant="outline"><BookOpen className="size-3" />{state.dictionaries.length} 个字典项</Badge>}
      />

      <div className="mt-7 grid gap-5 lg:grid-cols-[18rem_minmax(0,1fr)]">
        <aside className="space-y-2">
          {types.map((item) => {
            const count = state.dictionaries.filter((dictionary) => dictionary.type === item).length;
            return (
              <button key={item} onClick={() => { setType(item); setEditingId(null); setEditForm(null); }} className={cn("flex w-full items-center justify-between gap-3 rounded-card border p-4 text-left transition-colors", type === item ? "border-primary bg-surface" : "border-border bg-card hover:bg-surface/60")}>
                <span><span className="block font-serif text-lg font-bold">{typeLabels[item].label}</span><span className="mt-1 block text-xs text-muted-foreground">{typeLabels[item].note}</span></span><Badge variant="outline">{count}</Badge>
              </button>
            );
          })}
        </aside>

        <section className="paper-panel overflow-hidden">
          <div className="border-b border-border/70 p-5 md:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><p className="label-caps">Add Entry</p><h2 className="mt-2 font-serif text-2xl font-bold">新增{typeLabels[type].label}</h2></div><Badge variant="outline">固定前缀 {slugPrefixes[type]}-</Badge></div>
            {type === "level" && (
              <div className="mt-4">
                <span className="mb-1.5 block text-xs font-semibold">所属卡组织 *</span>
                <Select value={parentId} onChange={(event) => setParentId(event.target.value)}><option value="">请选择卡组织</option>{networks.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</Select>
                <p className="mt-2 text-[0.65rem] text-muted-foreground">等级名称只会在所属卡组织下出现。</p>
              </div>
            )}
            <div className="mt-4 grid gap-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.4fr)_auto]">
              <Input value={label} onChange={(event) => setLabel(event.target.value)} placeholder={`${typeLabels[type].label}名称`} />
              <div className="flex h-11 items-center rounded-pill border border-input bg-card pl-4">
                <span className="shrink-0 font-mono text-xs text-muted-foreground">{slugPrefixes[type]}-</span>
                <input value={slug} onChange={(event) => setSlug(event.target.value)} placeholder="custom-slug" className="h-full min-w-0 flex-1 bg-transparent px-1 font-mono text-xs outline-none" />
              </div>
              <Input value={description} onChange={(event) => setDescription(event.target.value)} placeholder="可选说明" />
              <Button onClick={add}><Plus className="size-4" />添加</Button>
            </div>
          </div>

          <div className="p-5 md:p-6">
            <label className="relative block"><Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索名称或 slug" className="bg-surface/50 pl-10" /></label>
            <div className="mt-4 space-y-3">
              {items.length ? items.map((item) => {
                const usage = usageCount(item);
                const editing = editingId === item.id && editForm;
                return (
                  <div key={item.id} className="rounded-ui border border-border bg-surface/35 p-3">
                    {editing ? (
                      <div>
                        <div className="flex items-center justify-between gap-3"><p className="text-sm font-semibold">编辑「{item.label}」</p><Button variant="ghost" size="icon" onClick={() => { setEditingId(null); setEditForm(null); }} aria-label="取消编辑"><X className="size-4" /></Button></div>
                        <div className="mt-3 grid gap-3 sm:grid-cols-2">
                          <div><span className="mb-1.5 block text-xs font-semibold">名称</span><Input value={editForm.label} onChange={(event) => setEditForm({ ...editForm, label: event.target.value })} /></div>
                          <div><span className="mb-1.5 block text-xs font-semibold">Slug</span><div className="flex h-11 items-center rounded-pill border border-input bg-card pl-4"><span className="shrink-0 font-mono text-xs text-muted-foreground">{slugPrefixes[editForm.type]}-</span><input value={editForm.slug} onChange={(event) => setEditForm({ ...editForm, slug: event.target.value })} className="h-full min-w-0 flex-1 bg-transparent px-1 font-mono text-xs outline-none" /></div></div>
                          <div><span className="mb-1.5 block text-xs font-semibold">分类</span><Select value={editForm.type} onChange={(event) => setEditForm({ ...editForm, type: event.target.value as DictionaryType })} disabled={usage > 0}>{types.map((dictionaryType) => <option key={dictionaryType} value={dictionaryType}>{typeLabels[dictionaryType].label}</option>)}</Select>{usage > 0 && <p className="mt-1 text-[0.62rem] text-muted-foreground">已有 {usage} 张卡片引用，不能修改分类。</p>}</div>
                          <div className="self-start">
                            <span className="mb-2 block text-xs font-semibold">启用状态</span>
                            <div className="flex h-11 items-center justify-between rounded-pill border border-input bg-card px-4">
                              <span className="text-xs text-muted-foreground">{editForm.active ? "已启用" : "已停用"}</span>
                              <Switch checked={editForm.active} onCheckedChange={(checked) => setEditForm({ ...editForm, active: checked })} />
                            </div>
                          </div>
                          {editForm.type === "level" && <div className="sm:col-span-2"><span className="mb-1.5 block text-xs font-semibold">所属卡组织 *</span><Select value={editForm.parentId} onChange={(event) => setEditForm({ ...editForm, parentId: event.target.value })} disabled={usage > 0}><option value="">请选择卡组织</option>{networks.map((network) => <option key={network.id} value={network.id}>{network.label}</option>)}</Select>{usage > 0 && <p className="mt-1 text-[0.62rem] text-muted-foreground">已有卡片引用，不能修改所属卡组织。</p>}</div>}
                          <div className="sm:col-span-2"><span className="mb-1.5 block text-xs font-semibold">说明</span><Textarea value={editForm.description} onChange={(event) => setEditForm({ ...editForm, description: event.target.value })} className="min-h-20 bg-card" /></div>
                        </div>
                        <div className="mt-3 flex justify-end gap-2"><Button variant="ghost" size="sm" onClick={() => { setEditingId(null); setEditForm(null); }}>取消</Button><Button size="sm" onClick={() => saveEdit(item)}><Save className="size-4" />保存修改</Button></div>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2"><p className="font-semibold">{item.label}</p><Badge variant={item.active ? "success" : "outline"}>{item.active ? "启用" : "停用"}</Badge>{item.type === "level" && <Badge variant="outline">{state.dictionaries.find((network) => network.id === item.parentId)?.label ?? "未指定卡组织"}</Badge>}{usage > 0 && <Badge variant="secondary">引用 {usage}</Badge>}</div>
                          <p className="mt-1 truncate font-mono text-[0.62rem] text-muted-foreground">{item.id} · {item.slug}</p>
                          {item.description && <p className="mt-1 text-xs text-muted-foreground">{item.description}</p>}
                        </div>
                        <div className="flex items-center gap-1 self-end sm:self-auto"><Switch checked={item.active} onCheckedChange={async () => { const result = await toggleDictionaryItem(item.id); if (!result.ok) return toast.error(result.message); toast.success(item.active ? "字典项已停用" : "字典项已启用"); }} /><Button variant="ghost" size="icon" onClick={() => startEdit(item)} aria-label={`编辑 ${item.label}`}><Pencil className="size-4" /></Button><Button variant="ghost" size="icon" onClick={() => void remove(item)} aria-label={`删除 ${item.label}`} className="text-destructive hover:bg-destructive/10"><Trash2 className="size-4" /></Button></div>
                      </div>
                    )}
                  </div>
                );
              }) : <EmptyState title="没有字典项" description="添加第一个项目，或清除当前搜索词。" />}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
