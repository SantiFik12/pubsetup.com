"use client";

import Image from "next/image";
import { useState } from "react";
import type { Partner } from "@/data/types";
import { cn } from "@/lib/utils";

const vendorMarks: Record<string, string> = {
  "amasty.com": "/assets/vendors/amasty-mark.svg",
  "magedelight.com": "/assets/vendors/magedelight-mark.svg",
};

export function VendorLogo({ partner, className = "" }: { partner?: Partner; className?: string }) {
  const [failed, setFailed] = useState<string[]>([]);
  const [wideSource, setWideSource] = useState("");
  const sources: string[] = [];
  let mark: string | undefined;
  try {
    const host = new URL(partner?.website || "").hostname.toLowerCase().replace(/^www\./, "");
    mark = vendorMarks[host];
  } catch { /* Legacy vendor records may not have a website. */ }
  if (!mark && !partner?.website) {
    mark = vendorMarks[`${partner?.name.toLowerCase().trim()}.com`];
  }
  if (mark) sources.push(mark);
  if (partner?.logoUrl) sources.push(partner.logoUrl);
  if (partner?.website) {
    try {
      const website = new URL(partner.website);
      if (["https:", "http:"].includes(website.protocol)) sources.push(new URL("/favicon.ico", website).href);
    } catch { /* Keep initials when the vendor website is invalid. */ }
  }
  const source = sources.find(url => !failed.includes(url));

  return (
    <div aria-hidden="true" className={cn("flex shrink-0 items-center justify-center overflow-hidden bg-brand-soft font-bold text-primary", className, "rounded-full")}>
      {source ? <Image src={source} alt="" width={64} height={64} unoptimized referrerPolicy="no-referrer" className={cn("h-full w-full", source === mark ? "object-contain p-1.5" : wideSource === source ? "object-cover object-left" : "object-contain p-2")} onLoad={event => { if (event.currentTarget.naturalWidth > event.currentTarget.naturalHeight * 1.8) setWideSource(source); }} onError={() => setFailed(previous => [...previous, source])} /> : (partner?.logoLetter || partner?.name.slice(0, 2))}
    </div>
  );
}
