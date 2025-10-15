import { NextResponse } from 'next/server';

export function jsonError(message: string, status = 500, details?: any) {
  const payload: any = { error: String(message) };
  if (details) payload.details = details;
  return NextResponse.json(payload, { status });
}
