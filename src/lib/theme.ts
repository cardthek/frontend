import type { ThemeId } from "@/lib/types";

export const themeOptions: Array<{ id: ThemeId; name: string; note: string }> = [
  { id: "natural", name: "自然手作", note: "柔和、圆润、纸张感" },
  { id: "editorial", name: "植物图鉴", note: "克制、紧凑、编辑感" },
  { id: "corporate-clean", name: "企业简洁", note: "清晰、可信、专业 B2B 风格" },
];

export function themeName(theme: ThemeId) {
  return themeOptions.find((option) => option.id === theme)?.name ?? theme;
}
