import Link from "next/link";
import { Leaf } from "lucide-react";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-12">
      <div className="hero-orbit -left-32 top-16 size-[24rem]" />
      <div className="hero-orbit -bottom-40 -right-20 size-[32rem]" />
      <div className="relative w-full max-w-md">
        <Link href="/" className="mb-8 flex items-center justify-center gap-3 font-serif text-2xl font-bold">
          <span className="flex size-10 rotate-[-4deg] items-center justify-center rounded-[45%_55%_48%_52%] bg-primary text-primary-foreground">
            <Leaf className="size-5" />
          </span>
          卡迹
        </Link>
        {children}
        <p className="mt-8 text-center text-xs text-muted-foreground">
          当前为纯前端交互演示 · 刷新后恢复初始状态
        </p>
      </div>
    </main>
  );
}
