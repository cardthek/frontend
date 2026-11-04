"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LockKeyhole, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/lib/app-store";
import type { PermissionKey } from "@/lib/types";

export function AuthGuard({ children, permission }: { children: React.ReactNode; permission?: PermissionKey }) {
  const pathname = usePathname();
  const { currentUser, can } = useAppStore();
  const loginHref = pathname && pathname !== "/login" ? `/login?next=${encodeURIComponent(pathname)}` : "/login";

  if (!currentUser) {
    return (
      <div className="mx-auto flex min-h-[55vh] max-w-xl flex-col items-center justify-center px-4 text-center">
        <span className="flex size-14 items-center justify-center rounded-full bg-surface text-secondary">
          <LogIn className="size-6" />
        </span>
        <h1 className="mt-5 font-serif text-3xl font-bold">请先登录</h1>
        <p className="mt-3 text-sm leading-7 text-muted-foreground">该页面需要登录后访问。登录成功后会返回当前页面。</p>
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
        <p className="mt-3 text-sm leading-7 text-muted-foreground">当前用户组缺少对应权限节点，请联系管理员调整权限。</p>
        <Button asChild variant="outline" className="mt-6"><Link href="/">返回公开站</Link></Button>
      </div>
    );
  }

  return <>{children}</>;
}
