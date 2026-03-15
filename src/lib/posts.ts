import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { Post, PostActivityItem, PostListItem, PostListPage, POSTS_PER_PAGE, PostSEO, PostSearchItem, PostSearchSyncItem } from "./data";
import { getPostsCacheTtlMs } from "./config";
import { resolvePostImageUrl } from "./post-images";

export interface PostDetail extends Post {
  content: string;
}

const contentDir = process.env.CONTENT_DIR || "content";
const postsDirectory = path.join(process.cwd(), contentDir, "posts");

const EXCERPT_MAX_LENGTH = 200;

function generateExcerpt(markdownContent: string): string {
  const plain = markdownContent
    .replace(/^---[\s\S]*?---\n*/m, "")
    .replace(/```[\s\S]*?```/g, "")
    .replace(/!\[.*?\]\(.*?\)/g, "")
    .replace(/\[([^\]]*)\]\(.*?\)/g, "$1")
    .replace(/#{1,6}\s+/g, "")
    .replace(/[*_~`>|]/g, "")
    .replace(/\n+/g, " ")
    .trim();

  if (plain.length <= EXCERPT_MAX_LENGTH) {
    return plain;
  }

  const truncated = plain.slice(0, EXCERPT_MAX_LENGTH);
  const lastSpace = truncated.lastIndexOf(" ");
  return (lastSpace > 0 ? truncated.slice(0, lastSpace) : truncated) + "…";
}

let postsCache: { data: Post[]; expiresAt: number } | null = null;

function normalizePostId(value: string): string {
  return value
    .replace(/\\/g, "/")
    .normalize("NFC")
    .replace(/\/index$/, "");
}

function resolvePostId(externalId: string): string {
  return normalizePostId(decodeURIComponent(externalId));
}

function getMarkdownFilePaths(directory: string): string[] {
  if (!fs.existsSync(directory)) {
    return [];
  }

  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      return getMarkdownFilePaths(entryPath);
    }

    return entry.isFile() && entry.name.endsWith(".md") ? [entryPath] : [];
  });
}

function getPostIdFromPath(filePath: string): string {
  const relativePath = path.relative(postsDirectory, filePath);
  const normalizedPath = relativePath.replace(/\.md$/, "").split(path.sep).join("/");
  return normalizePostId(normalizedPath);
}

export function isPrivatePost(frontmatter: Record<string, unknown>): boolean {
  if (frontmatter.visibility === "private") {
    return true;
  }

  if (frontmatter.visibility === "public") {
    return false;
  }

  if (frontmatter.public === false) {
    return true;
  }

  return false;
}

export function parseSEO(data: Record<string, unknown>, postId?: string): PostSEO | undefined {
  const seo = data.seo as Record<string, unknown> | undefined;

  // Collect all SEO-related fields
  const result: PostSEO = {};
  let hasAny = false;

  // From nested seo object
  if (seo && typeof seo === "object") {
    if (typeof seo.title === "string") {
      result.title = seo.title;
      hasAny = true;
    }
    if (typeof seo.description === "string") {
      result.description = seo.description;
      hasAny = true;
    }
    if (Array.isArray(seo.keywords)) {
      result.keywords = seo.keywords.filter((k): k is string => typeof k === "string");
      hasAny = true;
    }
    if (typeof seo.ogTitle === "string") {
      result.ogTitle = seo.ogTitle;
      hasAny = true;
    }
    if (typeof seo.ogDescription === "string") {
      result.ogDescription = seo.ogDescription;
      hasAny = true;
    }
    if (typeof seo.ogImage === "string") {
      result.ogImage = postId ? resolvePostImageUrl(postId, seo.ogImage) : seo.ogImage;
      hasAny = true;
    }
    if (typeof seo.ogImageWidth === "number") {
      result.ogImageWidth = seo.ogImageWidth;
      hasAny = true;
    }
    if (typeof seo.ogImageHeight === "number") {
      result.ogImageHeight = seo.ogImageHeight;
      hasAny = true;
    }
    if (typeof seo.twitterCard === "string") {
      result.twitterCard = seo.twitterCard as PostSEO["twitterCard"];
      hasAny = true;
    }
    if (typeof seo.twitterTitle === "string") {
      result.twitterTitle = seo.twitterTitle;
      hasAny = true;
    }
    if (typeof seo.twitterDescription === "string") {
      result.twitterDescription = seo.twitterDescription;
      hasAny = true;
    }
    if (typeof seo.twitterImage === "string") {
      result.twitterImage = postId ? resolvePostImageUrl(postId, seo.twitterImage) : seo.twitterImage;
      hasAny = true;
    }
    if (typeof seo.canonical === "string") {
      result.canonical = seo.canonical;
      hasAny = true;
    }
    if (typeof seo.noindex === "boolean") {
      result.noindex = seo.noindex;
      hasAny = true;
    }
  }

  // Auto-fallback: if post has a thumbnail image, use it as OG/Twitter image unless explicitly set
  const resolvedImage = typeof data.image === "string" && data.image
    ? (postId ? resolvePostImageUrl(postId, data.image) : data.image)
    : null;

  if (resolvedImage) {
    if (!result.ogImage) {
      result.ogImage = resolvedImage;
      hasAny = true;
    }
    if (!result.twitterImage) {
      result.twitterImage = resolvedImage;
      hasAny = true;
    }
  }

  return hasAny ? result : undefined;
}

export function getAllPosts(): Post[] {
  const ttlMs = getPostsCacheTtlMs();

  if (ttlMs > 0 && postsCache && postsCache.expiresAt > Date.now()) {
    return postsCache.data;
  }

  const markdownFiles = getMarkdownFilePaths(postsDirectory);

  const allPostsData = markdownFiles
    .map((fullPath) => {
      const id = getPostIdFromPath(fullPath);
      const fileContents = fs.readFileSync(fullPath, "utf8");

      const matterResult = matter(fileContents);

      if (isPrivatePost(matterResult.data)) {
        return null;
      }

      if (!matterResult.data.date || !matterResult.data.title) {
        return null;
      }

      let categories: string[] = [];
      if (Array.isArray(matterResult.data.category)) {
        categories = matterResult.data.category;
      } else if (typeof matterResult.data.category === "string") {
        categories = matterResult.data.category.split(",").map((c) => c.trim());
      }

      const seo = parseSEO(matterResult.data, id);
      const image =
        typeof matterResult.data.image === "string" ? resolvePostImageUrl(id, matterResult.data.image) : undefined;

      const excerpt = matterResult.data.excerpt || generateExcerpt(matterResult.content);

      return {
        id,
        ...(matterResult.data as Omit<Post, "id" | "category" | "seo" | "excerpt">),
        ...(image ? { image } : {}),
        category: categories,
        excerpt,
        ...(seo ? { seo } : {}),
      } as Post;
    })
    .filter((post): post is Post => post !== null);

  const sortedPosts = allPostsData.sort((a, b) => (a.date < b.date ? 1 : -1));

  if (ttlMs > 0) {
    postsCache = {
      data: sortedPosts,
      expiresAt: Date.now() + ttlMs,
    };
  } else {
    postsCache = null;
  }

  return sortedPosts;
}

export function getPostSearchItems(): PostSearchItem[] {
  return getAllPosts().map(({ id, title, category, excerpt }) => ({
    id,
    title,
    category,
    excerpt,
  }));
}

export function getPostSearchSyncItems(): PostSearchSyncItem[] {
  const markdownFiles = getMarkdownFilePaths(postsDirectory);

  return markdownFiles
    .map((fullPath) => {
      const id = getPostIdFromPath(fullPath);
      const fileContents = fs.readFileSync(fullPath, "utf8");
      const matterResult = matter(fileContents);

      if (isPrivatePost(matterResult.data)) {
        return null;
      }

      if (!matterResult.data.date || !matterResult.data.title) {
        return null;
      }

      let categories: string[] = [];
      if (Array.isArray(matterResult.data.category)) {
        categories = matterResult.data.category;
      } else if (typeof matterResult.data.category === "string") {
        categories = matterResult.data.category.split(",").map((c) => c.trim());
      }

      return {
        id,
        title: matterResult.data.title ?? "",
        date: matterResult.data.date ?? "",
        category: categories,
        excerpt: matterResult.data.excerpt || generateExcerpt(matterResult.content),
        content: matterResult.content,
      };
    })
    .filter((item): item is PostSearchSyncItem => item !== null);
}

function toPostListItem({ id, date, title, category, excerpt, image }: Post): PostListItem {
  return {
    id,
    date,
    title,
    category,
    excerpt,
    ...(image ? { image } : {}),
  };
}

function getFilteredPosts(category?: string): Post[] {
  const normalizedCategory = category?.trim();

  if (!normalizedCategory) {
    return getAllPosts();
  }

  return getAllPosts().filter((post) => post.category.includes(normalizedCategory));
}

export function getPostCategories(): string[] {
  return Array.from(new Set(getAllPosts().flatMap((post) => post.category))).sort((left, right) =>
    left.localeCompare(right),
  );
}

export function getPostListPage({
  category,
  offset = 0,
  limit = POSTS_PER_PAGE,
}: {
  category?: string;
  offset?: number;
  limit?: number;
} = {}): PostListPage {
  const filteredPosts = getFilteredPosts(category);
  const safeOffset = Math.max(0, offset);
  const safeLimit = Math.max(1, limit);

  return {
    items: filteredPosts.slice(safeOffset, safeOffset + safeLimit).map(toPostListItem),
    totalCount: filteredPosts.length,
  };
}

export function getPostListItems(): PostListItem[] {
  return getAllPosts().map(toPostListItem);
}

export function getPostActivityItems(): PostActivityItem[] {
  const counts = new Map<string, number>();

  for (const post of getAllPosts()) {
    counts.set(post.date, (counts.get(post.date) ?? 0) + 1);
  }

  return Array.from(counts.entries()).map(([date, count]) => ({ date, count }));
}

export function getAdjacentPosts(id: string): {
  prev: Post | null;
  next: Post | null;
} {
  const normalizedId = resolvePostId(id);
  const posts = getAllPosts();
  const idx = posts.findIndex((p) => p.id === normalizedId);
  if (idx === -1) return { prev: null, next: null };
  return {
    prev: posts[idx + 1] ?? null,
    next: posts[idx - 1] ?? null,
  };
}

export function getPostById(id: string): PostDetail | null {
  const normalizedId = resolvePostId(id);
  const fullPath = getMarkdownFilePaths(postsDirectory).find((filePath) => getPostIdFromPath(filePath) === normalizedId);
  if (!fullPath || !fs.existsSync(fullPath)) return null;

  const fileContents = fs.readFileSync(fullPath, "utf8");
  const matterResult = matter(fileContents);

  if (isPrivatePost(matterResult.data)) {
    return null;
  }

  let categories: string[] = [];
  if (Array.isArray(matterResult.data.category)) {
    categories = matterResult.data.category;
  } else if (typeof matterResult.data.category === "string") {
    categories = matterResult.data.category.split(",").map((c) => c.trim());
  }

  const seo = parseSEO(matterResult.data, normalizedId);
  const image =
    typeof matterResult.data.image === "string"
      ? resolvePostImageUrl(normalizedId, matterResult.data.image)
      : undefined;

  return {
    id: normalizedId,
    content: matterResult.content,
    ...(matterResult.data as Omit<Post, "id" | "category" | "seo">),
    ...(image ? { image } : {}),
    category: categories,
    ...(seo ? { seo } : {}),
  } as PostDetail;
}
