"use client";

import { useMemo, useState } from "react";
import { LockKeyhole, Plus, Save, ShieldCheck, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { AuthGuard } from "@/components/auth/auth-guard";
import { PageHeading } from "@/components/common/page-heading";
import { permissionCatalog } from "@/data/permissions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useAppStore } from "@/lib/app-store";
import type { PermissionKey, Role } from "@/lib/types";
import { cn, slugify } from "@/lib/utils";

export default function AdminRolesPage() {
  return (
    <AuthGuard permission="roles.read">
      <RoleManagement />
    </AuthGuard>
  );
}

function RoleManagement() {
  const { state, can, createRole, deleteRole } = useAppStore();
  const [selectedId, setSelectedId] = useState(state.roles[0]?.id ?? "");
  const [newName, setNewName] = useState("");
  const [newSlug, setNewSlug] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const selected = state.roles.find((role) => role.id === selectedId) ?? state.roles[0];
  const canUpdate = can("roles.update");

  async function addRole() {
    if (!canUpdate) return;
    const result = await createRole(newName, newSlug, newDescription);
    if (!result.ok) return toast.error(result.message);
    setNewName("");
    setNewSlug("");
    setNewDescription("");
    toast.success(result.message);
  }

  async function removeRole() {
    if (!selected || !canUpdate) return;
    if (!window.confirm(`确定删除用户组「${selected.name}」吗？`)) return;
    const result = await deleteRole(selected.id);
    if (!result.ok) return toast.error(result.message);
    setSelectedId(state.roles.find((role) => role.id !== selected.id)?.id ?? "");
    toast.success(result.message);
  }

  return (
    <div>
      <PageHeading eyebrow="User Groups & Permissions" title="用户组与权限" description="按权限节点组合用户组能力。每个用户只能属于一个用户组，菜单和操作按钮读取同一套权限定义。" actions={<Badge variant="outline"><ShieldCheck className="size-3" />{permissionCatalog.length} 个权限节点</Badge>} />

      <div className="mt-7 grid gap-5 lg:grid-cols-[18rem_minmax(0,1fr)]">
        <aside className="space-y-3">
          <div className="space-y-2">
            {state.roles.map((role) => (
              <button key={role.id} onClick={() => setSelectedId(role.id)} className={cn("w-full rounded-card border p-4 text-left transition-colors", selected?.id === role.id ? "border-primary bg-surface" : "border-border bg-card hover:bg-surface/60")}>
                <div className="flex items-center justify-between gap-3"><p className="font-serif text-lg font-bold">{role.name}</p>{role.isSystem ? <LockKeyhole className="size-3.5 text-muted-foreground" /> : <Badge variant="outline">自定义</Badge>}</div>
                <p className="mt-2 line-clamp-2 text-xs leading-5 text-muted-foreground">{role.description}</p>
                <p className="mt-2 font-mono text-[0.6rem] text-muted-foreground">@{role.slug}</p>
                <p className="mt-2 text-[0.65rem] font-semibold text-secondary">{role.permissions.length} 个权限</p>
              </button>
            ))}
          </div>

          <details className="rounded-card border border-dashed border-border bg-surface/40 p-4">
            <summary className="flex cursor-pointer list-none items-center gap-2 text-sm font-semibold [&::-webkit-details-marker]:hidden"><Plus className="size-4 text-secondary" />创建自定义用户组</summary>
            <div className="mt-4 space-y-3">
              <Input value={newName} onChange={(event) => setNewName(event.target.value)} placeholder="用户组名称" disabled={!canUpdate} />
              <Input value={newSlug} onChange={(event) => setNewSlug(event.target.value)} placeholder="slug（留空自动生成）" className="font-mono text-xs" disabled={!canUpdate} />
              <Textarea value={newDescription} onChange={(event) => setNewDescription(event.target.value)} placeholder="用户组职责说明" className="min-h-20" disabled={!canUpdate} />
              <Button size="sm" className="w-full" onClick={addRole} disabled={!canUpdate}><Plus className="size-4" />创建用户组</Button>
            </div>
          </details>
        </aside>

        {selected && (
          <RoleEditor
            key={`${selected.id}-${selected.uuid}-${selected.slug}-${selected.name}-${selected.description}-${selected.permissions.join(",")}`}
            role={selected}
            canUpdate={canUpdate}
            onDelete={removeRole}
          />
        )}
      </div>
    </div>
  );
}

function RoleEditor({ role, canUpdate, onDelete }: { role: Role; canUpdate: boolean; onDelete: () => void }) {
  const { state, updateRole } = useAppStore();
  const [name, setName] = useState(role.name);
  const [slug, setSlug] = useState(role.slug);
  const [description, setDescription] = useState(role.description);
  const [permissions, setPermissions] = useState<PermissionKey[]>(role.permissions);
  const locked = Boolean(role.isSystem && role.id === "super-admin");
  const modules = useMemo(() => Array.from(new Set(permissionCatalog.map((permission) => permission.module))), []);

  function togglePermission(permission: PermissionKey) {
    setPermissions((current) => current.includes(permission) ? current.filter((item) => item !== permission) : [...current, permission]);
  }

  async function save() {
    if (!canUpdate || locked) return;
    if (!name.trim()) return toast.error("用户组名称不能为空");
    const normalizedSlug = slugify(slug.trim() || name);
    if (!normalizedSlug) return toast.error("请填写有效用户组 slug");
    if (state.roles.some((candidate) => candidate.id !== role.id && candidate.slug.toLowerCase() === normalizedSlug.toLowerCase())) return toast.error("用户组 slug 已存在");
    try {
      await updateRole(role.id, { name: name.trim(), slug: normalizedSlug, description: description.trim(), permissions });
      toast.success("用户组与权限节点已保存");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "用户组保存失败");
    }
  }

  return (
    <section className="paper-panel overflow-hidden">
      <div className="border-b border-border/70 p-5 md:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div><div className="flex flex-wrap items-center gap-2"><p className="label-caps">User Group Editor</p>{role.isSystem && <Badge variant="outline">系统用户组</Badge>}{locked && <Badge variant="secondary">受保护</Badge>}</div><h2 className="mt-2 font-serif text-2xl font-bold">{role.name}</h2><div className="mt-2 grid gap-1.5 text-[0.62rem] text-muted-foreground sm:grid-cols-2"><p>内部 ID：<span className="font-mono">{role.id}</span></p><p>UUID：<span className="font-mono">{role.uuid}</span></p></div></div>
          {!role.isSystem && canUpdate && <Button variant="ghost" size="sm" onClick={onDelete} className="text-destructive hover:bg-destructive/10"><Trash2 className="size-4" />删除用户组</Button>}
        </div>
        <div className="mt-5 grid gap-4 md:grid-cols-3">
          <label><span className="mb-2 block text-xs font-semibold">用户组名称</span><Input value={name} onChange={(event) => setName(event.target.value)} disabled={!canUpdate || locked} /></label>
          <label><span className="mb-2 block text-xs font-semibold">Slug</span><Input value={slug} onChange={(event) => setSlug(event.target.value)} className="font-mono text-xs" disabled={!canUpdate || role.isSystem} /><span className="mt-1 block text-[0.6rem] text-muted-foreground">可读地址标识，不是 UUID。</span></label>
          <label><span className="mb-2 block text-xs font-semibold">用户组说明</span><Input value={description} onChange={(event) => setDescription(event.target.value)} disabled={!canUpdate || locked} /></label>
        </div>
        {locked && <p className="mt-3 flex items-center gap-2 rounded-ui bg-surface px-3 py-2 text-xs text-muted-foreground"><LockKeyhole className="size-3.5" />超级管理员始终拥有全部权限，避免站点被锁死。</p>}
      </div>

      <div className="p-5 md:p-6">
        <div className="flex items-center justify-between gap-3"><div><p className="label-caps">Permission Nodes</p><p className="mt-2 text-xs text-muted-foreground">已选择 {permissions.length} / {permissionCatalog.length} 个节点</p></div>{canUpdate && !locked && <Button size="sm" onClick={save}><Save className="size-4" />保存变更</Button>}</div>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          {modules.map((module) => (
            <div key={module} className="rounded-ui border border-border bg-surface/35 p-4">
              <div className="flex items-center justify-between gap-3"><p className="text-sm font-semibold">{module}</p><Badge variant="outline">{permissionCatalog.filter((permission) => permission.module === module && permissions.includes(permission.key)).length}/{permissionCatalog.filter((permission) => permission.module === module).length}</Badge></div>
              <div className="mt-3 space-y-2.5">
                {permissionCatalog.filter((permission) => permission.module === module).map((permission) => (
                  <label key={permission.key} className="flex cursor-pointer items-start gap-2.5 text-xs">
                    <Checkbox checked={permissions.includes(permission.key)} onCheckedChange={() => togglePermission(permission.key)} disabled={!canUpdate || locked} aria-label={permission.label} className="mt-0.5" />
                    <span><span className="block font-medium">{permission.label}</span><span className="mt-0.5 block font-mono text-[0.58rem] text-muted-foreground">{permission.key}</span></span>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
