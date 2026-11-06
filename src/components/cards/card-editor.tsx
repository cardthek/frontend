"use client";

import { useState } from "react";
import { flushSync } from "react-dom";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Check,
  CheckCircle2,
  LoaderCircle,
  MessageSquareWarning,
  Save,
  Send,
  ShieldCheck,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { CardPreview } from "@/components/cards/card-preview";
import { StatusBadge, statusMap } from "@/components/cards/card-tile";
import { VisibilityEditor } from "@/components/submissions/visibility-editor";
import { CountrySelect } from "@/components/ui/country-select";
import { CurrencyMultiSelect } from "@/components/ui/currency-multi-select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useAppStore } from "@/lib/app-store";
import type {
  AdminCardInput,
  Card,
  CardDraftInput,
  CardStatus,
  DictionaryType,
  FieldVisibility,
  MediaAsset,
} from "@/lib/types";
import { formatDate, formatFileSize } from "@/lib/utils";

export type CardEditorMode = "submission" | "admin" | "review";

const statuses: CardStatus[] = ["draft", "pending", "published", "changes_requested", "rejected", "hidden"];

interface CardEditorState {
  title: string;
  bin: string;
  issuerId: string;
  networkId: string;
  cardTypeId: string;
  levelId: string;
  countryCode: string;
  currencyCodes: string[];
  releaseYear: string;
  tags: string;
  description: string;
  sourceUrl: string;
  mediaIds: string[];
  coverMediaId?: string;
  ownerUuid: string;
  status: CardStatus;
  featured: boolean;
}

