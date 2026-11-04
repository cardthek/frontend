"use client";

import { useMemo, useState } from "react";
import { Copy, HardDrive, Pencil, Save, Search, Trash2, Upload, X } from "lucide-react";
import { toast } from "sonner";
import { AuthGuard } from "@/components/auth/auth-guard";
import { CardPreview } from "@/components/cards/card-preview";
import { EmptyState } from "@/components/common/empty-state";
import { PageHeading } from "@/components/common/page-heading";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { useAppStore } from "@/lib/app-store";
import type { MediaAsset } from "@/lib/types";
import { formatDate, formatFileSize } from "@/lib/utils";

interface EditMediaForm { name: string; ownerId: number }

export default function AdminMediaPage() {
  return <AuthGuard permission="media.manage"><MediaLibrary /></AuthGuard>;
}

function MediaLibrary() {
  const { state, currentUser, uploadMedia, updateMedia, removeMedia } = useAppStore();
  const [query, setQuery] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<EditMediaForm | null>(null);
  const media = useMemo(() => state.media.filter((asset) => `${asset.name} ${asset.uuid}`.toLowerCase().includes(query.trim().toLowerCase())), [query, state.media]);
  const totalSize = state.media.reduce((sum, asset) => sum + asset.size, 0);
  const activeUsers = state.users.filter((user) => user.status !== "deleted");

  async function uploadFiles(event: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    if (!files.length || !currentUser) return;
    let uploaded = 0;
    for (const file of files) {
      const result = await uploadMedia(file);
      if (!result.ok) {
        toast.error(`${file.name}: ${result.message}`);
        continue;
      }
      uploaded += 1;
    }
    event.target.value = "";
    if (uploaded) toast.success(`已上传 ${uploaded} 个媒体文件`);
  }

  function startEdit(asset: MediaAsset) {
    setEditingId(asset.uuid);
    setEditForm({ name: asset.name, ownerId: asset.ownerId });
  }

  async function saveEdit(asset: MediaAsset) {
    if (!editForm) return;
    if (!editForm.name.trim()) return toast.error("媒体名称不能为空");
    const result = await updateMedia(asset.uuid, { name: editForm.name, ownerId: editForm.ownerId });
    if (!result.ok) return toast.error(result.message);
    setEditingId(null); setEditForm(null); toast.success(result.message);
  }

  async function copyUuid(uuid: string) {
    await navigator.clipboard.writeText(uuid);
    toast.success("UUID 已复制");
  }

  async function remove(asset: MediaAsset) {
    if (!window.confirm(`确定从媒体库移除「${asset.name}」吗？`)) return;
    const result = await removeMedia(asset.uuid);
    if (!result.ok) return toast.error(result.message);
    toast.success(result.message);
  }

  return (
    <div>
      <PageHeading eyebrow="Media Assets" title="媒体库" description="上传真实卡面图片并维护名称与所有者。被卡片引用时禁止删除，UUID 创建后保持不变。" actions={<label className="inline-flex h-11 cursor-pointer items-center justify-center gap-2 rounded-pill bg-primary px-5 text-sm font-semibold text-primary-foreground"><Upload className="size-4" />上传图片<input type="file" accept="image/jpeg,image/png,image/webp,image/avif,image/gif" multiple className="sr-only" onChange={uploadFiles} /></label>} />

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
            {editing ? <div className="mt-3 space-y-3 rounded-ui bg-surface p-3"><div><span className="mb-1 block text-[0.65rem] font-semibold">名称</span><Input value={editForm.name} onChange={(event) => setEditForm({ ...editForm, name: event.target.value })} /></div><label><span className="mb-1 block text-[0.65rem] font-semibold">所有者</span><Select value={editForm.ownerId} onChange={(event) => setEditForm({ ...editForm, ownerId: Number(event.target.value) })}>{activeUsers.map((user) => <option key={user.id} value={user.id}>{user.displayName}</option>)}</Select></label><div className="flex justify-end gap-2"><Button variant="ghost" size="sm" onClick={() => { setEditingId(null); setEditForm(null); }}><X className="size-3.5" />取消</Button><Button size="sm" onClick={() => void saveEdit(asset)}><Save className="size-3.5" />保存</Button></div></div> : <><div className="mt-3 flex items-center gap-1 rounded-ui bg-surface p-2"><span className="min-w-0 flex-1 truncate font-mono text-[0.58rem] text-muted-foreground">{asset.uuid}</span><Button variant="ghost" size="icon" className="size-7" onClick={() => copyUuid(asset.uuid)} aria-label="复制 UUID"><Copy className="size-3" /></Button></div><div className="mt-2 flex items-center justify-between gap-2"><span className="flex items-center gap-1 text-[0.62rem] text-muted-foreground"><HardDrive className="size-3" />{owner?.displayName ?? "unknown"}</span><div className="flex gap-1"><Button variant="ghost" size="sm" onClick={() => startEdit(asset)}><Pencil className="size-3.5" />编辑</Button><Button variant="ghost" size="sm" disabled={usage > 0} onClick={() => void remove(asset)} className="text-destructive hover:bg-destructive/10"><Trash2 className="size-3.5" />移除</Button></div></div></>}
          </article>;
        })}
      </div> : <div className="mt-5"><EmptyState title="没有匹配的媒体" description="尝试清除搜索词，或上传新的媒体资产。" /></div>}
    </div>
  );
}
