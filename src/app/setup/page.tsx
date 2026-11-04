"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Check, Leaf, LockKeyhole, Palette, Settings2, Sprout, UserRound } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { CardPreview } from "@/components/cards/card-preview";
import { useDemoStore } from "@/lib/demo-store";
import { themeName, themeOptions } from "@/lib/theme";
import type { ThemeId } from "@/lib/types";
import { cn, isNumericUsername } from "@/lib/utils";

const steps = ["站点信息", "管理员", "主题样式", "完成安装"];

export default function SetupPage() {
  const router = useRouter();
  const { state, completeSetup, setTheme } = useDemoStore();
  const [step, setStep] = useState(0);
  const [siteName, setSiteName] = useState("卡迹");
  const [tagline, setTagline] = useState("把银行卡当作一页小小的设计档案");
  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [theme, setThemeChoice] = useState<ThemeId>(state.theme);

  function next() {
    if (step === 0 && !siteName.trim()) return toast.error("请填写站点名称");
    if (step === 1) {
      if (!displayName.trim() || !username.trim() || !email.trim() || password.length < 8) return toast.error("请完整填写管理员信息，密码至少 8 个字符");
      if (isNumericUsername(username)) return toast.error("用户名不能是纯数字");
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return toast.error("请输入有效邮箱");
    }
    if (step === 2) setTheme(theme);
    setStep((current) => Math.min(current + 1, steps.length - 1));
  }

  function install() {
    completeSetup(siteName.trim(), displayName.trim(), username.trim(), email.trim());
    setTheme(theme);
    toast.success("站点初始化完成");
    router.push("/admin");
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-background px-4 py-8 md:py-12">
      <div className="hero-orbit -right-52 -top-52 size-[36rem] opacity-50" />
      <div className="container-page relative max-w-5xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-3 font-serif text-xl font-bold"><span className="flex size-9 items-center justify-center rounded-[45%_55%_48%_52%] bg-primary text-primary-foreground"><Leaf className="size-4" /></span>卡迹安装向导</Link>
          {state.settings.installed && <Badge variant="warning">重装演示模式</Badge>}
        </div>

        <div className="mx-auto mt-9 max-w-3xl">
          <div className="flex items-center justify-between gap-2">
            {steps.map((label, index) => (
              <div key={label} className="flex flex-1 items-center gap-2 last:flex-none">
                <span className={cn("flex size-7 shrink-0 items-center justify-center rounded-full border text-[0.65rem] font-bold", index < step ? "border-secondary bg-secondary text-secondary-foreground" : index === step ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-muted-foreground")}>
                  {index < step ? <Check className="size-3.5" /> : index + 1}
                </span>
                <span className={cn("hidden whitespace-nowrap text-xs font-semibold sm:block", index === step ? "text-foreground" : "text-muted-foreground")}>{label}</span>
                {index < steps.length - 1 && <span className="h-px flex-1 bg-border" />}
              </div>
            ))}
          </div>
          <Progress value={((step + 1) / steps.length) * 100} className="mt-4" />
        </div>

        <Card className="mx-auto mt-8 max-w-3xl overflow-hidden">
          <div className="grid md:grid-cols-[1fr_0.78fr]">
            <div className="p-6 md:p-9">
              {step === 0 && (
                <div>
                  <span className="flex size-11 items-center justify-center rounded-full bg-surface text-secondary"><Sprout className="size-5" /></span>
                  <h1 className="mt-5 font-serif text-3xl font-bold">建立你的卡面档案室</h1>
                  <p className="mt-2 text-sm leading-7 text-muted-foreground">安装数据仅保存在当前浏览器内存中，刷新后会恢复演示状态。</p>
                  <div className="mt-6 space-y-4">
                    <div><Label htmlFor="siteName">站点名称</Label><Input id="siteName" value={siteName} onChange={(event) => setSiteName(event.target.value)} /></div>
                    <div><Label htmlFor="tagline">一句话介绍</Label><Input id="tagline" value={tagline} onChange={(event) => setTagline(event.target.value)} /></div>
                  </div>
                </div>
              )}

              {step === 1 && (
                <div>
                  <span className="flex size-11 items-center justify-center rounded-full bg-surface text-secondary"><UserRound className="size-5" /></span>
                  <h1 className="mt-5 font-serif text-3xl font-bold">创建超级管理员</h1>
                  <p className="mt-2 text-sm leading-7 text-muted-foreground">该账号会获得全部权限节点，并可继续创建角色、审核员与内容编辑。</p>
                  <div className="mt-6 grid gap-4 sm:grid-cols-2">
                    <div><Label htmlFor="displayName">显示名称</Label><Input id="displayName" value={displayName} onChange={(event) => setDisplayName(event.target.value)} placeholder="例如 山茶" /></div>
                    <div><Label htmlFor="username">用户名</Label><Input id="username" value={username} onChange={(event) => setUsername(event.target.value)} placeholder="不能是纯数字" /></div>
                  </div>
                  <div className="mt-4"><Label htmlFor="email">邮箱</Label><Input id="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="admin@example.com" /></div>
                  <div className="mt-4"><Label htmlFor="password">密码</Label><Input id="password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="至少 8 个字符" /></div>
                </div>
              )}

              {step === 2 && (
                <div>
                  <span className="flex size-11 items-center justify-center rounded-full bg-surface text-secondary"><Palette className="size-5" /></span>
                  <h1 className="mt-5 font-serif text-3xl font-bold">选择初始主题</h1>
                  <p className="mt-2 text-sm leading-7 text-muted-foreground">主题只改变 CSS 变量，不改变页面结构与业务逻辑。之后可以随时在演示控制台切换。</p>
                  <div className="mt-6 space-y-3">
                    {themeOptions.map((item) => (
                      <button key={item.id} onClick={() => { setThemeChoice(item.id); setTheme(item.id); }} className={cn("flex w-full items-center justify-between rounded-ui border p-4 text-left", theme === item.id ? "border-primary bg-surface" : "border-border hover:bg-surface")}>
                        <span><span className="block font-semibold">{item.name}</span><span className="mt-1 block text-xs text-muted-foreground">{item.note}</span></span>
                        <span className="flex gap-1"><span className="size-4 rounded-full bg-primary" /><span className="size-4 rounded-full bg-secondary" /><span className="size-4 rounded-full bg-accent" /></span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {step === 3 && (
                <div>
                  <span className="flex size-11 items-center justify-center rounded-full bg-success/10 text-success"><Check className="size-5" /></span>
                  <h1 className="mt-5 font-serif text-3xl font-bold">准备完成安装</h1>
                  <p className="mt-2 text-sm leading-7 text-muted-foreground">确认以下信息后，将创建管理员、写入演示站点设置并进入后台。</p>
                  <dl className="mt-6 divide-y divide-border rounded-ui border border-border bg-surface px-4">
                    <Summary label="站点名称" value={siteName} />
                    <Summary label="管理员" value={`${displayName} (@${username})`} />
                    <Summary label="邮箱" value={email} />
                    <Summary label="主题" value={themeName(theme)} />
                  </dl>
                  <p className="mt-4 flex gap-2 text-xs leading-5 text-muted-foreground"><LockKeyhole className="mt-0.5 size-3.5 shrink-0" />本演示不会把密码写入状态或发送到网络。</p>
                </div>
              )}

              <div className="mt-8 flex items-center justify-between gap-3 border-t border-border/70 pt-5">
                <Button variant="ghost" onClick={() => step === 0 ? router.push("/") : setStep((current) => current - 1)}>
                  <ArrowLeft className="size-4" />{step === 0 ? "返回首页" : "上一步"}
                </Button>
                {step < steps.length - 1 ? <Button onClick={next}>继续 <ArrowRight className="size-4" /></Button> : <Button onClick={install}><Settings2 className="size-4" />完成安装</Button>}
              </div>
            </div>

            <aside className="hidden border-l border-border bg-surface/60 p-6 md:block">
              <p className="label-caps">Preview</p>
              <p className="mt-2 text-xs leading-6 text-muted-foreground">卡面档案将使用当前主题的语义化颜色、圆角与字体变量。</p>
              <div className="mt-7 -rotate-3"><CardPreview title="苔原 · 晨雾" /></div>
              <div className="mt-8 space-y-3">
                <div className="h-2 w-3/4 rounded-pill bg-secondary/40" />
                <div className="h-2 w-full rounded-pill bg-border" />
                <div className="h-2 w-2/3 rounded-pill bg-border" />
              </div>
              <p className="mt-8 text-[0.65rem] leading-5 text-muted-foreground">安装完成后，示例卡片、角色、字典与审核记录仍会保留，便于继续体验全部后台功能。</p>
            </aside>
          </div>
        </Card>
      </div>
    </main>
  );
}

function Summary({ label, value }: { label: string; value: string }) {
  return <div className="flex items-center justify-between gap-4 py-3 text-sm"><dt className="text-muted-foreground">{label}</dt><dd className="text-right font-semibold">{value}</dd></div>;
}
