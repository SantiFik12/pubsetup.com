import { mapCatalog } from "@/data/mappers";
import { withExtensionEditorial } from "./extension-editorial";
import { cache } from "react";
import "server-only";
export const getCatalog = cache(async () => {
 const response = await fetch(`${process.env.API_INTERNAL_URL ?? "http://gateway:8082"}/api/catalog`, {cache:"no-store", signal:AbortSignal.timeout(15000)});
 if (!response.ok) throw new Error(`Catalog API returned ${response.status}`);
 const catalog = mapCatalog(await response.json());
 return { ...catalog, extensions: catalog.extensions.map(withExtensionEditorial) };
});
