"use client";
import React from 'react';

export default function DBGuard({ error, onRetry }: { error?: any; onRetry?: () => void }) {
  const [hidden, setHidden] = React.useState(false);
  if (!error || hidden) return null;
  return (
    <div style={{background:'#fff3cd',border:'1px solid #ffeeba',padding:12,borderRadius:8,marginBottom:12}}>
      <strong style={{display:'block',marginBottom:6}}>Connection or data error</strong>
      <div style={{color:'#856404'}}>{String(error?.message ?? error)}</div>
      <div style={{marginTop:8}}>
        {onRetry ? (
          <button onClick={onRetry} style={{marginRight:8}}>Retry</button>
        ) : null}
        <button onClick={() => setHidden(true)}>Dismiss</button>
      </div>
    </div>
  );
}
