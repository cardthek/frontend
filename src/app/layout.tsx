import type { Metadata, Viewport } from "next";
import { Toaster } from "sonner";
import { DemoProvider } from "@/lib/demo-store";
import { DemoController } from "@/components/demo/demo-controller";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "卡迹 · 银行卡卡面档案",
    template: "%s · 卡迹",
  },
  description: "由收藏者共同整理的银行卡卡面设计档案室。记录颜色、材质、发行年代与设计细节。",
};

export const viewport: Viewport = {
  themeColor: "#faf6f1",
  colorScheme: "light",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="zh-CN" data-theme="natural" className="h-full antialiased" suppressHydrationWarning>
      <body className="flex min-h-full flex-col">
        <DemoProvider>
          {children}
          <DemoController />
          <Toaster
            position="top-center"
            richColors
            toastOptions={{
              style: {
                background: "var(--card)",
                color: "var(--foreground)",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius-md)",
                fontFamily: "var(--font-body)",
              },
            }}
          />
        </DemoProvider>
      </body>
    </html>
  );
}
