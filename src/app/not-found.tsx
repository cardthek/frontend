import Link from "next/link";
import { ArrowLeft, Sprout } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
      <span className="flex size-16 items-center justify-center rounded-[45%_55%_48%_52%] bg-surface text-secondary">
        <Sprout className="size-7" />
      </span>
      <p className="label-caps mt-6">404 · Not Found</p>
      <h1 className="mt-3 font-serif text-4xl font-bold">这片叶子还没有长出来</h1>
      <p className="mt-4 max-w-md text-sm leading-7 text-muted-foreground">你访问的页面不存在，或对应内容已经被移除。</p>
      <Button asChild className="mt-7"><Link href="/"><ArrowLeft className="size-4" />返回首页</Link></Button>
    </main>
  );
}
