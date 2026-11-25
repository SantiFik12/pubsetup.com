import type { Extension } from "../data/types";
import { extensionPage } from "./extension-list.ts";

export type CollectionSearchParams = Record<string, string | string[] | undefined>;

export function collectionPage(extensions: Extension[], basePath: string, params: CollectionSearchParams = {}) {
  const raw = params.page;
  const requested = (Array.isArray(raw) ? raw[0] : raw) ?? "1";
  const ordered = extensions.slice().sort((a, b) =>
    ((Date.parse(b.createdAt) || 0) - (Date.parse(a.createdAt) || 0)) || (a.slug < b.slug ? -1 : a.slug > b.slug ? 1 : 0));
  const pagination = extensionPage(ordered, requested);
  const path = pagination.page > 1 ? `${basePath}?page=${pagination.page}` : basePath;
  return { ...pagination, basePath, path, index: pagination.total > 0 && requested === String(pagination.page) };
}
