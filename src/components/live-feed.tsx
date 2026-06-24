"use client";

import type { FeedItem } from "@/lib/types";

interface Props {
  feed: FeedItem[];
}

export default function LiveFeed({ feed }: Props) {
  const tickerItems = [...feed, ...feed];

  return (
    <div className="sticky top-0 z-20 border-y border-border/60 bg-card/95 shadow-sm backdrop-blur-xl overflow-hidden">
      <div className="flex w-max animate-live-ticker gap-8 py-2.5 will-change-transform">
        {tickerItems.map((item, i) => (
          <div
            key={`${item.id}-${i}`}
            className="flex items-center gap-3 px-3 text-[13px] whitespace-nowrap"
          >
            <span className="text-sm flex-shrink-0">{item.icon}</span>
            <span className="font-medium">{item.text}</span>
            <span className="text-muted-foreground tabular-nums">{item.timestamp}</span>
            <span
              className="ml-4 h-1.5 w-1.5 rounded-full bg-primary/50"
              aria-hidden="true"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
