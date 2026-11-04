import type { NextRequest } from "next/server";
import { proxyBackendRequest } from "@/lib/backend-proxy";

async function handler(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> },
) {
  const { path } = await context.params;
  const encodedPath = path.map(encodeURIComponent).join("/");
  return proxyBackendRequest(request, `/api/v1/${encodedPath}`);
}

export {
  handler as GET,
  handler as HEAD,
  handler as POST,
  handler as PUT,
  handler as PATCH,
  handler as DELETE,
  handler as OPTIONS,
};
