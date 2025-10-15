import React from 'react';

export default function NotFound() {
  return (
    <html>
      <body>
        <div style={{padding:40,fontFamily:'Inter, system-ui, sans-serif'}}>
          <h1 style={{fontSize:28}}>404 — Page not found</h1>
          <p style={{color:'#444'}}>We couldn't find what you were looking for.</p>
          <a href="/">Return home</a>
        </div>
      </body>
    </html>
  );
}
