"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { AuthGuard } from "@/components/auth/auth-guard";
import { AdminUserForm } from "@/components/admin/user-form";
import { Button } from "@/components/ui/button";
import { useDemoStore } from "@/lib/demo-store";

export function EditUserClient({ uuid }: { uuid: string }) {
  return (
    <AuthGuard permission="users.update">
      <EditUserLookup uuid={uuid} />
    </AuthGuard>
  );
}

function EditUserLookup({ uuid }: { uuid: string }) {
  const { state } = useDemoStore();
  const user = state.users.find((item) => item.uuid === uuid && item.status !== "deleted");

  if (!user) {
    return (
      <div className="py-20 text-center">
        <h1 className="font-serif text-3xl font-bold">用户不存在</h1>
        <p className="mt-3 text-sm text-muted-foreground">它可能已被移除，或链接地址有误。</p>
        <Button asChild className="mt-6"><Link href="/admin/users"><ArrowLeft className="size-4" />返回用户管理</Link></Button>
      </div>
    );
  }

  return <AdminUserForm key={user.uuid} user={user} />;
}
