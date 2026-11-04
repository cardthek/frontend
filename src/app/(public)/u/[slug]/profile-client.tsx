"use client";

import Link from "next/link";
import { CalendarDays, EyeOff, LockKeyhole, Mail, Shield } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CardTile } from "@/components/cards/card-tile";
import { EmptyState } from "@/components/common/empty-state";
import { useDemoStore } from "@/lib/demo-store";
import { formatDate } from "@/lib/utils";

export function ProfileClient({ slug }: { slug: string }) {
  const { state, currentUser, isProfileVisible, can } = useDemoStore();
  const profile = state.users.find((user) => user.slug === slug);

  if (!profile) {
    return (
      <div className="container-page py-24 text-center">
        <h1 className="font-serif text-3xl font-bold">用户不存在</h1>
        <Button asChild className="mt-6"><Link href="/">返回首页</Link></Button>
      </div>
    );
  }

  if (profile.status === "deleted") {
    return (
      <div className="container-page flex min-h-[60vh] flex-col items-center justify-center py-20 text-center">
        <span className="flex size-14 items-center justify-center rounded-full bg-surface text-muted-foreground"><EyeOff className="size-6" /></span>
        <h1 className="mt-5 font-serif text-3xl font-bold">{profile.displayName}</h1>
        <Button asChild variant="outline" className="mt-6"><Link href="/cards">浏览卡面档案</Link></Button>
      </div>
    );
  }

  if (!isProfileVisible(profile)) {
    return (
      <div className="container-page flex min-h-[60vh] flex-col items-center justify-center py-20 text-center">
        <span className="flex size-14 items-center justify-center rounded-full bg-surface text-muted-foreground"><EyeOff className="size-6" /></span>
        <h1 className="mt-5 font-serif text-3xl font-bold">这个主页没有公开</h1>
        <p className="mt-3 max-w-md text-sm leading-7 text-muted-foreground">贡献者将主页可见范围设置为{profile.profileVisibility === "authenticated" ? "登录后可见" : "仅自己可见"}。请登录或切换演示身份后再试。</p>
        <Button asChild variant="outline" className="mt-6"><Link href="/login">登录</Link></Button>
      </div>
    );
  }

  const isOwner = currentUser?.id === profile.id;
  const canSeeSubmissions = profile.showSubmissions || isOwner || can("users.update");
  const cards = state.cards.filter((card) => card.ownerId === profile.id && (card.status === "published" || isOwner || can("cards.update")));

  return (
    <div className="container-page py-10 md:py-16">
      <div className="rounded-card border border-border bg-surface/55 p-6 md:p-9">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
            <Avatar name={profile.displayName} tone={profile.avatarTone} className="size-20 text-2xl" />
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="font-serif text-3xl font-bold md:text-4xl">{profile.displayName}</h1>
                {profile.roleIds.includes("super-admin") && <Badge variant="secondary"><Shield className="size-3" />管理员</Badge>}
                {profile.status === "suspended" && <Badge variant="destructive">已停用</Badge>}
              </div>
              <p className="mt-1 font-mono text-xs text-muted-foreground">@{profile.username} · ID {profile.id}</p>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-muted-foreground">{profile.bio}</p>
            </div>
          </div>
          {isOwner && <Button asChild variant="outline"><Link href="/me/profile">编辑主页</Link></Button>}
        </div>
        <div className="mt-7 flex flex-wrap gap-x-6 gap-y-2 border-t border-border/70 pt-5 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5"><CalendarDays className="size-3.5" />加入于 {formatDate(profile.joinedAt)}</span>
          {isOwner && <span className="flex items-center gap-1.5"><Mail className="size-3.5" />{profile.email}</span>}
          {profile.profileVisibility !== "public" && <span className="flex items-center gap-1.5"><LockKeyhole className="size-3.5" />受限主页</span>}
        </div>
      </div>

      <div className="mt-12 flex items-end justify-between gap-4 border-b border-border pb-5">
        <div><p className="label-caps mb-2">Contribution</p><h2 className="font-serif text-2xl font-bold">公开卡片</h2></div>
        <p className="text-sm text-muted-foreground">{canSeeSubmissions ? `${cards.length} 条记录` : "贡献者已隐藏投稿列表"}</p>
      </div>

      {!canSeeSubmissions ? (
        <div className="mt-7"><EmptyState title="投稿列表未公开" description="这位贡献者选择不在主页展示自己的投稿记录。" /></div>
      ) : cards.length > 0 ? (
        <div className="mt-8 grid gap-x-5 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map((card) => <CardTile key={card.uuid} card={card} showStatus={isOwner || can("cards.update")} />)}
        </div>
      ) : (
        <div className="mt-7"><EmptyState title="还没有公开卡片" description="这位贡献者暂时没有可展示的卡片记录。" /></div>
      )}
    </div>
  );
}