export function CardEditor({ mode, card }: { mode: CardEditorMode; card?: Card }) {
  const router = useRouter();
  const {
    state,
    currentUser,
    can,
    createDraft,
    createCard,
    updateCard,
    submitCard,
    reviewCard,
    uploadMedia,
  } = useAppStore();
  function initialForm(): CardEditorState {
    const owner = state.users.find((user) => user.id === card?.ownerId) ?? currentUser;
    return {
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
      mediaIds: card?.mediaIds ?? [],
      coverMediaId: card?.coverMediaId,
      ownerUuid: owner?.uuid ?? "",
      status: card?.status ?? "draft",
      featured: card?.featured ?? false,
    };
  }
  const [form, setForm] = useState<CardEditorState>(initialForm);
  const [visibility, setVisibility] = useState<Partial<FieldVisibility>>(card?.visibilityOverrides ?? {});
  const [reviewComment, setReviewComment] = useState("");
  const [busy, setBusy] = useState(false);
  const isAdmin = mode === "admin";
  const isReview = mode === "review";
  const isOwner = Boolean(card && currentUser?.id === card.ownerId);
  const canEdit = mode === "submission"
    ? !card ? can("submissions.create") : (isOwner && can("submissions.updateOwn")) || can("cards.update")
    : mode === "admin" ? can("cards.update") : can("submissions.review");
  const canManageVisibility = can("cards.visibility");
  const canBypassReview = can("submissions.bypassReview");
  const isResubmission = mode === "submission" && Boolean(card && !["draft", "changes_requested", "rejected"].includes(card.status));
  const dictionaries = (type: DictionaryType) => state.dictionaries.filter((item) => item.type === type && item.active);
  const levels = dictionaries("level").filter((item) => item.parentId === form.networkId);
  const selectedMedia = form.mediaIds
    .map((id) => state.media.find((asset) => asset.uuid === id))
    .filter((asset): asset is NonNullable<typeof asset> => Boolean(asset));
  const cover = selectedMedia.find((asset) => asset.uuid === form.coverMediaId) ?? selectedMedia[0];
  const submitter = state.users.find((user) => user.uuid === form.ownerUuid.trim().toLowerCase());
  const owner = state.users.find((user) => user.id === card?.ownerId);

  function update<K extends keyof CardEditorState>(field: K, value: CardEditorState[K]) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function resetEditorState() {
    flushSync(() => {
      setForm(initialForm());
      setVisibility(card?.visibilityOverrides ?? {});
      setReviewComment("");
    });
  }

  function removeMedia(uuid: string) {
    setForm((current) => {
      const mediaIds = current.mediaIds.filter((id) => id !== uuid);
      return { ...current, mediaIds, coverMediaId: current.coverMediaId === uuid ? mediaIds[0] : current.coverMediaId };
    });
  }

  async function uploadFiles(event: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    if (!files.length || !currentUser || !canEdit) return;
    let added = 0;
    const newAssets: MediaAsset[] = [];
    for (const file of files) {
      if (form.mediaIds.length + added >= state.settings.maxImages) {
        toast.error(`最多选择 ${state.settings.maxImages} 张图片`);
        break;
      }
      if (file.size > state.settings.maxImageSizeMb * 1024 * 1024) {
        toast.error(`${file.name} 超过 ${state.settings.maxImageSizeMb} MB`);
        continue;
      }
      const upload = await uploadMedia(file);
      if (!upload.ok || !upload.asset) {
        toast.error(`${file.name}: ${upload.message}`);
        continue;
      }
      newAssets.push(upload.asset);
      added += 1;
    }
    if (newAssets.length) {
      setForm((current) => ({
        ...current,
        mediaIds: [...current.mediaIds, ...newAssets.map((asset) => asset.uuid)],
        coverMediaId: current.coverMediaId ?? newAssets[0].uuid,
        title: current.title.trim() ? current.title : newAssets[0].name,
      }));
    }
    event.target.value = "";
    if (added) toast.success(`已上传 ${added} 张卡面图片`);
  }

  function validate(forSubmit: boolean) {
    if (!form.title.trim()) return "请填写卡片标题";
    if (form.bin.trim() && !/^\d{6,8}$/.test(form.bin.trim())) return "卡 BIN 需要填写 6–8 位数字";
    if (!form.issuerId || !form.networkId || !form.cardTypeId) return "请完整选择发行方、卡组织和卡片类型";
    if (form.releaseYear.trim()) {
      const year = Number(form.releaseYear);
      if (!Number.isInteger(year) || year < 1990 || year > 2035) return "请输入有效发行年份";
    }
    if (form.sourceUrl && !/^https?:\/\//.test(form.sourceUrl)) return "来源链接需要以 http:// 或 https:// 开头";
    if (forSubmit && form.mediaIds.length === 0) return "提交审核前至少需要一张卡面图片";
    if (isAdmin && !submitter) return "请输入有效的投稿者 UUID";
    if (isAdmin && ["pending", "published"].includes(form.status) && form.mediaIds.length === 0) return "待审核或已发布卡片至少需要一张图片";
    return null;
  }

  function buildInput(): CardDraftInput {
    return {
      title: form.title.trim(),
      bin: form.bin.trim() || undefined,
      issuerId: form.issuerId,
      networkId: form.networkId,
      cardTypeId: form.cardTypeId,
      levelId: form.levelId || undefined,
      countryCode: form.countryCode || undefined,
      currencyCodes: form.currencyCodes.length ? form.currencyCodes : undefined,
      releaseYear: form.releaseYear.trim() ? Number(form.releaseYear) : undefined,
      tags: form.tags.split(/[，,]/).map((tag) => tag.trim()).filter(Boolean),
      description: form.description.trim() || undefined,
      sourceUrl: form.sourceUrl.trim() || undefined,
      mediaIds: form.mediaIds,
      coverMediaId: form.coverMediaId ?? form.mediaIds[0],
    };
  }

  async function saveSubmission(forSubmit: boolean) {
    if (!canEdit) return toast.error("当前投稿状态不可编辑");
    const error = validate(forSubmit);
    if (error) return toast.error(error);
    setBusy(true);
    try {
      const input = buildInput();
      const created = card ? null : await createDraft(input);
      const uuid = card?.uuid ?? created!.uuid;
      if (card) {
        await updateCard(card.uuid, {
          ...input,
          ...(canManageVisibility ? { visibilityOverrides: visibility } : {}),
        });
      }
      if (forSubmit) await submitCard(uuid);
      if (!card) resetEditorState();
      toast.success(forSubmit ? (canBypassReview ? "投稿已自动发布" : "投稿已提交审核") : "草稿已保存");
      if (card) {
        router.push(`/me/submissions/${uuid}`);
      } else {
        router.replace(`/me/submissions/${uuid}`);
      }
    } catch (saveError) {
      toast.error(saveError instanceof Error ? saveError.message : "投稿保存失败");
    } finally {
      setBusy(false);
    }
  }

  async function saveAdmin() {
    if (!canEdit) return toast.error("当前身份不能编辑卡片");
    const error = validate(false);
    if (error) return toast.error(error);
    if (!submitter) return toast.error("请输入有效的投稿者 UUID");
    const input: AdminCardInput = {
      ...buildInput(),
      ownerId: submitter.id,
      status: form.status,
      featured: form.featured,
      visibilityOverrides: visibility,
    };
    setBusy(true);
    try {
      if (card) {
        await updateCard(card.uuid, input);
        toast.success("卡片信息已保存");
        router.push("/admin/cards");
      } else {
        const created = await createCard(input);
        resetEditorState();
        toast.success("卡片已创建");
        router.replace(`/admin/cards/${created.uuid}/edit`);
      }
    } catch (saveError) {
      toast.error(saveError instanceof Error ? saveError.message : "卡片保存失败");
    } finally {
      setBusy(false);
    }
  }

  async function saveReview() {
    if (!card) return;
    const error = validate(false);
    if (error) return toast.error(error);
    setBusy(true);
    try {
      await updateCard(card.uuid, {
        ...buildInput(),
        ...(canManageVisibility ? { visibilityOverrides: visibility } : {}),
      });
      toast.success("审核数据已保存");
    } catch (saveError) {
      toast.error(saveError instanceof Error ? saveError.message : "审核数据保存失败");
    } finally {
      setBusy(false);
    }
  }

  async function decide(decision: "approved" | "rejected" | "changes_requested") {
    if (!card) return;
    if (decision !== "approved" && !reviewComment.trim()) {
      return toast.error("拒绝或要求修改时，请填写审核意见");
    }
    const error = validate(decision === "approved");
    if (error) return toast.error(error);
    setBusy(true);
    try {
      await updateCard(card.uuid, {
        ...buildInput(),
        ...(canManageVisibility ? { visibilityOverrides: visibility } : {}),
      });
      await reviewCard(card.uuid, decision, reviewComment.trim() || "审核通过");
      toast.success(decision === "approved" ? "数据已保存，投稿已通过并发布" : decision === "rejected" ? "投稿已拒绝" : "已要求投稿人修改");
      router.push("/admin/submissions");
    } catch (reviewError) {
      toast.error(reviewError instanceof Error ? reviewError.message : "审核操作失败");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_19rem] xl:items-start">
      <div className="space-y-6">
        {!canEdit && (
          <div className="rounded-ui border border-warning/30 bg-warning/10 px-4 py-3 text-sm text-warning">
            当前身份没有编辑这条投稿的权限。
          </div>
        )}

        <section className="rounded-card border border-border bg-card p-5 md:p-7">
          <div className="flex items-center justify-between gap-4">
            <div><p className="label-caps">Basic Information</p><h2 className="mt-2 font-serif text-2xl font-bold">卡片资料</h2></div>
            <Badge variant="outline">标题与分类必填</Badge>
          </div>
          <div className="mt-6 space-y-5">
            <div><Label htmlFor="title">卡片标题 *</Label><Input id="title" value={form.title} onChange={(event) => update("title", event.target.value)} placeholder="例如：苔原 · 晨雾" disabled={!canEdit} /></div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div><Label htmlFor="issuer">发行方 *</Label><Select id="issuer" value={form.issuerId} onChange={(event) => update("issuerId", event.target.value)} disabled={!canEdit}><option value="">请选择</option>{dictionaries("issuer").map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</Select></div>
              <div><Label htmlFor="network">卡组织 *</Label><Select id="network" value={form.networkId} onChange={(event) => setForm((current) => ({ ...current, networkId: event.target.value, levelId: "" }))} disabled={!canEdit}><option value="">请选择</option>{dictionaries("network").map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</Select></div>
              <div><Label htmlFor="cardType">卡片类型 *</Label><Select id="cardType" value={form.cardTypeId} onChange={(event) => update("cardTypeId", event.target.value)} disabled={!canEdit}><option value="">请选择</option>{dictionaries("cardType").map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</Select></div>
              <div><Label htmlFor="level">卡片等级</Label><Select id="level" value={form.levelId} onChange={(event) => update("levelId", event.target.value)} disabled={!canEdit || !form.networkId}><option value="">{form.networkId ? "不填写" : "请先选择卡组织"}</option>{levels.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</Select><p className="mt-2 text-[0.65rem] text-muted-foreground">等级由所选卡组织决定，可不填写。</p></div>
              <div><Label htmlFor="country">发行国家 / 地区</Label><CountrySelect id="country" value={form.countryCode} onChange={(code) => update("countryCode", code)} disabled={!canEdit} /></div>
              <div><Label htmlFor="currency">币种</Label><CurrencyMultiSelect id="currency" value={form.currencyCodes} onChange={(codes) => update("currencyCodes", codes)} disabled={!canEdit} /><p className="mt-2 text-[0.65rem] text-muted-foreground">支持多选；常用币种优先展示，可选择“全币种”。</p></div>
              <div><Label htmlFor="bin">卡 BIN（可选）</Label><Input id="bin" value={form.bin} onChange={(event) => update("bin", event.target.value.replace(/\D/g, "").slice(0, 8))} placeholder="例如：62590811" inputMode="numeric" maxLength={8} disabled={!canEdit} /><p className="mt-2 text-xs text-muted-foreground">仅填写卡号前 6–8 位，请勿填写完整卡号。</p></div>
              <div><Label htmlFor="year">发行年份</Label><Input id="year" type="number" min={1990} max={2035} value={form.releaseYear} onChange={(event) => update("releaseYear", event.target.value)} placeholder="可不填写" disabled={!canEdit} /></div>
            </div>
            <div><Label htmlFor="tags">设计标签</Label><Input id="tags" value={form.tags} onChange={(event) => update("tags", event.target.value)} placeholder="用逗号分隔，例如：植物纹理，雾面，限量" disabled={!canEdit} /></div>
            <div><Label htmlFor="description">卡面介绍</Label><Textarea id="description" value={form.description} onChange={(event) => update("description", event.target.value)} placeholder="可选：描述颜色、材质、构图、工艺，以及容易被忽略的设计细节。" disabled={!canEdit} /><p className="mt-2 text-xs text-muted-foreground">请勿填写卡号、有效期、安全码或任何支付信息。</p></div>
            <div><Label htmlFor="sourceUrl">资料来源</Label><Input id="sourceUrl" value={form.sourceUrl} onChange={(event) => update("sourceUrl", event.target.value)} placeholder="https://…（可选）" disabled={!canEdit} /></div>
          </div>
        </section>

        {isAdmin && (
          <section className="rounded-card border border-border bg-card p-5 md:p-7">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div><p className="label-caps">Ownership & Publishing</p><h2 className="mt-2 font-serif text-2xl font-bold">归属与发布</h2><p className="mt-1 text-xs leading-5 text-muted-foreground">通过用户 UUID 精确关联投稿者。</p></div>
              <Badge variant="outline">管理员控制</Badge>
            </div>
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="ownerUuid">投稿者 UUID *</Label>
                <Input id="ownerUuid" value={form.ownerUuid} onChange={(event) => update("ownerUuid", event.target.value)} placeholder="粘贴用户管理页中的用户 UUID" className="font-mono text-xs" autoComplete="off" spellCheck={false} disabled={!canEdit} />
                {form.ownerUuid ? submitter ? <p className="mt-2 text-[0.68rem] leading-5 text-success">已匹配：{submitter.displayName}</p> : <p className="mt-2 text-[0.68rem] leading-5 text-destructive">未找到该 UUID 对应的用户。</p> : <p className="mt-2 text-[0.68rem] leading-5 text-muted-foreground">可从用户编辑页复制 UUID。</p>}
              </div>
              <div><Label htmlFor="status">发布状态 *</Label><Select id="status" value={form.status} onChange={(event) => update("status", event.target.value as CardStatus)} disabled={!canEdit}>{statuses.map((status) => <option key={status} value={status}>{statusMap[status].label}</option>)}</Select></div>
            </div>
            <div className="mt-4 flex items-center justify-between gap-4 rounded-ui bg-surface p-4">
              <div><p className="text-sm font-semibold">首页精选</p><p className="mt-1 text-xs leading-5 text-muted-foreground">精选卡片会出现在首页策展区域。</p></div>
              <Switch checked={form.featured} onCheckedChange={(checked) => update("featured", checked)} disabled={!canEdit} />
            </div>
          </section>
        )}

        <section className="rounded-card border border-border bg-card p-5 md:p-7">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div><p className="label-caps">Card Images</p><h2 className="mt-2 font-serif text-2xl font-bold">上传卡面</h2><p className="mt-1 text-xs text-muted-foreground">上传 1-{state.settings.maxImages} 张卡面图片，第一张默认作为封面。</p></div>
            <label className="inline-flex h-9 shrink-0 cursor-pointer items-center justify-center gap-2 rounded-pill bg-primary px-4 text-xs font-semibold text-primary-foreground"><Upload className="size-3.5" />上传卡面<input type="file" accept="image/*" multiple className="sr-only" onChange={uploadFiles} disabled={!canEdit} /></label>
          </div>
          <p className="mt-4 text-xs text-muted-foreground">已上传 {form.mediaIds.length} / {state.settings.maxImages} 张，单张上限 {state.settings.maxImageSizeMb} MB。</p>
          {selectedMedia.length ? (
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {selectedMedia.map((asset) => (
                <div key={asset.uuid} className={`relative rounded-ui border p-2 ${form.coverMediaId === asset.uuid ? "border-primary" : "border-border"}`}>
                  <CardPreview card={card} title={form.title || asset.name} media={asset} showLightbox={false} />
                  <div className="mt-2 flex items-start justify-between gap-2"><div className="min-w-0"><p className="truncate text-[0.68rem] font-semibold">{asset.name}</p><p className="text-[0.6rem] text-muted-foreground">{formatFileSize(asset.size)}</p></div><Button type="button" variant="ghost" size="icon" className="size-7 text-destructive" onClick={() => removeMedia(asset.uuid)} disabled={!canEdit} aria-label={`移除 ${asset.name}`}><Trash2 className="size-3.5" /></Button></div>
                  <label className="mt-2 flex cursor-pointer items-center gap-1.5 text-[0.62rem] text-muted-foreground"><input type="radio" name={`cover-${mode}`} checked={form.coverMediaId === asset.uuid} onChange={() => update("coverMediaId", asset.uuid)} disabled={!canEdit} />设为封面</label>
                </div>
              ))}
            </div>
          ) : (
            <label className="mt-4 flex cursor-pointer flex-col items-center justify-center rounded-card border border-dashed border-border px-5 py-10 text-center transition-colors hover:bg-surface/40"><Upload className="size-6 text-secondary" /><span className="mt-3 text-sm font-semibold">上传卡面图片</span><span className="mt-1 text-xs leading-5 text-muted-foreground">支持一次选择多张图片，第一张默认作为封面。</span><input type="file" accept="image/*" multiple className="sr-only" onChange={uploadFiles} disabled={!canEdit} /></label>
          )}
        </section>

        <details className="group rounded-card border border-border bg-card" open>
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-5 md:p-7 [&::-webkit-details-marker]:hidden"><div><p className="label-caps">Field Visibility</p><h2 className="mt-2 font-serif text-2xl font-bold">字段可见性</h2><p className="mt-1 text-xs text-muted-foreground">{canManageVisibility ? "当前用户组拥有字段可见性权限，可在当前编辑页调整公开范围。" : "当前用户组没有字段可见性权限，此区域只读。"}</p></div><ShieldCheck className="size-5 text-secondary" /></summary>
          <div className="px-5 pb-5 md:px-7 md:pb-7"><VisibilityEditor value={visibility} defaults={state.settings.fieldDefaults} roles={state.roles} onChange={setVisibility} disabled={!canManageVisibility} /></div>
        </details>

        {isReview && (
          <section className="rounded-card border border-border bg-surface/55 p-5 md:p-7">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><p className="label-caps">Review Decision</p><h2 className="mt-2 font-serif text-2xl font-bold">审核决定</h2><p className="mt-1 text-xs leading-5 text-muted-foreground">保存修改后可以直接通过，也可以拒绝或要求作者修改。</p></div><Badge variant="warning">待审核</Badge></div>
            <div className="mt-5"><Label htmlFor="review-comment">审核意见</Label><Textarea id="review-comment" className="min-h-28 bg-card" value={reviewComment} onChange={(event) => setReviewComment(event.target.value)} placeholder="通过时可选；拒绝或要求修改时必填。" /></div>
            <div className="mt-4 flex flex-col gap-2 border-t border-border/70 pt-4 sm:flex-row sm:flex-wrap sm:justify-end">
              <Button variant="outline" size="sm" onClick={() => decide("changes_requested")} disabled={busy}><MessageSquareWarning className="size-4" />要求修改</Button>
              <Button variant="destructive" size="sm" onClick={() => decide("rejected")} disabled={busy}><X className="size-4" />拒绝</Button>
              <Button variant="soft" size="sm" onClick={saveReview} disabled={busy}><Save className="size-4" />保存修改</Button>
              <Button size="sm" onClick={() => decide("approved")} disabled={busy}><Check className="size-4" />保存并通过</Button>
            </div>
          </section>
        )}

        <div className="sticky bottom-4 z-10 flex flex-col-reverse gap-3 rounded-card border border-border bg-card/95 p-3 shadow-float backdrop-blur sm:flex-row sm:items-center sm:justify-between">
          <Button asChild variant="ghost"><Link href={mode === "submission" ? "/me/submissions" : "/admin/submissions"}>取消</Link></Button>
          {mode === "submission" ? (
            <div className="flex gap-2"><Button type="button" variant="outline" onClick={() => saveSubmission(false)} disabled={busy || !canEdit}>{busy ? <LoaderCircle className="size-4 animate-spin" /> : <Save className="size-4" />}{isResubmission ? "保存修改" : "保存草稿"}</Button><Button type="button" onClick={() => saveSubmission(true)} disabled={busy || !canEdit}><Send className="size-4" />{canBypassReview ? (isResubmission ? "重新发布" : "立即发布") : (isResubmission ? "重新提交审核" : "提交审核")}</Button></div>
          ) : mode === "admin" ? (
            <Button onClick={saveAdmin} disabled={busy || !canEdit}>{busy ? <LoaderCircle className="size-4 animate-spin" /> : <Save className="size-4" />}保存卡片</Button>
          ) : (
            <Button onClick={() => decide("approved")} disabled={busy || !canEdit}><Check className="size-4" />保存并通过</Button>
          )}
        </div>
      </div>

      <aside className="space-y-4 xl:sticky xl:top-24">
        <div className="rounded-card border border-border bg-surface p-4"><p className="label-caps mb-3">Live Preview</p><CardPreview card={card} title={form.title || "未命名卡片"} media={cover} /><p className="mt-3 text-xs leading-6 text-muted-foreground">预览会随卡面图片变化。</p></div>
        {isReview && card && <div className="rounded-card border border-border bg-card p-4"><p className="label-caps">Submission Info</p><dl className="mt-3 space-y-3 text-xs"><div><dt className="text-muted-foreground">投稿者</dt><dd className="mt-1 font-semibold">{owner?.displayName ?? "未知用户"}</dd></div><div><dt className="text-muted-foreground">当前状态</dt><dd className="mt-1"><StatusBadge status={card.status} /></dd></div><div><dt className="text-muted-foreground">提交时间</dt><dd className="mt-1 font-semibold">{formatDate(card.submittedAt ?? card.createdAt, true)}</dd></div></dl></div>}
        {isAdmin && card && <div className="rounded-card border border-border bg-card p-4"><p className="label-caps">System Metadata</p><dl className="mt-3 space-y-3 text-xs"><div><dt className="text-muted-foreground">卡片 UUID</dt><dd className="mt-1 break-all font-mono text-[0.62rem]">{card.uuid}</dd></div><div><dt className="text-muted-foreground">创建时间</dt><dd className="mt-1 font-semibold">{formatDate(card.createdAt, true)}</dd></div><div><dt className="text-muted-foreground">最近更新</dt><dd className="mt-1 font-semibold">{formatDate(card.updatedAt, true)}</dd></div></dl></div>}
        <div className="rounded-card border border-border bg-card p-4"><p className="flex items-center gap-2 text-sm font-semibold"><CheckCircle2 className="size-4 text-success" />编辑提示</p><ul className="mt-3 space-y-2 text-xs leading-5 text-muted-foreground"><li>标题尽量包含设计主题与视觉特征。</li><li>请上传清晰卡面，不要填写支付敏感信息。</li><li>等级会随卡组织变化。</li><li>{canManageVisibility ? "字段可见性由当前用户组权限开放。" : "字段可见性仅对拥有对应权限的用户组开放。"}</li></ul></div>
      </aside>
    </div>
  );
}
