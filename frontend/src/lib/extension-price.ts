import type { Extension } from "../data/types.ts";

type ExtensionPrice = Pick<Extension, "priceType" | "priceFrom">;

export function isFreeExtension(extension: ExtensionPrice): boolean {
  return extension.priceType === "free" || extension.priceFrom === 0;
}

export function formatExtensionPrice(extension: ExtensionPrice): string {
  return isFreeExtension(extension) ? "FREE" : `from $${extension.priceFrom}`;
}
