import React from 'react';

export function Avatar({ url, size = 32, className = '' }: { url?: string; size?: number, className?: string }) {
  return (
    <div className={`rounded-full overflow-hidden shrink-0 ${className}`} style={{ width: size, height: size }}>
      <img src={url || `https://api.dicebear.com/7.x/initials/svg?seed=User`} alt="avatar" className="w-full h-full object-cover" />
    </div>
  );
}
