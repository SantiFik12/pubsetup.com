"use client";
import { usePathname,useRouter,useSearchParams } from "next/navigation";
import { useMemo,useSyncExternalStore } from "react";
import { catalogDefaults } from "./extension-list";
const catalogSearchEvent = "pubsetup:catalog-search";
function subscribeLocationSearch(listener: () => void) {
 window.addEventListener("popstate", listener);
 window.addEventListener(catalogSearchEvent, listener);
 return () => {
   window.removeEventListener("popstate", listener);
   window.removeEventListener(catalogSearchEvent, listener);
 };
}
const readLocationSearch = () => window.location.search.slice(1);
const noSubscription = () => () => {};
function useSearch<T extends object>(defaults: T, local = false): [T, (options: {search: T | ((previous: T) => T)}) => void] {
 const params = useSearchParams();
 const router = useRouter();
 const pathname = usePathname();
 // Controlled inputs need a synchronous snapshot; Next's search params update
 // in a transition and can otherwise overwrite characters during rapid typing.
 const queryString = useSyncExternalStore(local ? subscribeLocationSearch : noSubscription, local ? readLocationSearch : () => params.toString(), () => params.toString());
 const search = useMemo(() => {
   const current = new URLSearchParams(queryString);
   return Object.fromEntries(Object.entries(defaults).map(([key, value]) => [key, typeof value === "boolean" ? current.get(key) === "true" : current.get(key) ?? value])) as T;
 }, [defaults, queryString]);
 return [search, ({search: next}) => {
   const values = typeof next === "function" ? next(search) : next;
   const query = new URLSearchParams();
   Object.entries(values).forEach(([key,value]) => { if (value !== undefined && value !== false && value !== "") query.set(key,String(value)); });
   const href = `${pathname}${query.size ? `?${query}` : ""}`;
   // The catalog is already in memory. Native history keeps Next's search
   // params in sync without requesting a new server payload for every key.
   if (local) {
     window.history.replaceState(null, "", href);
     window.dispatchEvent(new Event(catalogSearchEvent));
   }
   else router.replace(href, {scroll: false});
 }];
}
export function useCatalogSearch() { return useSearch(catalogDefaults, true); }
export function useCheckoutSearch() { return useSearch<{service:string; extension?:string}>({service:"",extension:""}); }
