"use client";
import { usePathname,useRouter,useSearchParams } from "next/navigation";
function useSearch<T extends object>(defaults: T): [T, (options: {search: T | ((previous: T) => T)}) => void] {
 const params = useSearchParams();
 const router = useRouter();
 const pathname = usePathname();
 const search = Object.fromEntries(Object.entries(defaults).map(([key, value]) => [key, typeof value === "boolean" ? params.get(key) === "true" : params.get(key) ?? value])) as T;
 return [search, ({search: next}) => {
   const values = typeof next === "function" ? next(search) : next;
   const query = new URLSearchParams();
   Object.entries(values).forEach(([key,value]) => { if (value !== undefined && value !== false && value !== "") query.set(key,String(value)); });
   router.replace(`${pathname}${query.size ? `?${query}` : ""}`, {scroll: false});
 }];
}
export function useCatalogSearch() { return useSearch({q:"", cat:"", partner:"", tag:"", price:"all", hyva:false, pwa:false, sort:"popular"}); }
export function useCheckoutSearch() { return useSearch<{service:string; extension?:string}>({service:"",extension:""}); }
