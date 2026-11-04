"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LockKeyhole, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useDemoStore } from "@/lib/demo-store";
import type { PermissionKey } from "@/lib/types";

export function AuthGuard({ children, permission }: { children: React.ReactNode; permission?: PermissionKey }) {
  const pathname = usePathname();
  const { currentUser, can } = useDemoStore();
  const loginHref = pathname && pathname !== "/login" ? `/login?next=${encodeURIComponent(pathname)}` : "/login";

  if (!currentUser) {
    return (
      <div className="mx-auto flex min-h-[55vh] max-w-xl flex-col items-center justify-center px-4 text-center">
        <span className="flex size-14 items-center justify-center rounded-full bg-surface text-secondary">
          <LogIn className="size-6" />
        </span>
        <h1 className="mt-5 font-serif text-3xl font-bold">请先登录</h1>
        <p className="mt-3 text-sm leading-7 text-muted-foreground">这是演示账号保护区。你可以使用预置账号，或在右下角直接切换身份。</p>
        <Button asChild className="mt-6"><Link href={loginHref}>前往登录</Link></Button>
      </div>
    );
  }

  if (permission && !can(permission)) {
    return (
      <div className="mx-auto flex min-h-[55vh] max-w-xl flex-col items-center justify-center px-4 text-center">
        <span className="flex size-14 items-center justify-center rounded-full bg-surface text-destructive">
          <LockKeyhole className="size-6" />
        </span>
        <h1 className="mt-5 font-serif text-3xl font-bold">没有访问权限</h1>
        <p className="mt-3 text-sm leading-7 text-muted-foreground">当前身份缺少对应权限节点。请切换为审核员或管理员继续体验。</p>
        <Button asChild variant="outline" className="mt-6"><Link href="/">返回公开站</Link></Button>
      </div>
    );
  }

  return <>{children}</>;
}
