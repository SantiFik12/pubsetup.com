"use client";
import NextLink from "next/link";
import { usePathname } from "next/navigation";
import type { ComponentProps } from "react";
type Props = Omit<ComponentProps<typeof NextLink>, "href"> & {
 to: string; params?: Record<string, string>; search?: Record<string, string | number | boolean | undefined>;
 activeProps?: { className?: string };
};
export function Link({to, params, search, activeProps, className, ...props}: Props) {
 const pathname = usePathname();
 const path = to.replace(/\$(\w+)/g, (_, key: string) => encodeURIComponent(params?.[key] ?? ""));
 const query = new URLSearchParams();
 Object.entries(search ?? {}).forEach(([key,value]) => { if (value !== undefined && value !== "" && value !== false) query.set(key,String(value)); });
 return <NextLink {...props} href={path + (query.size ? `?${query}` : "")} className={pathname === path && activeProps?.className ? activeProps.className : className} />;
}
