"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { AuthGuard } from "@/components/auth/auth-guard";
import { AdminCardForm } from "@/components/admin/card-form";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/lib/app-store";

export function EditCardClient({ uuid }: { uuid: string }) {
  return (
    <AuthGuard permission="cards.update">
      <EditCardLookup uuid={uuid} />
    </AuthGuard>
  );
}

function EditCardLookup({ uuid }: { uuid: string }) {
  const { state } = useAppStore();
  const card = state.cards.find((item) => item.uuid === uuid);

  if (!card) {
    return (
      <div className="py-20 text-center">
        <h1 className="font-serif text-3xl font-bold">卡片不存在</h1>
        <p className="mt-3 text-sm text-muted-foreground">它可能已被删除，或链接地址有误。</p>
        <Button asChild className="mt-6"><Link href="/admin/cards"><ArrowLeft className="size-4" />返回卡片管理</Link></Button>
      </div>
    );
  }

  return <AdminCardForm key={card.uuid} card={card} />;
}
