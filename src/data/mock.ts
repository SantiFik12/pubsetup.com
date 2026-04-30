// Deprecated: catalog data lives in Supabase.
// Use hooks from "@/data/catalog" instead.
// This file remains only as a no-op shim for any legacy imports.
import type { Partner, Category, Extension, Service, BlogPost, SeoLanding } from "./types";

export const services: Service[] = [];
export const blogPosts: BlogPost[] = [];
export const seoLandings: SeoLanding[] = [];
export const extensions: Extension[] = [];
export const partners: Partner[] = [];
export const categories: Category[] = [];
export const allTags: string[] = [];

export const findService = (_: string): Service | undefined => undefined;
export const findPost = (_: string): BlogPost | undefined => undefined;
export const findLanding = (_: string): SeoLanding | undefined => undefined;
export const findExtension = (_: string): Extension | undefined => undefined;
export const findPartner = (_: string): Partner | undefined => undefined;
export const findCategory = (_: string): Category | undefined => undefined;
