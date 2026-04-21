export interface PostSEO {
  title?: string;
  description?: string;
  keywords?: string[];
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  ogImageWidth?: number;
  ogImageHeight?: number;
  twitterCard?: "summary_large_image" | "summary" | "player" | "app";
  twitterTitle?: string;
  twitterDescription?: string;
  twitterImage?: string;
  canonical?: string;
  noindex?: boolean;
}

export interface Post {
  id: string;
  /** Date in YYYY.MM.DD format (e.g. "2026.03.11"). Normalized by normalizeDate() during post loading. */
  date: string;
  title: string;
  category: string[];
  excerpt: string;
  image?: string;
  fontFamily?: string;
  fontUrl?: string;
  visibility?: "public" | "private";
  seo?: PostSEO;
}

export type PostSearchItem = Pick<Post, "id" | "title" | "category" | "excerpt"> & { _rankingScore?: number };
export type PostSearchSyncItem = PostSearchItem & { date: string; content: string };
export type PostListItem = Pick<Post, "id" | "date" | "title" | "category" | "excerpt" | "image">;

export const POSTS_PER_PAGE = 10;

export interface PostListPage {
  items: PostListItem[];
  totalCount: number;
}

export interface PostActivityItem {
  date: string;
  count: number;
}
