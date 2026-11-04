import Image from "next/image";
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
        {media?.preview && <Image src={media.preview} alt="" fill unoptimized className="z-0 object-cover" />}
      </div>
    </div>
  );
}
