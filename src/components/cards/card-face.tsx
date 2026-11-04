"use client";

import { useState } from "react";
import type { MediaAsset } from "@/lib/types";
import { cn } from "@/lib/utils";

interface CardFaceProps {
  title: string;
  media?: MediaAsset;
  className?: string;
}

export function CardFace({
  title,
  media,
  className,
}: CardFaceProps) {
  const tone = media?.tone ?? "sand";
  const [detected, setDetected] = useState<{
    source: string;
    portrait: boolean;
  } | null>(null);
  const dimensionsArePortrait = Boolean(
    media?.width &&
      media?.height &&
      media.height > media.width,
  );
  const imageIsPortrait =
    dimensionsArePortrait ||
    Boolean(
      media?.preview &&
        detected?.source === media.preview &&
        detected.portrait,
    );

  return (
    <div
      className={cn(
        "card-face-container",
        imageIsPortrait && "card-face-container--portrait",
        className,
      )}
      data-card-orientation={imageIsPortrait ? "portrait" : "landscape"}
      role="img"
      aria-label={`${title}卡面`}
    >
      <div className={cn("card-face", `card-face--${tone}`)} aria-hidden="true">
        {media?.preview && (
          // User-uploaded card images may come from a separately configured
          // backend origin, so native img is intentionally used here.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={media.preview}
            alt=""
            loading="lazy"
            onLoad={(event) => {
              const image = event.currentTarget;
              setDetected({
                source: media.preview!,
                portrait: image.naturalHeight > image.naturalWidth,
              });
            }}
            className="absolute inset-0 z-0 h-full w-full object-cover"
          />
        )}
      </div>
    </div>
  );
}
