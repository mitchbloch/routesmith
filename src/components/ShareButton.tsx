'use client';

import { useState } from 'react';
import { compressToEncodedURIComponent } from 'lz-string';
import type { GeneratedRoute } from '@/lib/types';

interface ShareButtonProps {
  route: GeneratedRoute;
}

export default function ShareButton({ route }: ShareButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    const payload = JSON.stringify({
      id: route.id,
      name: route.name,
      geometry: route.geometry,
      distance: route.distance,
      duration: route.duration,
      elevationGain: route.elevationGain,
      elevationLoss: route.elevationLoss,
      tags: route.tags,
      color: route.color,
    });

    const compressed = compressToEncodedURIComponent(payload);
    const url = `${window.location.origin}/route/${route.id}?data=${compressed}`;

    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const input = document.createElement('input');
      input.value = url;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <button
      onClick={handleShare}
      className="flex items-center gap-2 px-4 py-2 border border-hairline text-[13px] font-medium text-ink-faded hover:border-ink hover:text-ink transition-colors"
    >
      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
      </svg>
      {copied ? 'Copied' : 'Share'}
    </button>
  );
}
