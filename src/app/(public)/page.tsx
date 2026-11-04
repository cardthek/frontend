"use client";

import Link from "next/link";
import { ArrowRight, ArrowUpRight, BookOpen, Leaf, Search, ShieldCheck, Sprout } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CardPreview } from "@/components/cards/card-preview";
import { CardTile } from "@/components/cards/card-tile";
import { useAppStore } from "@/lib/app-store";

export default function HomePage() {
  const { state, currentUser } = useAppStore();
  const published = state.cards.filter((card) => card.status === "published");
  const latest = [...published]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  const featured = latest.filter((card) => card.featured).slice(0, 3);
  const curated = featured.length
    ? featured
    : latest.slice(0, 3);
  const recent = latest.slice(0, 4);
  const heroCards = [
    ...featured,
    ...latest.filter((card) => !featured.some((featuredCard) => featuredCard.uuid === card.uuid)),
  ].slice(0, 3);

  return (
    <>
      <section className="relative overflow-hidden pb-20 pt-14 md:pb-28 md:pt-20">
        <div className="hero-orbit -right-48 -top-56 size-[34rem] opacity-60" />
        <div className="hero-orbit -left-44 bottom-0 size-[25rem] opacity-45" />
        <div className="container-page relative grid items-center gap-14 lg:grid-cols-[1.05fr_0.95fr] lg:gap-10">
          <div className="animate-rise">
            <Badge variant="secondary" className="mb-6">
              <Sprout className="size-3" />
              收藏者共同维护的卡面档案
            </Badge>
            <h1 className="display-title max-w-3xl">
              把银行卡，
              <br />
              收进一页<span className="organic-underline">植物图鉴</span>。
            </h1>
            <p className="mt-7 max-w-xl text-base leading-8 text-muted-foreground md:text-lg">
              {state.settings.description || state.settings.tagline}
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Button asChild size="lg">
                <Link href="/cards">
                  <Search className="size-4" />
                  浏览卡面档案
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href={currentUser ? "/me/submissions/new" : "/register"}>
                  {currentUser ? "提交一张卡片" : "加入收藏者"}
                  <ArrowUpRight className="size-4" />
                </Link>
              </Button>
            </div>
            <div className="mt-10 grid max-w-xl grid-cols-3 gap-4 border-t border-border/70 pt-6">
              <div><p className="font-serif text-2xl font-bold">{published.length}</p><p className="mt-1 text-xs text-muted-foreground">公开卡面</p></div>
              <div><p className="font-serif text-2xl font-bold">{state.users.filter((user) => user.status !== "deleted").length}</p><p className="mt-1 text-xs text-muted-foreground">档案贡献者</p></div>
              <div><p className="font-serif text-2xl font-bold">{new Set(published.map((card) => card.releaseYear).filter((year) => year !== undefined)).size}</p><p className="mt-1 text-xs text-muted-foreground">发行年代</p></div>
            </div>
          </div>

          <div className="relative mx-auto h-[21rem] w-full max-w-xl sm:h-[27rem] lg:h-[31rem]">
            {heroCards[2] && (
              <div className="absolute left-[1%] top-[5%] w-[72%] -rotate-6 opacity-80">
                <CardPreview card={heroCards[2]} media={state.media.find((media) => media.uuid === heroCards[2].coverMediaId)} />
              </div>
            )}
            {heroCards[1] && (
              <div className="absolute right-[1%] top-[24%] w-[72%] rotate-[7deg] opacity-90">
                <CardPreview card={heroCards[1]} media={state.media.find((media) => media.uuid === heroCards[1].coverMediaId)} />
              </div>
            )}
            {heroCards[0] && (
              <div className="absolute left-[10%] top-[42%] w-[78%] rotate-[-2deg]">
                <CardPreview card={heroCards[0]} media={state.media.find((media) => media.uuid === heroCards[0].coverMediaId)} />
              </div>
            )}
            <span className="absolute bottom-1 right-3 flex size-14 items-center justify-center rounded-full border border-border bg-card font-serif text-xs font-bold shadow-card">
              2026
            </span>
          </div>
        </div>
      </section>

      <section className="border-y border-border/60 bg-surface/45 py-16 md:py-24">
        <div className="container-page">
          <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="label-caps mb-3">Curated Archive</p>
              <h2 className="section-title">本周精选卡面</h2>
              <p className="mt-3 max-w-xl text-sm leading-7 text-muted-foreground">不是排行榜，只是一些在材质、构图或印刷工艺上值得多看一眼的卡片。</p>
            </div>
            <Button asChild variant="outline">
              <Link href="/cards">查看全部 <ArrowRight className="size-4" /></Link>
            </Button>
          </div>
          <div className="mt-10 grid gap-x-5 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
            {curated.map((card) => <CardTile key={card.uuid} card={card} />)}
          </div>
        </div>
      </section>

      <section className="section-pad">
        <div className="container-page">
          <div className="grid gap-12 lg:grid-cols-[0.7fr_1.3fr] lg:gap-20">
            <div className="lg:sticky lg:top-28 lg:self-start">
              <p className="label-caps mb-3">Recently Added</p>
              <h2 className="section-title">最近入库</h2>
              <p className="mt-4 text-sm leading-7 text-muted-foreground">每一张卡片都由收藏者整理，经审核后进入公开档案。来源信息会按照贡献者设置的可见范围呈现。</p>
              <Button asChild variant="ghost" className="mt-5 px-0">
                <Link href="/cards">翻阅完整档案 <ArrowRight className="size-4" /></Link>
              </Button>
            </div>
            <div className="grid gap-x-5 gap-y-10 sm:grid-cols-2">
              {recent.map((card) => <CardTile key={card.uuid} card={card} />)}
            </div>
          </div>
        </div>
      </section>

      <section className="pb-20 md:pb-28">
        <div className="container-page">
          <div className="overflow-hidden rounded-card border border-border bg-surface">
            <div className="grid md:grid-cols-3">
              {[
                { icon: Search, title: "发现", text: "按发行方、卡组织、年份与标签，翻阅来自不同地区的卡面设计。" },
                { icon: BookOpen, title: "记录", text: "补充材质、工艺与设计背景，让一张卡片不只停留在正面照片。" },
                { icon: ShieldCheck, title: "共建", text: "投稿经过审核后公开。权限节点控制编辑、审核与发布边界。" },
              ].map((item, index) => (
                <div key={item.title} className={`p-7 md:p-9 ${index > 0 ? "border-t border-border md:border-l md:border-t-0" : ""}`}>
                  <span className="flex size-11 items-center justify-center rounded-[45%_55%_48%_52%] bg-card text-secondary shadow-card">
                    <item.icon className="size-5" />
                  </span>
                  <h3 className="mt-5 font-serif text-xl font-bold">{item.title}</h3>
                  <p className="mt-2 text-sm leading-7 text-muted-foreground">{item.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-border/60 bg-primary py-16 text-primary-foreground md:py-20">
        <div className="container-page flex flex-col items-center text-center">
          <Leaf className="size-7 opacity-70" />
          <h2 className="mt-5 max-w-2xl font-serif text-3xl font-bold leading-tight md:text-5xl">你的抽屉里，也有一张值得被记录的卡吗？</h2>
          <p className="mt-4 max-w-xl text-sm leading-7 opacity-70">注册成为收藏者，上传卡面、补充资料并提交审核。这里不记录任何支付信息。</p>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <Button asChild size="lg" variant="secondary"><Link href={currentUser ? "/me/submissions/new" : "/register"}>开始投稿</Link></Button>
            <Button asChild size="lg" variant="outline" className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10"><Link href="/about">了解规则</Link></Button>
          </div>
        </div>
      </section>
    </>
  );
}
