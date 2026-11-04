"use client";

import { useMemo, useState } from "react";
import { Copy, HardDrive, ImagePlus, Pencil, Save, Search, Trash2, Upload, X } from "lucide-react";
import { toast } from "sonner";
import { AuthGuard } from "@/components/auth/auth-guard";
import { CardPreview } from "@/components/cards/card-preview";
import { EmptyState } from "@/components/common/empty-state";
import { PageHeading } from "@/components/common/page-heading";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { useDemoStore } from "@/lib/demo-store";
import type { MediaAsset, MediaPattern, MediaTone } from "@/lib/types";
import { formatDate, formatFileSize } from "@/lib/utils";

const tones: MediaTone[] = ["sand", "sage", "clay", "forest", "ink"];
const patterns: MediaPattern[] = ["orbit", "arch", "leaf", "lines", "wave"];

interface EditMediaForm { name: string; ownerId: number; mimeType: string; sizeMb: string; tone: MediaTone; pattern: MediaPattern; preview?: string }

async function readImagePreview(file: File) {
  return new Promise<string | undefined>((resolve) => {
    if (!file.type.startsWith("image/")) return resolve(undefined);
    const reader = new FileReader();
    reader.onload = () => resolve(typeof reader.result === "string" ? reader.result : undefined);
    reader.onerror = () => resolve(undefined);
    reader.readAsDataURL(file);
  });
}

export default function AdminMediaPage() {
  return <AuthGuard permission="media.manage"><MediaLibrary /></AuthGuard>;
}

