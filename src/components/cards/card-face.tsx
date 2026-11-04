import { cn } from "@/lib/utils";
import type { MediaAsset } from "@/lib/types";

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

  return (
    <div
      className={cn("card-face-container", className)}
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
            className="absolute inset-0 z-0 h-full w-full object-cover"
          />
        )}
      </div>
    </div>
  );
}
