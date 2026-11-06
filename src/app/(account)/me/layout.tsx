import { Suspense } from "react";
import { PublicHeader } from "@/components/layout/public-header";
import { PublicFooter } from "@/components/layout/public-footer";
import { AccountNav } from "@/components/account/account-nav";
import { AuthGuard } from "@/components/auth/auth-guard";

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <Suspense fallback={<div className="h-18 border-b border-border/70 bg-background" />}>
        <PublicHeader />
      </Suspense>
      <main className="container-page flex-1 py-8 md:py-12">
        <div className="grid gap-6 lg:grid-cols-[13rem_minmax(0,1fr)] lg:items-start">
          <Suspense fallback={<div className="h-14 rounded-card border border-border bg-card" />}>
            <AccountNav />
          </Suspense>
          <AuthGuard>{children}</AuthGuard>
        </div>
      </main>
      <Suspense fallback={null}>
        <PublicFooter />
      </Suspense>
    </div>
  );
}
