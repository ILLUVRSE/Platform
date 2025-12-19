import NextAuth from "next-auth";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { authConfig } from "./src/news/auth.config";

const auth = NextAuth(authConfig);

const INTERNAL_RATE_LIMIT_MAX = Number(process.env.INTERNAL_RATE_LIMIT_MAX || 60);
const INTERNAL_RATE_LIMIT_WINDOW_MS = Number(process.env.INTERNAL_RATE_LIMIT_WINDOW_MS || 60_000);

type RateLimitBucket = { count: number; reset: number };
const rateLimitBuckets = new Map<string, RateLimitBucket>();

function extractToken(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader?.toLowerCase().startsWith("bearer ")) {
    return authHeader.slice(7);
  }
  return request.headers.get("x-api-token") ?? undefined;
}

function getClientKey(request: NextRequest, token?: string) {
  if (token) return token;
  const forwarded = request.headers.get("x-forwarded-for");
  return request.ip || forwarded?.split(",")[0]?.trim() || "unknown";
}

function checkRateLimit(key: string) {
  const now = Date.now();
  const existing = rateLimitBuckets.get(key);
  if (!existing || existing.reset <= now) {
    rateLimitBuckets.set(key, { count: 1, reset: now + INTERNAL_RATE_LIMIT_WINDOW_MS });
    return null;
  }

  existing.count += 1;
  if (existing.count > INTERNAL_RATE_LIMIT_MAX) {
    return Math.max(1, Math.ceil((existing.reset - now) / 1000));
  }
  return null;
}

export default function middleware(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith("/news/api/internal")) {
    const configuredToken = process.env.INTERNAL_API_TOKEN;
    const incomingToken = extractToken(request);

    if (!configuredToken) {
      return NextResponse.json({ error: "Internal API token not configured" }, { status: 401 });
    }

    if (!incomingToken || incomingToken !== configuredToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const retryAfter = checkRateLimit(getClientKey(request, incomingToken));
    if (retryAfter !== null) {
      return NextResponse.json(
        { error: "Rate limit exceeded" },
        { status: 429, headers: { "Retry-After": String(retryAfter) } }
      );
    }

    return NextResponse.next();
  }

  if (request.nextUrl.pathname.startsWith("/news/admin")) {
    return auth.auth(request);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/news/api/internal/:path*", "/news/admin/:path*"]
};