function MediaLibrary() {
  const { state, currentUser, addMedia, updateMedia, removeMedia } = useDemoStore();
  const [query, setQuery] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<EditMediaForm | null>(null);
  const media = useMemo(() => state.media.filter((asset) => `${asset.name} ${asset.uuid}`.toLowerCase().includes(query.trim().toLowerCase())), [query, state.media]);
  const totalSize = state.media.reduce((sum, asset) => sum + asset.size, 0);
  const activeUsers = state.users.filter((user) => user.status !== "deleted");

  async function uploadFiles(event: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    if (!files.length || !currentUser) return;
    for (const [offset, file] of files.entries()) {
      const index = state.media.length + offset;
      const preview = await readImagePreview(file);
      addMedia({ name: file.name.replace(/\.[^.]+$/, ""), mimeType: file.type || "image/webp", size: file.size, ownerId: currentUser.id, tone: tones[index % tones.length], pattern: patterns[index % patterns.length], preview });
    }
    event.target.value = "";
    toast.success(`已上传 ${files.length} 个媒体文件`);
  }

  function addPlaceholder() {
    if (!currentUser) return;
    const index = state.media.length;
    addMedia({ name: `演示卡面资产 ${index + 1}`, mimeType: "image/webp", size: 720000, ownerId: currentUser.id, tone: tones[index % tones.length], pattern: patterns[index % patterns.length] });
    toast.success("已生成一个演示媒体资产");
  }

  function startEdit(asset: MediaAsset) {
    setEditingId(asset.uuid);
    setEditForm({ name: asset.name, ownerId: asset.ownerId, mimeType: asset.mimeType, sizeMb: (asset.size / 1024 / 1024).toFixed(2), tone: asset.tone, pattern: asset.pattern, preview: asset.preview });
  }

  async function replacePreview(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file || !editForm) return;
    const preview = await readImagePreview(file);
    setEditForm({ ...editForm, preview });
    event.target.value = "";
    toast.success("预览图已载入，保存后生效");
  }

  async function saveEdit(asset: MediaAsset) {
    if (!editForm) return;
    const sizeMb = Number(editForm.sizeMb);
    if (!editForm.name.trim()) return toast.error("媒体名称不能为空");
    if (!Number.isFinite(sizeMb) || sizeMb < 0) return toast.error("请输入有效文件大小");
    const result = updateMedia(asset.uuid, { name: editForm.name, ownerId: editForm.ownerId, mimeType: editForm.mimeType, size: Math.round(sizeMb * 1024 * 1024), tone: editForm.tone, pattern: editForm.pattern, preview: editForm.preview });
    if (!result.ok) return toast.error(result.message);
    setEditingId(null); setEditForm(null); toast.success(result.message);
  }

  async function copyUuid(uuid: string) {
    await navigator.clipboard.writeText(uuid);
    toast.success("UUID 已复制");
  }

  function remove(asset: MediaAsset) {
    if (!window.confirm(`确定从媒体库移除「${asset.name}」吗？`)) return;
    const result = removeMedia(asset.uuid);
    if (!result.ok) return toast.error(result.message);
    toast.success(result.message);
  }

  return (
    <div>
      <PageHeading eyebrow="Media Assets" title="媒体库" description="支持媒体新增、查看、编辑和删除。被卡片引用时禁止删除，UUID 创建后保持不变。" actions={<div className="flex gap-2"><Button variant="outline" onClick={addPlaceholder}><ImagePlus className="size-4" />生成占位资产</Button><label className="inline-flex h-11 cursor-pointer items-center justify-center gap-2 rounded-pill bg-primary px-5 text-sm font-semibold text-primary-foreground"><Upload className="size-4" />上传文件<input type="file" accept="image/*" multiple className="sr-only" onChange={uploadFiles} /></label></div>} />

      <div className="mt-7 grid gap-3 sm:grid-cols-3"><div className="paper-panel p-4"><p className="label-caps">资产总数</p><p className="mt-2 font-serif text-2xl font-bold">{state.media.length}</p></div><div className="paper-panel p-4"><p className="label-caps">占用空间</p><p className="mt-2 font-serif text-2xl font-bold">{formatFileSize(totalSize)}</p></div><div className="paper-panel p-4"><p className="label-caps">单图上限</p><p className="mt-2 font-serif text-2xl font-bold">{state.settings.maxImageSizeMb} MB</p></div></div>

      <label className="relative mt-5 block"><Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索文件名或 UUID" className="bg-surface/50 pl-10" /></label>

      {media.length ? <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
        {media.map((asset) => {
          const usage = state.cards.filter((card) => card.mediaIds.includes(asset.uuid)).length;
          const owner = state.users.find((user) => user.id === asset.ownerId);
          const editing = editingId === asset.uuid && editForm;
          return <article key={asset.uuid} className="paper-panel overflow-hidden p-3">
            <CardPreview title={asset.name} media={asset} />
            <div className="mt-3 flex items-start justify-between gap-2"><div className="min-w-0"><h2 className="truncate text-sm font-semibold">{asset.name}</h2><p className="mt-1 text-[0.65rem] text-muted-foreground">{formatFileSize(asset.size)} · {formatDate(asset.createdAt)}</p></div><Badge variant={usage ? "secondary" : "outline"}>{usage ? `引用 ${usage}` : "未引用"}</Badge></div>
            {editing ? <div className="mt-3 space-y-3 rounded-ui bg-surface p-3"><div><span className="mb-1 block text-[0.65rem] font-semibold">名称</span><Input value={editForm.name} onChange={(event) => setEditForm({ ...editForm, name: event.target.value })} /></div><div className="grid grid-cols-2 gap-2"><label><span className="mb-1 block text-[0.65rem] font-semibold">所有者</span><Select value={editForm.ownerId} onChange={(event) => setEditForm({ ...editForm, ownerId: Number(event.target.value) })}>{activeUsers.map((user) => <option key={user.id} value={user.id}>{user.displayName}</option>)}</Select></label><label><span className="mb-1 block text-[0.65rem] font-semibold">大小 (MB)</span><Input type="number" min={0} step="0.01" value={editForm.sizeMb} onChange={(event) => setEditForm({ ...editForm, sizeMb: event.target.value })} /></label></div><label><span className="mb-1 block text-[0.65rem] font-semibold">MIME</span><Input value={editForm.mimeType} onChange={(event) => setEditForm({ ...editForm, mimeType: event.target.value })} className="font-mono text-xs" /></label><div className="grid grid-cols-2 gap-2"><label><span className="mb-1 block text-[0.65rem] font-semibold">色调</span><Select value={editForm.tone} onChange={(event) => setEditForm({ ...editForm, tone: event.target.value as MediaTone })}>{tones.map((tone) => <option key={tone} value={tone}>{tone}</option>)}</Select></label><label><span className="mb-1 block text-[0.65rem] font-semibold">纹理</span><Select value={editForm.pattern} onChange={(event) => setEditForm({ ...editForm, pattern: event.target.value as MediaPattern })}>{patterns.map((pattern) => <option key={pattern} value={pattern}>{pattern}</option>)}</Select></label></div><label className="flex cursor-pointer items-center justify-center rounded-pill border border-border px-3 py-2 text-xs font-semibold"><Upload className="size-3.5" />替换预览图<input type="file" accept="image/*" className="sr-only" onChange={replacePreview} /></label><div className="flex justify-end gap-2"><Button variant="ghost" size="sm" onClick={() => { setEditingId(null); setEditForm(null); }}><X className="size-3.5" />取消</Button><Button size="sm" onClick={() => saveEdit(asset)}><Save className="size-3.5" />保存</Button></div></div> : <><div className="mt-3 flex items-center gap-1 rounded-ui bg-surface p-2"><span className="min-w-0 flex-1 truncate font-mono text-[0.58rem] text-muted-foreground">{asset.uuid}</span><Button variant="ghost" size="icon" className="size-7" onClick={() => copyUuid(asset.uuid)} aria-label="复制 UUID"><Copy className="size-3" /></Button></div><div className="mt-2 flex items-center justify-between gap-2"><span className="flex items-center gap-1 text-[0.62rem] text-muted-foreground"><HardDrive className="size-3" />{owner?.displayName ?? "unknown"}</span><div className="flex gap-1"><Button variant="ghost" size="sm" onClick={() => startEdit(asset)}><Pencil className="size-3.5" />编辑</Button><Button variant="ghost" size="sm" disabled={usage > 0} onClick={() => remove(asset)} className="text-destructive hover:bg-destructive/10"><Trash2 className="size-3.5" />移除</Button></div></div></>}
          </article>;
        })}
      </div> : <div className="mt-5"><EmptyState title="没有匹配的媒体" description="尝试清除搜索词，或上传新的媒体资产。" /></div>}
    </div>
  );
}
