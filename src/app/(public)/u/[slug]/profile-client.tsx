"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CalendarDays, EyeOff, LockKeyhole, Mail, Shield } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CardTile } from "@/components/cards/card-tile";
import { EmptyState } from "@/components/common/empty-state";
import { apiRequest, toApiError } from "@/lib/api-client";
import { useAppStore } from "@/lib/app-store";
import type { Card, User } from "@/lib/types";
import { formatDate } from "@/lib/utils";

interface PublicProfile {
  id: number;
  uuid: string;
  username: string;
  displayName: string;
  slug: string;
  bio: string;
  avatarTone: User["avatarTone"];
  profileVisibility: User["profileVisibility"];
  showSubmissions: boolean;
  joinedAt: string;
  role: { id: string; name: string; slug: string };
}

interface ProfileResponse {
  user: PublicProfile;
  cards: Card[];
}

export function ProfileClient({ slug }: { slug: string }) {
  const { currentUser, can } = useAppStore();
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    apiRequest<ProfileResponse>(`/profiles/${encodeURIComponent(slug)}`)
      .then((payload) => {
        if (!active) return;
        setProfile(payload.data.user);
        setCards(payload.data.cards);
        setError(null);
      })
      .catch((requestError) => {
        if (active) setError(toApiError(requestError).message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [currentUser?.id, slug]);

  if (loading) {
    return (
      <div className="container-page py-24 text-center text-sm text-muted-foreground">
        正在读取贡献者主页…
      </div>
    );
  }

  if (!profile || error) {
    return (
      <div className="container-page py-24 text-center">
        <EyeOff className="mx-auto size-7 text-muted-foreground" />
        <h1 className="mt-5 font-serif text-3xl font-bold">主页不存在或不可见</h1>
        <p className="mt-3 text-sm text-muted-foreground">{error ?? "该用户可能已注销。"}</p>
        <Button asChild className="mt-6"><Link href="/">返回首页</Link></Button>
      </div>
    );
  }

  const isOwner = currentUser?.uuid === profile.uuid;
  const canSeeSubmissions =
    profile.showSubmissions || isOwner || can("users.update");

  return (
    <div className="container-page py-10 md:py-16">
      <div className="rounded-card border border-border bg-surface/55 p-6 md:p-9">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
            <Avatar name={profile.displayName} tone={profile.avatarTone} className="size-20 text-2xl" />
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="font-serif text-3xl font-bold md:text-4xl">{profile.displayName}</h1>
                {profile.role.id === "super-admin" && <Badge variant="secondary"><Shield className="size-3" />管理员</Badge>}
                <Badge variant="outline">{profile.role.name}</Badge>
              </div>
              <p className="mt-1 font-mono text-xs text-muted-foreground">@{profile.username} · ID {profile.id}</p>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-muted-foreground">{profile.bio}</p>
            </div>
          </div>
          {isOwner && <Button asChild variant="outline"><Link href="/me/profile">编辑主页</Link></Button>}
        </div>
        <div className="mt-7 flex flex-wrap gap-x-6 gap-y-2 border-t border-border/70 pt-5 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5"><CalendarDays className="size-3.5" />加入于 {formatDate(profile.joinedAt)}</span>
          {isOwner && <span className="flex items-center gap-1.5"><Mail className="size-3.5" />{currentUser?.email}</span>}
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
