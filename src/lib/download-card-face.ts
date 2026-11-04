import type { Card, MediaAsset } from "@/lib/types";
import { slugify } from "@/lib/utils";

const extensions: Record<string, string> = {
  "image/avif": "avif",
  "image/gif": "gif",
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/svg+xml": "svg",
  "image/webp": "webp",
};

function saveBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.style.display = "none";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1_000);
}

export async function downloadCardFace(card: Card, media?: MediaAsset) {
  const baseName = slugify(card.title) || "card-face";
  if (!media?.preview) throw new Error("该卡片没有可下载的卡面图片");

  const response = await fetch(media.preview);
  if (!response.ok) throw new Error("无法读取卡面图片");
  const blob = await response.blob();
  const extension = extensions[media.mimeType] ?? extensions[blob.type] ?? "png";
  saveBlob(blob, `${baseName}.${extension}`);
}
