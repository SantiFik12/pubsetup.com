"use client";

import Image from "next/image";
import { useState } from "react";
import type { Partner } from "@/data/types";
import { cn } from "@/lib/utils";

export function VendorLogo({ partner, className = "" }: { partner?: Partner; className?: string }) {
  const [failed, setFailed] = useState<string[]>([]);
  const sources: string[] = [];
  if (partner?.logoUrl) sources.push(partner.logoUrl);
  if (partner?.website) {
    try {
      const website = new URL(partner.website);
      if (["https:", "http:"].includes(website.protocol)) sources.push(new URL("/favicon.ico", website).href);
    } catch { /* Keep initials when the vendor website is invalid. */ }
  }
  const source = sources.find(url => !failed.includes(url));

  return (
    <div aria-hidden="true" className={cn("flex shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-brand-soft font-bold text-primary", className)}>
      {source ? <Image src={source} alt="" width={64} height={64} unoptimized referrerPolicy="no-referrer" className="h-full w-full object-contain p-2" onError={() => setFailed(previous => [...previous, source])} /> : (partner?.logoLetter || partner?.name.slice(0, 2))}
    </div>
  );
}
