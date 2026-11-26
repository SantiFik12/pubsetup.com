"use client";
import type { ComponentProps } from "react";
import { moduleHref, recordModuleClick } from "@/lib/module-links";

export function ModuleLink({ slug, onClick, onAuxClick, ...props }: Omit<ComponentProps<"a">, "href"> & { slug: string }) {
  return <a {...props} href={moduleHref(slug)} onClick={event => {
    onClick?.(event);
    if (!event.defaultPrevented) void recordModuleClick(slug);
  }} onAuxClick={event => {
    onAuxClick?.(event);
    if (event.button === 1 && !event.defaultPrevented) void recordModuleClick(slug);
  }} />;
}
