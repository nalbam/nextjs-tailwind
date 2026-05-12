/**
 * CSP violation receiver.
 *
 * Browsers POST violation reports here when `Content-Security-Policy` (or
 * `Content-Security-Policy-Report-Only`) is configured with `report-uri` and
 * `report-to`. Reports arrive as JSON with one of two shapes:
 *
 *  - Level 2 (`report-uri`):  { "csp-report": { ... } }
 *  - Reporting API (`report-to`): [{ "type": "csp-violation", "body": { ... } }]
 *
 * We only care about logging — there's no body validation beyond "is JSON" and
 * we cap the payload size to avoid log spam from misbehaving clients.
 */

import { NextResponse, type NextRequest } from "next/server";

import { logger } from "@/lib/logger";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BODY_BYTES = 16_384;

export async function POST(request: NextRequest) {
  const contentLength = Number(request.headers.get("content-length") ?? "0");
  if (contentLength > MAX_BODY_BYTES) {
    return new NextResponse(null, { status: 413 });
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return new NextResponse(null, { status: 400 });
  }

  logger.warn("csp.violation", {
    userAgent: request.headers.get("user-agent") ?? undefined,
    report: payload,
  });

  return new NextResponse(null, { status: 204 });
}
