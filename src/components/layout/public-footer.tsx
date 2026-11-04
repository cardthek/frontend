"use client";

import Link from "next/link";
import { Leaf } from "lucide-react";
import { useAppStore } from "@/lib/app-store";

export function PublicFooter() {
  const { state } = useAppStore();
  return (
    <footer className="mt-auto border-t border-border/70 bg-surface/55">
      <div className="container-page grid gap-10 py-12 md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <div className="flex items-center gap-3 font-serif text-2xl font-bold">
            <span className="flex size-9 items-center justify-center rounded-[45%_55%_48%_52%] bg-primary text-primary-foreground">
              <Leaf className="size-4" />
            </span>
            {state.settings.siteName}
          </div>
          <p className="mt-4 max-w-md text-sm leading-7 text-muted-foreground">
            {state.settings.description || state.settings.tagline}
          </p>
        </div>
        <div>
          <p className="label-caps mb-4">浏览</p>
          <div className="flex flex-col gap-2 text-sm text-muted-foreground">
            <Link href="/cards" className="hover:text-foreground">卡面档案</Link>
            <Link href="/about" className="hover:text-foreground">关于 cardthek</Link>
            <Link href="/me/submissions/new" className="hover:text-foreground">提交卡片</Link>
          </div>
        </div>
        <div>
          <p className="label-caps mb-4">说明</p>
          <p className="text-sm leading-7 text-muted-foreground">
            这里只记录公开可见的银行卡卡面设计信息，不收集卡号、有效期、安全码或任何支付数据。
          </p>
        </div>
      </div>
      <div className="border-t border-border/60">
        <div className="container-page flex flex-col gap-2 py-5 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <span>© 2026 {state.settings.siteName}</span>
          <span>仅记录公开卡面设计信息，不包含任何支付数据。</span>
        </div>
      </div>
    </footer>
  );
}
