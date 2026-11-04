"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import type { ReactNode } from "react";
import { CardDownloadButton } from "@/components/cards/card-download-button";
import type { Card, MediaAsset } from "@/lib/types";

export function CardLightbox({
  open,
  onOpenChange,
  card,
  media,
  showDownload = false,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  card: Card;
  media?: MediaAsset;
  showDownload?: boolean;
  children: ReactNode;
}) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[90] bg-foreground/75 backdrop-blur-md data-[state=open]:animate-[lightbox-overlay-in_180ms_ease-out]" />
        <Dialog.Content
          className="fixed inset-0 z-[91] flex items-center justify-center p-4 outline-none data-[state=open]:animate-[lightbox-content-in_180ms_ease-out] md:p-8"
          onPointerDown={(event) => {
            if (event.target === event.currentTarget) onOpenChange(false);
          }}
        >
          <Dialog.Title className="sr-only">{card.title} 卡面预览</Dialog.Title>
          <Dialog.Description className="sr-only">按 Escape 或点击关闭按钮退出卡面预览。</Dialog.Description>
          <div className="absolute right-4 top-4 z-20 flex items-center gap-2 md:right-7 md:top-7">
            {showDownload && media && <CardDownloadButton card={card} media={media} className="size-10 border-white/30 shadow-float" />}
            <Dialog.Close className="flex size-10 items-center justify-center rounded-full border border-white/30 bg-background/90 text-foreground shadow-float backdrop-blur transition-colors hover:bg-primary hover:text-primary-foreground" aria-label="关闭卡面预览">
              <X className="size-5" />
            </Dialog.Close>
          </div>
          <div className="relative w-full max-w-5xl">
            {children}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
