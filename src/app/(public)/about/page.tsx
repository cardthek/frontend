import Link from "next/link";
import { BookOpenCheck, Database, Eye, Leaf, ShieldCheck, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AboutPage() {
  return (
    <div className="container-page py-12 md:py-20">
      <div className="mx-auto max-w-3xl text-center">
        <span className="mx-auto flex size-14 rotate-[-4deg] items-center justify-center rounded-[45%_55%_48%_52%] bg-primary text-primary-foreground"><Leaf className="size-6" /></span>
        <p className="label-caps mt-6">About Card Archive</p>
        <h1 className="mt-4 font-serif text-4xl font-bold leading-tight md:text-6xl">关于卡迹</h1>
        <p className="mt-6 text-base leading-8 text-muted-foreground md:text-lg">卡迹是一个非商业的银行卡卡面设计档案项目。我们只记录公开可见的设计信息，不收集卡号、有效期、安全码或任何支付数据。</p>
      </div>

      <div className="mx-auto mt-14 grid max-w-5xl gap-5 md:grid-cols-2">
        {[
          { icon: Upload, title: "收藏者投稿", text: "注册用户可创建草稿、上传卡面占位图并补充发行信息。提交后进入审核队列。" },
          { icon: ShieldCheck, title: "人工审核", text: "审核员检查信息来源、图片质量与敏感字段。审核通过后卡片才会进入公开档案。" },
          { icon: Eye, title: "字段级可见性", text: "不同字段可以分别设置为所有人、登录用户、作者、管理员或指定角色可见。" },
          { icon: Database, title: "结构化管理", text: "发行方、卡组织、类型、等级与地区均由字典维护，方便后续建立稳定的数据接口。" },
        ].map((item) => (
          <div key={item.title} className="rounded-card border border-border bg-card p-6 md:p-8">
            <span className="flex size-11 items-center justify-center rounded-full bg-surface text-secondary"><item.icon className="size-5" /></span>
            <h2 className="mt-5 font-serif text-2xl font-bold">{item.title}</h2>
            <p className="mt-3 text-sm leading-7 text-muted-foreground">{item.text}</p>
          </div>
        ))}
      </div>

      <div className="mx-auto mt-14 max-w-3xl rounded-card border border-border bg-surface p-7 md:p-10">
        <p className="label-caps">Demo Scope</p>
        <h2 className="mt-3 font-serif text-2xl font-bold">当前版本包含什么？</h2>
        <div className="mt-5 grid gap-3 text-sm leading-7 text-muted-foreground sm:grid-cols-2">
          <p className="flex gap-2"><BookOpenCheck className="mt-1 size-4 shrink-0 text-secondary" />公开首页、卡库、详情与用户主页</p>
          <p className="flex gap-2"><BookOpenCheck className="mt-1 size-4 shrink-0 text-secondary" />注册、登录、找回密码与安装向导</p>
          <p className="flex gap-2"><BookOpenCheck className="mt-1 size-4 shrink-0 text-secondary" />投稿草稿、修改与提交审核</p>
          <p className="flex gap-2"><BookOpenCheck className="mt-1 size-4 shrink-0 text-secondary" />审核、角色权限、字典、媒体与审计后台</p>
        </div>
        <p className="mt-5 border-t border-border/70 pt-5 text-xs leading-6 text-muted-foreground">本版本为纯前端演示，没有 API 请求或持久化存储。正式前后端将使用两个独立 Git 仓库开发。</p>
        <Button asChild className="mt-6"><Link href="/cards">开始浏览档案</Link></Button>
      </div>
    </div>
  );
}
