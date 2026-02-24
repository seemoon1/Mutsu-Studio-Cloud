import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({
    hasOpenRouter: true,
    hasGoogle: true,
    hasTavily: true,
    hasSdUrl: true,
    hasTtsUrl: true,
    hasMusic: true,
    mode: 'cloud'
  });
}