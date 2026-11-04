const configuredApiBase = (
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "/api/v1"
).replace(/\/$/, "");

function isAbsoluteUrl(value: string) {
  return /^https?:\/\//i.test(value);
}

export const useBackendProxy =
  process.env.NEXT_PUBLIC_USE_BACKEND_PROXY !== "false";

export const API_BASE = useBackendProxy
  ? configuredApiBase.startsWith("/")
    ? configuredApiBase
    : "/api/v1"
  : configuredApiBase;

export const backendConfigError =
  !useBackendProxy && !isAbsoluteUrl(API_BASE)
    ? "直连模式需要将 NEXT_PUBLIC_API_BASE_URL 配置为完整后端地址，例如 https://card.yurik.cafe/api/v1"
    : null;

export function resolveBackendUrl(path?: string) {
  if (!path) return undefined;
  if (isAbsoluteUrl(path)) return path;
  if (useBackendProxy) return path.startsWith("/") ? path : `/${path}`;
  if (!isAbsoluteUrl(API_BASE)) return path;
  return new URL(path, `${new URL(API_BASE).origin}/`).toString();
}
