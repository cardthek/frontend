"use client";

import { AuthGuard } from "@/components/auth/auth-guard";
import { AdminUserForm } from "@/components/admin/user-form";

export default function NewAdminUserPage() {
  return (
    <AuthGuard permission="users.update">
      <AdminUserForm />
    </AuthGuard>
  );
}
