import { PostSearchItem } from "@/lib/data";

export const COMMAND_PALETTE_POST_KEYWORD = "__post__";
export type SearchProviderMode = "local" | "meilisearch";

function normalizeSearchValue(value: string): string {
  return value.toLowerCase().replace(/\s+/g, " ").trim();
}

function isBoundaryCharacter(char: string | undefined): boolean {
  return !char || char === " " || char === "/" || char === "-" || char === "_";
}

/**
 * Scores how well `value` matches `search` using a fuzzy matching algorithm
 * inspired by fzf. Higher scores indicate better matches.
 *
 * Scoring breakdown:
 * - Substring match: 80 points - distance penalty (max 40 points off)
 * - Character match: 4 points per matched character
 * - Boundary bonus: 16 points if match starts at a word boundary, 8 per additional boundary
 * - Consecutive bonus: 14 points for adjacent matched characters, decays with gaps
 * - Prefix bonus: 12 points if match starts at position 0 of the candidate
 * - Length penalty: up to -10 points for long candidates (reduces noise from long strings)
 *
 * @param value - The candidate string to score against the search query
 * @param search - The user's search query
 * @param keywords - Additional keywords appended to the candidate (e.g. post tags, categories)
 * @returns A non-negative score. 0 means no match. 1 means "show everything" (empty query).
 */
export function scoreFzfLikeMatch(value: string, search: string, keywords: string[] = []): number {
  const query = normalizeSearchValue(search);
  if (!query) {
    return 1;
  }

  const candidate = normalizeSearchValue([value, ...keywords].join(" "));
  if (!candidate) {
    return 0;
  }

  const substringIndex = candidate.indexOf(query);
  let score = 0;

  if (substringIndex !== -1) {
    score += 80 - Math.min(substringIndex, 40);
  }

  const positions: number[] = [];
  let cursor = 0;

  for (const char of query) {
    const index = candidate.indexOf(char, cursor);
    if (index === -1) {
      return substringIndex !== -1 ? score : 0;
    }
    positions.push(index);
    cursor = index + 1;
  }

  score += query.length * 4;

  for (let i = 0; i < positions.length; i += 1) {
    const current = positions[i];
    const previous = positions[i - 1];
    const previousChar = candidate[current - 1];

    if (i === 0 && isBoundaryCharacter(previousChar)) {
      score += 16;
    }

    if (isBoundaryCharacter(previousChar)) {
      score += 8;
    }

    if (i > 0) {
      const gap = current - previous - 1;
      if (gap === 0) {
        score += 14;
      } else {
        score += Math.max(0, 6 - gap);
      }
    }
  }

  if (positions[0] === 0) {
    score += 12;
  }

  score -= Math.min(candidate.length / 12, 10);

  return Math.max(score, 0);
}

export function searchPostSearchItems(
  items: PostSearchItem[],
  query: string,
  limit = 20,
): PostSearchItem[] {
  const normalizedQuery = query.trim();

  if (!normalizedQuery) {
    return items.slice(0, limit);
  }

  return items
    .map((item, index) => ({
      item,
      index,
      score: scoreFzfLikeMatch(item.title, normalizedQuery, [item.id, ...item.category, item.excerpt]),
    }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .slice(0, limit)
    .map((entry) => entry.item);
}
