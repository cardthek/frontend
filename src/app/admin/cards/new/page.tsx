"use client";

import { AuthGuard } from "@/components/auth/auth-guard";
import { AdminCardForm } from "@/components/admin/card-form";

export default function NewAdminCardPage() {
  return (
    <AuthGuard permission="cards.create">
      <AdminCardForm />
    </AuthGuard>
  );
}
