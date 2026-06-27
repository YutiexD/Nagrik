"use client";

import type { FeedItem } from "@/lib/types";
import { useTranslation } from "@/components/language-provider";

interface Props {
  feed: FeedItem[];
}

function formatFeedItemText(item: FeedItem, t: (key: string) => string, lang: string | null) {
  if (!item.status || !item.title || !item.address) {
    return t(item.text) || item.text;
  }
  
  const title = t(item.title) || item.title;
  const address = t(item.address) || item.address;
  
  if (lang === "hi") {
    if (item.status === "resolved") {
      return `${title} का समाधान हुआ (${address})`;
    } else if (item.status === "in_progress") {
      return `${title} पर कार्य शुरू हुआ (${address})`;
    } else if (item.status === "verified") {
      return `${item.verification_count} नागरिकों द्वारा सत्यापित: ${title}`;
    } else {
      return `नई रिपोर्ट: ${title} (${address})`;
    }
  }
  
  // Default / English
  if (item.status === "resolved") {
    return `${title} resolved at ${address}`;
  } else if (item.status === "in_progress") {
    return `Work started: ${title} at ${address}`;
  } else if (item.status === "verified") {
    return `${item.verification_count} citizens verified: ${title}`;
  } else {
    return `New report: ${title} at ${address}`;
  }
}

export default function LiveFeed({ feed }: Props) {
  const { t, language } = useTranslation();
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
            <span className="font-medium">{formatFeedItemText(item, t, language)}</span>
            <span className="text-muted-foreground tabular-nums">{t(item.timestamp) || item.timestamp}</span>
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
