import type { NextRequest } from "next/server";

const FORWARDED_REQUEST_HEADERS = [
  "accept",
  "accept-language",
  "authorization",
  "content-type",
  "cookie",
  "user-agent",
  "x-request-id",
  "x-forwarded-for",
];

const EXCLUDED_RESPONSE_HEADERS = new Set([
  "connection",
  "content-encoding",
  "content-length",
  "keep-alive",
  "proxy-authenticate",
  "proxy-authorization",
  "set-cookie",
  "te",
  "trailer",
  "transfer-encoding",
  "upgrade",
]);

export async function proxyBackendRequest(
  request: NextRequest,
  backendPath: string,
) {
  const backendOrigin = (
    process.env.BACKEND_ORIGIN ??
    (process.env.NODE_ENV === "production" ? "" : "http://localhost:4000")
  ).replace(/\/$/, "");
  if (!backendOrigin) {
    return Response.json(
      {
        error: {
          code: "BACKEND_NOT_CONFIGURED",
          message: "BACKEND_ORIGIN 环境变量未配置",
        },
      },
      { status: 503 },
    );
  }

  const targetUrl = `${backendOrigin}${backendPath}${request.nextUrl.search}`;
  const headers = new Headers();
  for (const name of FORWARDED_REQUEST_HEADERS) {
    const value = request.headers.get(name);
    if (value) headers.set(name, value);
  }

  const hasBody = !["GET", "HEAD"].includes(request.method);
  let upstream: Response;
  try {
    upstream = await fetch(targetUrl, {
      method: request.method,
      headers,
      body: hasBody ? await request.arrayBuffer() : undefined,
      redirect: "manual",
      cache: "no-store",
    });
  } catch {
    return Response.json(
      {
        error: {
          code: "BACKEND_UNAVAILABLE",
          message: "无法连接后端服务",
        },
      },
      { status: 502 },
    );
  }

  const responseHeaders = new Headers();
  upstream.headers.forEach((value, name) => {
    if (!EXCLUDED_RESPONSE_HEADERS.has(name.toLowerCase())) {
      responseHeaders.set(name, value);
    }
  });
  for (const cookie of upstream.headers.getSetCookie()) {
    responseHeaders.append("Set-Cookie", cookie);
  }

  return new Response(upstream.body, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers: responseHeaders,
  });
}
