"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { AuthGuard } from "@/components/auth/auth-guard";
import { CardEditor } from "@/components/cards/card-editor";
import { PageHeading } from "@/components/common/page-heading";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useDemoStore } from "@/lib/demo-store";

export function ReviewEditClient({ uuid }: { uuid: string }) {
  return <AuthGuard permission="submissions.review"><ReviewEditLookup uuid={uuid} /></AuthGuard>;
}

function ReviewEditLookup({ uuid }: { uuid: string }) {
  const { state } = useDemoStore();
  const card = state.cards.find((item) => item.uuid === uuid);

  if (!card) {
    return (
      <div className="py-20 text-center">
        <h1 className="font-serif text-3xl font-bold">投稿不存在</h1>
        <p className="mt-3 text-sm text-muted-foreground">它可能已被删除，或链接地址有误。</p>
        <Button asChild className="mt-6"><Link href="/admin/submissions"><ArrowLeft className="size-4" />返回审核队列</Link></Button>
      </div>
    );
  }

  if (card.status !== "pending") {
    return (
      <div className="py-20 text-center">
        <Badge variant="outline">当前状态不可审核</Badge>
        <h1 className="mt-4 font-serif text-3xl font-bold">这条投稿已经处理</h1>
        <p className="mt-3 text-sm text-muted-foreground">只有待审核投稿可以进入审核编辑页。</p>
        <div className="mt-6 flex justify-center gap-2"><Button asChild variant="outline"><Link href="/admin/submissions">返回审核队列</Link></Button><Button asChild><Link href={`/admin/cards/${card.uuid}/edit`}>编辑卡片</Link></Button></div>
      </div>
    );
  }

  return (
    <div>
      <Button asChild variant="ghost" size="sm" className="mb-5 px-0"><Link href="/admin/submissions"><ArrowLeft className="size-4" />返回审核队列</Link></Button>
      <PageHeading eyebrow="Review Edit" title={`审核编辑：${card.title}`} description="审核页与投稿页使用同一套编辑模板。修改资料后可保存、要求修改、拒绝或直接通过。" />
      <div className="mt-7"><CardEditor mode="review" card={card} /></div>
    </div>
  );
}
