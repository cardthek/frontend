"use client";

import Link from "next/link";
import { ArrowLeft, LockKeyhole } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SubmissionForm } from "@/components/submissions/submission-form";
import { useDemoStore } from "@/lib/demo-store";

export function EditSubmissionClient({ uuid }: { uuid: string }) {
  const { state, currentUser, can } = useDemoStore();
  const card = state.cards.find((item) => item.uuid === uuid);

  if (!card) {
    return (
      <div className="py-20 text-center">
        <h1 className="font-serif text-3xl font-bold">投稿不存在</h1>
        <Button asChild className="mt-6"><Link href="/me/submissions">返回投稿列表</Link></Button>
      </div>
    );
  }

  const canEdit = currentUser?.id === card.ownerId || can("cards.update");
  if (!canEdit) {
    return (
      <div className="py-20 text-center">
        <LockKeyhole className="mx-auto size-8 text-muted-foreground" />
        <h1 className="mt-5 font-serif text-3xl font-bold">无权编辑这条投稿</h1>
        <Button asChild className="mt-6"><Link href="/me/submissions">返回投稿列表</Link></Button>
      </div>
    );
  }

  return (
    <div>
      <Button asChild variant="ghost" size="sm" className="mb-5 px-0">
        <Link href={`/me/submissions/${card.uuid}`}><ArrowLeft className="size-4" />返回投稿详情</Link>
      </Button>
      <p className="label-caps mb-3">Edit Contribution</p>
      <h1 className="section-title">编辑投稿</h1>
      <p className="mt-3 max-w-2xl text-sm leading-7 text-muted-foreground">修改卡片资料与卡面图片。已提交或已发布的投稿也可以继续编辑；字段可见性是否可调由当前用户组权限决定。</p>
      <div className="mt-7"><SubmissionForm card={card} /></div>
    </div>
  );
}
