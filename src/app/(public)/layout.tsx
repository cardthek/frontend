import { Suspense } from "react";
import { PublicHeader } from "@/components/layout/public-header";
import { PublicFooter } from "@/components/layout/public-footer";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <Suspense fallback={<div className="h-18 border-b border-border/70 bg-background" />}>
        <PublicHeader />
      </Suspense>
      <main className="flex-1">{children}</main>
      <Suspense fallback={null}>
        <PublicFooter />
      </Suspense>
    </div>
  );
}
