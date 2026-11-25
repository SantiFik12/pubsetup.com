"use client";
import { usePathname,useRouter,useSearchParams } from "next/navigation";
import { useEffect, useMemo, useOptimistic, useRef, useTransition } from "react";
import { catalogDefaults } from "./extension-list";
function useSearch<T extends object>(defaults: T): [T, (options: {search: T | ((previous: T) => T)}) => void] {
 const params = useSearchParams();
 const router = useRouter();
 const pathname = usePathname();
 const queryString = params.toString();
 const search = useMemo(() => {
   const current = new URLSearchParams(queryString);
   return Object.fromEntries(Object.entries(defaults).map(([key, value]) => [key, typeof value === "boolean" ? current.get(key) === "true" : current.get(key) ?? value])) as T;
 }, [defaults, queryString]);
 return [search, ({search: next}) => {
   const values = typeof next === "function" ? next(search) : next;
   const query = new URLSearchParams();
   Object.entries(values).forEach(([key,value]) => { if (value !== undefined && value !== false && value !== "") query.set(key,String(value)); });
   const href = `${pathname}${query.size ? `?${query}` : ""}`;
   router.replace(href, {scroll: false});
 }];
}
export function useCatalogSearch() {
 const [search, navigate] = useSearch(catalogDefaults);
 const [pending, startTransition] = useTransition();
 const [optimistic, setOptimistic] = useOptimistic(search);
 const revision = useRef(0);
 const lastRequested = useRef(search);
 useEffect(() => {
   // A pagination link or browser history navigation supersedes unsent typing.
   if (JSON.stringify(search) !== JSON.stringify(lastRequested.current)) revision.current++;
 }, [search]);
 useEffect(() => () => { revision.current++; }, []);
 const update = ({ search: next }: { search: typeof search | ((previous: typeof search) => typeof search) }) => {
   const values = typeof next === "function" ? next(optimistic) : next;
   const current = ++revision.current;
   const typing = values.q !== optimistic.q;
   startTransition(async () => {
     setOptimistic(values);
     // Keep the input synchronous while sending one request after a typing burst.
     if (typing) await new Promise(resolve => setTimeout(resolve, 250));
     if (current !== revision.current) return;
     lastRequested.current = values;
     startTransition(() => navigate({ search: values }));
   });
 };
 return [optimistic, update, pending] as const;
}
export function useCheckoutSearch() { return useSearch<{service:string; extension?:string}>({service:"",extension:""}); }
