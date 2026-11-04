import type { NextRequest } from "next/server";
import { proxyBackendRequest } from "@/lib/backend-proxy";

async function handler(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> },
) {
  const { path } = await context.params;
  const encodedPath = path.map(encodeURIComponent).join("/");
  return proxyBackendRequest(request, `/uploads/${encodedPath}`);
}

export {
  handler as GET,
  handler as HEAD,
};
