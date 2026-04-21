"use client";

import * as React from "react";
import { useLocale } from "@/components/LocaleProvider";
import { getUIStrings } from "@/lib/i18n";
import { useBlogStore } from "@/store/useStore";
import { PostListItem, PostListPage, POSTS_PER_PAGE } from "@/lib/data";
import { ChevronDown } from "lucide-react";
import PostCard from "@/components/PostCard";

async function fetchPostListPage(category: string | null, offset: number): Promise<PostListPage> {
  const searchParams = new URLSearchParams({
    offset: `${offset}`,
    limit: `${POSTS_PER_PAGE}`,
  });

  if (category) {
    searchParams.set("category", category);
  }

  const response = await fetch(`/api/posts?${searchParams.toString()}`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Failed to load posts");
  }

  return response.json() as Promise<PostListPage>;
}

export default function PostList({
  initialPosts,
  initialTotalCount,
  categories,
}: {
  initialPosts: PostListItem[];
  initialTotalCount: number;
  categories: string[];
}) {
  const { selectedCategory, setCategory, visibleCount, loadMore } = useBlogStore();
  const { locale } = useLocale();
  const ui = getUIStrings(locale);
  const [posts, setPosts] = React.useState(initialPosts);
  const [totalCount, setTotalCount] = React.useState(initialTotalCount);
  const [isLoading, setIsLoading] = React.useState(false);
  const [loadError, setLoadError] = React.useState<string | null>(null);
  const requestSequence = React.useRef(0);
  const noResultsText = React.useRef(ui.common.noResults);
  noResultsText.current = ui.common.noResults;

  const syncPosts = React.useCallback(async (category: string | null, offset: number, mode: "replace" | "append") => {
    const requestId = requestSequence.current + 1;
    requestSequence.current = requestId;
    setIsLoading(true);
    setLoadError(null);

    if (mode === "replace") {
      setPosts([]);
      setTotalCount(0);
    }

    try {
      const page = await fetchPostListPage(category, offset);

      if (requestSequence.current !== requestId) {
        return;
      }

      setPosts((currentPosts) => (mode === "append" ? [...currentPosts, ...page.items] : page.items));
      setTotalCount(page.totalCount);
    } catch {
      if (requestSequence.current === requestId) {
        setLoadError(noResultsText.current);
      }
    } finally {
      if (requestSequence.current === requestId) {
        setIsLoading(false);
      }
    }
  }, []);

  React.useEffect(() => {
    if (visibleCount <= posts.length || posts.length >= totalCount) {
      return;
    }

    void syncPosts(selectedCategory, posts.length, "append");
  }, [posts.length, selectedCategory, syncPosts, totalCount, visibleCount]);

  const displayedPosts = posts.slice(0, visibleCount);
  const hasMore = visibleCount < totalCount;

  const handleCategoryChange = (nextCategory: string) => {
    const normalizedCategory = nextCategory === "" ? null : nextCategory;

    if (normalizedCategory === selectedCategory) {
      return;
    }

    setCategory(normalizedCategory);
    void syncPosts(normalizedCategory, 0, "replace");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <section className="space-y-6" aria-busy={isLoading}>
      <div className="flex justify-between items-center pb-2 border-b border-border/50">
        <h2 className="text-[13px] font-bold text-foreground">
          {ui.postList.latestPosts} <span className="text-muted-foreground font-normal ml-1">{totalCount}</span>
        </h2>

        <div className="relative">
          <select
            value={selectedCategory || ""}
            onChange={(e) => handleCategoryChange(e.target.value)}
            className="appearance-none bg-muted/50 hover:bg-muted text-[13px] font-semibold text-foreground pl-4 pr-10 py-2 rounded-full outline-none transition-colors cursor-pointer focus:ring-2 focus:ring-primary/50"
          >
            <option value="">{ui.postList.allCategories}</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground">
            <ChevronDown className="w-4 h-4" />
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        {!isLoading && displayedPosts.length === 0 ? (
          <div className="py-14 text-center text-sm text-muted-foreground font-medium bg-muted/30 rounded-2xl">
            {ui.postList.noPostsInCategory}
          </div>
        ) : (
          displayedPosts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))
        )}
      </div>

      {loadError && (
        <div className="rounded-2xl bg-muted/30 px-4 py-3 text-center text-sm font-medium text-muted-foreground">
          {loadError}
        </div>
      )}

      {hasMore && (
        <div className="pt-3 pb-1 flex justify-center">
          <button
            type="button"
            onClick={loadMore}
            disabled={isLoading}
            className="px-5 py-2.5 rounded-full bg-muted/50 text-[14px] font-semibold text-foreground hover:bg-muted transition-all active:scale-95 flex items-center gap-2"
          >
            <span>{ui.postList.loadMore}</span>
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>
      )}

    </section>
  );
}
