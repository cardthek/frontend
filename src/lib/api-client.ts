import { API_BASE, backendConfigError } from "@/lib/backend-config";

let accessToken: string | null = null;
let refreshPromise: Promise<AuthSession | null> | null = null;

export interface ApiEnvelope<T> {
  data: T;
  meta?: Record<string, unknown>;
}

export interface AuthSession {
  accessToken: string;
  expiresIn: number;
  user: unknown;
}

interface ApiErrorBody {
  error?: {
    code?: string;
    message?: string;
    details?: unknown;
  };
}

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details?: unknown;

  constructor(
    status: number,
    code: string,
    message: string,
    details?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export function setAccessToken(token: string | null) {
  accessToken = token;
}

export function getAccessToken() {
  return accessToken;
}

interface RequestOptions extends Omit<RequestInit, "body"> {
  body?: unknown;
  auth?: boolean;
  retryAfterRefresh?: boolean;
}

async function parseResponse<T>(response: Response): Promise<ApiEnvelope<T>> {
  if (response.status === 204) return { data: undefined as T };
  const contentType = response.headers.get("content-type") ?? "";
  const payload = contentType.includes("application/json")
    ? await response.json()
    : null;
  if (!response.ok) {
    const body = payload as ApiErrorBody | null;
    throw new ApiError(
      response.status,
      body?.error?.code ?? `HTTP_${response.status}`,
      body?.error?.message ?? `请求失败（${response.status}）`,
      body?.error?.details,
    );
  }
  return payload as ApiEnvelope<T>;
}

export async function apiRequest<T>(
  path: string,
  options: RequestOptions = {},
): Promise<ApiEnvelope<T>> {
  if (backendConfigError) {
    throw new ApiError(500, "BACKEND_CONFIG_ERROR", backendConfigError);
  }
  const {
    body,
    auth = true,
    retryAfterRefresh = true,
    headers,
    ...requestInit
  } = options;
  const isFormData = body instanceof FormData;
  const response = await fetch(`${API_BASE}${path}`, {
    ...requestInit,
    credentials: "include",
    headers: {
      Accept: "application/json",
      ...(body !== undefined && !isFormData
        ? { "Content-Type": "application/json" }
        : {}),
      ...(auth && accessToken
        ? { Authorization: `Bearer ${accessToken}` }
        : {}),
      ...headers,
    },
    body:
      body === undefined
        ? undefined
        : isFormData
          ? body
          : JSON.stringify(body),
  });

  if (
    response.status === 401 &&
    auth &&
    retryAfterRefresh &&
    !path.startsWith("/auth/refresh")
  ) {
    const session = await refreshAccessToken();
    if (session) {
      return apiRequest<T>(path, {
        ...options,
        retryAfterRefresh: false,
      });
    }
  }

  return parseResponse<T>(response);
}

export async function refreshAccessToken() {
  if (refreshPromise) return refreshPromise;
  if (backendConfigError) return null;
  refreshPromise = (async () => {
    try {
      const response = await fetch(`${API_BASE}/auth/refresh`, {
        method: "POST",
        credentials: "include",
        headers: { Accept: "application/json" },
      });
      if (!response.ok) {
        accessToken = null;
        return null;
      }
      const envelope = (await response.json()) as ApiEnvelope<AuthSession>;
      accessToken = envelope.data.accessToken;
      return envelope.data;
    } catch {
      accessToken = null;
      return null;
    } finally {
      refreshPromise = null;
    }
  })();
  return refreshPromise;
}

export function toApiError(error: unknown) {
  if (error instanceof ApiError) return error;
  if (error instanceof Error) {
    return new ApiError(0, "NETWORK_ERROR", error.message);
  }
  return new ApiError(0, "UNKNOWN_ERROR", "发生未知错误");
}
