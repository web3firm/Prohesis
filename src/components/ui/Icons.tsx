import React from 'react';

export const CheckCircle = ({ className = 'w-4 h-4' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
    <path d="M12 2a10 10 0 110 20 10 10 0 010-20zm-1 14l-4-4 1.4-1.4L11 13.2l5.6-5.6L18 9l-7 7z" />
  </svg>
);

export const Clock = ({ className = 'w-4 h-4' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
    <path d="M12 1a11 11 0 100 22 11 11 0 000-22zm1 11.59V6h-2v7h6v-2h-4z" />
  </svg>
);

export const Exclamation = ({ className = 'w-4 h-4' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
    <path d="M11 9h2v5h-2V9zm0 7h2v2h-2v-2zM1 21h22L12 2 1 21z" />
  </svg>
);

export const Icons = {} as const;
export default Icons;
