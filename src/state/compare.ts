import { useEffect, useState } from "react";

const KEY = "implementit:compare";

let listeners: Array<(v: string[]) => void> = [];
let state: string[] = [];

if (typeof window !== "undefined") {
  try {
    state = JSON.parse(localStorage.getItem(KEY) ?? "[]");
  } catch {
    state = [];
  }
}

function setState(next: string[]) {
  state = next;
  if (typeof window !== "undefined") localStorage.setItem(KEY, JSON.stringify(next));
  listeners.forEach((l) => l(next));
}

export function useCompare() {
  const [items, setItems] = useState<string[]>(state);

  useEffect(() => {
    const fn = (v: string[]) => setItems(v);
    listeners.push(fn);
    return () => {
      listeners = listeners.filter((l) => l !== fn);
    };
  }, []);

  const toggle = (slug: string) => {
    if (state.includes(slug)) setState(state.filter((s) => s !== slug));
    else if (state.length < 4) setState([...state, slug]);
  };
  const clear = () => setState([]);

  return { items, toggle, clear };
}
