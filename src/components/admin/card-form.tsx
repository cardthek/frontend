"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { CardEditor } from "@/components/cards/card-editor";
import { PageHeading } from "@/components/common/page-heading";
import { Button } from "@/components/ui/button";
import type { Card } from "@/lib/types";

export function AdminCardForm({ card }: { card?: Card }) {
  return (
    <div>
      <Button asChild variant="ghost" size="sm" className="mb-5 px-0">
        <Link href="/admin/cards"><ArrowLeft className="size-4" />返回卡片管理</Link>
      </Button>
      <PageHeading
        eyebrow={card ? "Edit Card" : "New Card"}
        title={card ? `编辑：${card.title}` : "新增卡片"}
        description={card ? "编辑卡片的全部公开信息、图片、字段可见性与发布状态。" : "创建一个新的卡片档案，可保存为草稿、待审核或立即发布。"}
      />
      <div className="mt-7"><CardEditor mode="admin" card={card} /></div>
    </div>
  );
}
