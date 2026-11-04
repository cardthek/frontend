"use client";

import { useState } from "react";
import { CheckCircle2, Globe2, ImageIcon, Mail, Palette, Save, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { AuthGuard } from "@/components/auth/auth-guard";
import { PageHeading } from "@/components/common/page-heading";
import { VisibilityEditor } from "@/components/submissions/visibility-editor";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useDemoStore } from "@/lib/demo-store";
import { themeName } from "@/lib/theme";
import type { FieldVisibility, SiteSettings } from "@/lib/types";

export default function AdminSettingsPage() {
  return (
    <AuthGuard permission="settings.read">
      <SiteSettingsPage />
    </AuthGuard>
  );
}

function SiteSettingsPage() {
  const { state } = useDemoStore();
  return <SettingsForm key={JSON.stringify(state.settings)} />;
}

function SettingsForm() {
  const { state, can, updateSettings } = useDemoStore();
  const canUpdate = can("settings.update");
  const [form, setForm] = useState<SiteSettings>(() => structuredClone(state.settings));
  const [defaults, setDefaults] = useState<FieldVisibility>(() => structuredClone(state.settings.fieldDefaults));

  function patch<K extends keyof SiteSettings>(key: K, value: SiteSettings[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function save() {
    if (!canUpdate) return;
    if (!form.siteName.trim()) return toast.error("站点名称不能为空");
    if (form.maxImages < 1 || form.maxImages > 100) return toast.error("图片数量上限需在 1 到 100 之间");
    if (form.maxImageSizeMb < 1 || form.maxImageSizeMb > 100) return toast.error("单图大小上限需在 1 到 100 MB 之间");
    updateSettings({ ...form, siteName: form.siteName.trim(), fieldDefaults: defaults });
    toast.success("站点设置已保存");
  }

  return (
    <div>
      <PageHeading eyebrow="Site Configuration" title="站点设置" description="管理基础信息、注册策略、上传限制与字段默认可见性。主题由独立 CSS token 文件控制。" actions={canUpdate ? <Button onClick={save}><Save className="size-4" />保存设置</Button> : <Badge variant="outline">只读权限</Badge>} />

      <div className="mt-7 grid gap-5 xl:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="space-y-5">
          <section className="paper-panel p-5 md:p-7">
            <div className="flex items-center gap-3"><span className="flex size-10 items-center justify-center rounded-full bg-surface text-secondary"><Globe2 className="size-4" /></span><div><p className="label-caps">Identity</p><h2 className="mt-1 font-serif text-2xl font-bold">站点信息</h2></div></div>
            <div className="mt-6 space-y-4">
              <label className="block"><span className="mb-2 block text-xs font-semibold">站点名称</span><Input value={form.siteName} onChange={(event) => patch("siteName", event.target.value)} disabled={!canUpdate} /></label>
              <label className="block"><span className="mb-2 block text-xs font-semibold">副标题</span><Input value={form.tagline} onChange={(event) => patch("tagline", event.target.value)} disabled={!canUpdate} /></label>
              <label className="block"><span className="mb-2 block text-xs font-semibold">站点介绍</span><Textarea value={form.description} onChange={(event) => patch("description", event.target.value)} disabled={!canUpdate} /></label>
            </div>
          </section>

          <section className="paper-panel p-5 md:p-7">
            <div className="flex items-center gap-3"><span className="flex size-10 items-center justify-center rounded-full bg-surface text-secondary"><ShieldCheck className="size-4" /></span><div><p className="label-caps">Access</p><h2 className="mt-1 font-serif text-2xl font-bold">注册与验证</h2></div></div>
            <div className="mt-6 grid gap-5 md:grid-cols-2">
              <label className="block"><span className="mb-2 block text-xs font-semibold">注册模式</span><Select value={form.registrationMode} onChange={(event) => patch("registrationMode", event.target.value as SiteSettings["registrationMode"])} disabled={!canUpdate}><option value="open">开放注册</option><option value="invite">仅邀请</option><option value="closed">关闭注册</option></Select><span className="mt-2 block text-[0.65rem] leading-5 text-muted-foreground">开放注册允许访客自行创建账号。</span></label>
              <div className="rounded-ui border border-border bg-surface/40 p-4"><div className="flex items-center justify-between gap-3"><div><p className="flex items-center gap-2 text-sm font-semibold"><Mail className="size-4 text-secondary" />邮箱验证</p><p className="mt-1 text-xs leading-5 text-muted-foreground">启用后，新用户需要验证邮箱才能投稿。</p></div><Switch checked={form.emailVerification} onCheckedChange={(checked) => patch("emailVerification", checked)} disabled={!canUpdate} /></div></div>
            </div>
          </section>

          <section className="paper-panel p-5 md:p-7">
            <div className="flex items-center gap-3"><span className="flex size-10 items-center justify-center rounded-full bg-surface text-secondary"><ImageIcon className="size-4" /></span><div><p className="label-caps">Uploads</p><h2 className="mt-1 font-serif text-2xl font-bold">图片限制</h2></div></div>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <label className="block"><span className="mb-2 block text-xs font-semibold">每条投稿图片上限</span><Input type="number" min={1} max={100} value={form.maxImages} onChange={(event) => patch("maxImages", Number(event.target.value))} disabled={!canUpdate} /><span className="mt-2 block text-[0.65rem] text-muted-foreground">包含封面、正面、背面和细节图。</span></label>
              <label className="block"><span className="mb-2 block text-xs font-semibold">单张图片大小上限（MB）</span><Input type="number" min={1} max={100} value={form.maxImageSizeMb} onChange={(event) => patch("maxImageSizeMb", Number(event.target.value))} disabled={!canUpdate} /><span className="mt-2 block text-[0.65rem] text-muted-foreground">仅模拟校验，不上传真实文件。</span></label>
            </div>
          </section>

          <section className="paper-panel p-5 md:p-7">
            <div><p className="label-caps">Default Visibility</p><h2 className="mt-2 font-serif text-2xl font-bold">字段默认可见性</h2><p className="mt-2 max-w-2xl text-xs leading-6 text-muted-foreground">投稿未覆盖某个字段时使用这里的规则。作者、审核员和卡片管理员始终可以看到完整资料。</p></div>
            <div className="mt-5"><VisibilityEditor value={defaults} defaults={state.settings.fieldDefaults} roles={state.roles} onChange={(next) => setDefaults(next as FieldVisibility)} showOverrideState={false} /></div>
          </section>
        </div>

        <aside className="space-y-4 xl:sticky xl:top-24">
          <section className="rounded-card border border-border bg-surface/55 p-5">
            <p className="flex items-center gap-2 text-sm font-semibold"><CheckCircle2 className="size-4 text-success" />运行状态</p>
            <div className="mt-4 space-y-3 text-xs">
              <StatusRow label="安装状态" value={state.settings.installed ? "已完成" : "未安装"} />
              <StatusRow label="当前主题" value={themeName(state.theme)} />
              <StatusRow label="权限节点" value={`${state.roles.reduce((sum, role) => sum + role.permissions.length, 0)} 项`} />
              <StatusRow label="演示模式" value="内存数据" />
            </div>
          </section>

          <section className="rounded-card border border-border bg-card p-5">
            <p className="flex items-center gap-2 text-sm font-semibold"><Palette className="size-4 text-secondary" />主题架构</p>
            <p className="mt-3 text-xs leading-6 text-muted-foreground">同一套组件只消费语义 token。新增主题时创建 `themes/&lt;name&gt;.css`，在 `globals.css` 引入，并加入 `ThemeId` 与主题选择器即可，不需要改页面。</p>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <div className="rounded-ui bg-surface p-3"><span className="block size-5 rounded-full bg-primary" /><p className="mt-2 text-[0.65rem] font-semibold">主色</p></div>
              <div className="rounded-ui bg-surface p-3"><span className="block size-5 rounded-full bg-secondary" /><p className="mt-2 text-[0.65rem] font-semibold">辅助色</p></div>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}

function StatusRow({ label, value }: { label: string; value: string }) {
  return <div className="flex items-center justify-between gap-3 border-b border-border/60 pb-2 last:border-0 last:pb-0"><span className="text-muted-foreground">{label}</span><span className="font-semibold">{value}</span></div>;
}
