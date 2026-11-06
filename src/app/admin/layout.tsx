import { Suspense } from "react";
import { AdminShell } from "@/components/layout/admin-shell";
import { AuthGuard } from "@/components/auth/auth-guard";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard permission="dashboard.read">
      <Suspense fallback={<div className="min-h-screen bg-background" />}>
        <AdminShell>{children}</AdminShell>
      </Suspense>
    </AuthGuard>
  );
}
