"use client";
import React from 'react';

export default function GlobalError({ error }: { error: Error }) {
  // Log server-side friendly error to console (Next will surface in logs)
  console.error('Global app error:', error);
  return (
    <div style={{ padding: 40, fontFamily: 'Inter, system-ui, sans-serif' }}>
      <h1 style={{ fontSize: 28 }}>Something went wrong</h1>
      <p style={{ color: '#444' }}>We encountered an unexpected error. Our team has been notified.</p>
      <pre style={{ background: '#111', color: '#fff', padding: 12, borderRadius: 6, overflow: 'auto' }}>{String(error?.message)}</pre>
      <p>If this persists, try refreshing or check back later.</p>
    </div>
  );
}
