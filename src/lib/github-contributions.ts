import { unstable_cache } from "next/cache";
import type { Activity } from "react-activity-calendar";

const GITHUB_CONTRIBUTIONS_API_URL = "https://github-contributions-api.jogruber.de/v4";
const GITHUB_CONTRIBUTIONS_CACHE_TTL_SECONDS = 15 * 60;
const GITHUB_CONTRIBUTIONS_TIMEOUT_MS = 3000;

interface GitHubContributionsApiResponse {
  contributions?: Activity[];
}

async function fetchGitHubContributions(username: string): Promise<Activity[] | null> {
  try {
    const response = await fetch(`${GITHUB_CONTRIBUTIONS_API_URL}/${username}?y=last`, {
      next: { revalidate: GITHUB_CONTRIBUTIONS_CACHE_TTL_SECONDS },
      signal: AbortSignal.timeout(GITHUB_CONTRIBUTIONS_TIMEOUT_MS),
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json() as GitHubContributionsApiResponse;

    if (!Array.isArray(data.contributions)) {
      return null;
    }

    return data.contributions.filter(
      (item): item is Activity =>
        item !== null &&
        typeof item === "object" &&
        typeof item.date === "string" &&
        typeof item.count === "number" &&
        typeof item.level === "number",
    );
  } catch {
    return null;
  }
}

const getCachedGitHubContributions = unstable_cache(
  async (username: string) => fetchGitHubContributions(username),
  ["github-contributions"],
  { revalidate: GITHUB_CONTRIBUTIONS_CACHE_TTL_SECONDS },
);

export async function getGitHubContributions(username?: string): Promise<Activity[] | null> {
  const normalizedUsername = username?.trim();

  if (!normalizedUsername || normalizedUsername === "facebook") {
    return null;
  }

  return getCachedGitHubContributions(normalizedUsername);
}
