"use client";

import { useId, useRef, useState, type ReactNode } from "react";
import { flushSync } from "react-dom";
import { CardFace } from "@/components/cards/card-face";
import { CardLightbox } from "@/components/cards/card-lightbox";
import { CardTilt } from "@/components/cards/card-tilt";
import type { Card, MediaAsset } from "@/lib/types";
import { cn } from "@/lib/utils";

interface ViewTransitionLike {
  ready: Promise<void>;
  finished: Promise<void>;
  skipTransition?: () => void;
}

export function CardPreview({
  card,
  title,
  media,
  className,
  children,
  showLightbox = Boolean(card && media),
  showDownload = false,
  onActivate,
}: {
  card?: Card;
  title?: string;
  media?: MediaAsset;
  className?: string;
  children?: ReactNode;
  showLightbox?: boolean;
  showDownload?: boolean;
  onActivate?: () => void;
}) {
  const transitionRef = useRef<ViewTransitionLike | null>(null);
  const [open, setOpen] = useState(false);
  const [transitionReady, setTransitionReady] = useState(false);
  const instanceId = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const safeCardId = (card?.uuid ?? "asset").replace(/[^a-zA-Z0-9_-]/g, "");
  const transitionName = `card-preview-${safeCardId}-${instanceId}`;
  const displayTitle = card?.title ?? title ?? "未命名卡片";
  const interactive = Boolean(onActivate || (showLightbox && card && media));

  async function setPreviewOpen(nextOpen: boolean) {
    if (!card || !media || !showLightbox) return;
    const transitionDocument = document as Document & {
      startViewTransition?: (callback: () => void) => ViewTransitionLike;
    };
    transitionRef.current?.skipTransition?.();
    if (!transitionDocument.startViewTransition) {
      setOpen(nextOpen);
      return;
    }
    try {
      document.documentElement.dataset.cardPreviewTransition = "active";
      flushSync(() => setTransitionReady(true));
      await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
      const transition = transitionDocument.startViewTransition(() => {
        flushSync(() => setOpen(nextOpen));
      });
      transitionRef.current = transition;
      void transition.ready.catch(() => {});
      void transition.finished.catch(() => {}).finally(() => {
        if (transitionRef.current === transition) {
          transitionRef.current = null;
          setTransitionReady(false);
          delete document.documentElement.dataset.cardPreviewTransition;
        }
      });
    } catch {
      setTransitionReady(false);
      delete document.documentElement.dataset.cardPreviewTransition;
      setOpen(nextOpen);
    }
  }

  function activate() {
    if (onActivate) return onActivate();
    void setPreviewOpen(true);
  }

  const surface = (viewTransitionName?: string) => (
    <CardTilt style={{ viewTransitionName }}>
      <CardFace title={displayTitle} media={media} />
    </CardTilt>
  );
  const preview = surface(transitionReady && !open ? transitionName : undefined);

  return (
    <>
      <div className={cn("relative", className)}>
        {interactive ? (
          <button type="button" onClick={activate} className="block w-full cursor-zoom-in rounded-card text-left focus-visible:outline-offset-4" aria-label={onActivate ? displayTitle : `放大预览 ${displayTitle} 卡面`}>
            {preview}
          </button>
        ) : preview}
        {children}
      </div>
      {card && showLightbox && media && (
        <CardLightbox
          open={open}
          onOpenChange={setPreviewOpen}
          card={card}
          media={media}
          showDownload={showDownload}
        >
          {surface(open && media ? transitionName : undefined)}
        </CardLightbox>
      )}
    </>
  );
}
