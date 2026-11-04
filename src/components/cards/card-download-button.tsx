"use client";

import { useState } from "react";
import { Download, LoaderCircle } from "lucide-react";
import { toast } from "sonner";
import { useAppStore } from "@/lib/app-store";
import { downloadCardFace } from "@/lib/download-card-face";
import type { Card, MediaAsset } from "@/lib/types";
import { cn } from "@/lib/utils";

export function CardDownloadButton({
  card,
  media,
  compact = false,
  className,
}: {
  card: Card;
  media?: MediaAsset;
  compact?: boolean;
  className?: string;
}) {
  const [downloading, setDownloading] = useState(false);
  const { recordCardDownload } = useAppStore();

  async function handleDownload(event: React.MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    event.stopPropagation();
    setDownloading(true);
    try {
      await downloadCardFace(card, media);
      recordCardDownload(card.uuid);
      toast.success("卡面已开始下载");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "卡面下载失败，请稍后重试");
    } finally {
      setDownloading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleDownload}
      disabled={downloading}
      className={cn(
        "flex items-center justify-center rounded-full border border-white/50 bg-background/90 text-foreground shadow-card backdrop-blur transition-colors hover:bg-primary hover:text-primary-foreground disabled:opacity-60",
        compact ? "size-7" : "size-9",
        className,
      )}
      aria-label={`下载 ${card.title} 卡面`}
      title="下载卡面"
    >
      {downloading ? <LoaderCircle className={compact ? "size-3.5 animate-spin" : "size-4 animate-spin"} /> : <Download className={compact ? "size-3.5" : "size-4"} />}
    </button>
  );
}
