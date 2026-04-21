import fs from "fs";
import path from "path";
import yaml from "js-yaml";
import { createLogger, logConfigBanner, SECTION_COLORS } from "@/lib/logger";

export interface ProfileConfig {
  profile: {
    name: string;
    role: string;
    email: string;
    github: string;
    githubUsername: string;
    bio: string;
  };
  social: { platform: string; url: string }[];
  experience: {
    company: string;
    position: string;
    period: string;
    description: string;
  }[];
  skills: string[];
}

export interface GiscusInputConfig {
  repo?: string;
  repoId?: string;
  category?: string;
  categoryId?: string;
  mapping?: string;
  strict?: boolean;
  reactionsEnabled?: boolean;
  inputPosition?: string;
  lang?: string;
}

export interface CommentsInputConfig {
  enabled?: boolean;
  giscus?: GiscusInputConfig;
}

export interface GiscusResolvedConfig {
  repo: string;
  repoId: string;
  category: string;
  categoryId: string;
  mapping: "pathname" | "url" | "title" | "og:title" | "specific" | "number";
  strict: boolean;
  reactionsEnabled: boolean;
  inputPosition: "top" | "bottom";
  lang: string;
}

export interface CommentsResolvedConfig {
  enabled: boolean;
  giscus: GiscusResolvedConfig;
}

export interface SiteConfig {
  site: {
    title: string;
    description: string;
    titleTemplate: string;
  };
  faq?: {
    enabled?: boolean;
  };
  performance?: {
    postsCacheTtlSeconds?: number;
  };
  hero: {
    title: string;
    description: string;
    background: { image: string; opacity: number };
  };
  typography?: {
    lineHeight?: number;
    fontFamily?: string;
    fontUrl?: string;
  };
  theme?: {
    default?: string;
  };
  sharing?: SharingProvider[];
  search?: SearchConfig;
  comments?: CommentsInputConfig;
  analytics?: AnalyticsConfig;
}

export type SharingProvider = "twitter" | "facebook" | "linkedin" | "copyLink";

export type FullConfig = SiteConfig & ProfileConfig;

export interface SEORobotsRuleConfig {
  userAgent: string;
  allow?: string | string[];
  disallow?: string | string[];
  crawlDelay?: number;
}

export interface SEORobotsConfig {
  policy?: string;
  rules?: SEORobotsRuleConfig[];
}

export interface SEOConfig {
  host?: string;
  siteUrl: string;
  keywords: string[];
  language: string;
  robots: SEORobotsConfig;
  openGraph: {
    type: string;
    siteName: string;
    title: string;
    description: string;
    image: string;
    imageWidth: number;
    imageHeight: number;
  };
  twitter: {
    card: "summary_large_image" | "summary" | "player" | "app";
    site: string;
    creator: string;
    image: string;
  };
}

export interface AnalyticsProviderConfig {
  enabled?: boolean;
}

export interface GoogleAnalyticsConfig extends AnalyticsProviderConfig {
  measurementIdEnv?: string;
}

export interface MetaPixelConfig extends AnalyticsProviderConfig {
  pixelIdEnv?: string;
}

export interface SentryAnalyticsConfig extends AnalyticsProviderConfig {
  dsnEnv?: string;
  environmentEnv?: string;
  tracesSampleRate?: number;
}

export interface AnalyticsConfig {
  enabled?: boolean;
  debug?: boolean;
  ga?: GoogleAnalyticsConfig;
  metaPixel?: MetaPixelConfig;
  sentry?: SentryAnalyticsConfig;
}

export interface AnalyticsRuntimeProviderConfig {
  enabled: boolean;
}

export interface GoogleAnalyticsRuntimeConfig extends AnalyticsRuntimeProviderConfig {
  measurementId?: string;
}

export interface MetaPixelRuntimeConfig extends AnalyticsRuntimeProviderConfig {
  pixelId?: string;
}

export interface SentryRuntimeConfig extends AnalyticsRuntimeProviderConfig {
  dsn?: string;
  environment?: string;
  tracesSampleRate: number;
}

export interface AnalyticsRuntimeConfig {
  enabled: boolean;
  debug: boolean;
  ga: GoogleAnalyticsRuntimeConfig;
  metaPixel: MetaPixelRuntimeConfig;
  sentry: SentryRuntimeConfig;
}

export interface MeilisearchInputConfig {
  hostEnv?: string;
  searchKeyEnv?: string;
  adminKeyEnv?: string;
  indexName?: string;
  showRankingScore?: boolean;
}

export interface SearchConfig {
  provider?: "local" | "meilisearch";
  meilisearch?: MeilisearchInputConfig;
}

export interface SearchRuntimeConfig {
  provider: "local" | "meilisearch";
  meilisearch: {
    host: string;
    searchKey: string;
    indexName: string;
    showRankingScore: boolean;
  } | null;
}

export interface SearchSyncConfig {
  host: string;
  adminKey: string;
  indexName: string;
}

function loadYaml<T>(filePath: string): T {
  try {
    const fileContents = fs.readFileSync(filePath, "utf8");
    return yaml.load(fileContents) as T;
  } catch {
    throw new Error(`Failed to load ${path.basename(filePath)} at ${filePath}`);
  }
}

export function readEnvValue(key?: string): string | undefined {
  if (!key) {
    return undefined;
  }

  const value = process.env[key];

  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

export function normalizeSampleRate(value?: number): number {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return 1;
  }

  return Math.min(1, Math.max(0, value));
}

abstract class ConfigResolver<TResolved> {
  constructor(protected readonly config: FullConfig = getConfig()) {}

  protected env(key?: string): string | undefined {
    return readEnvValue(key);
  }

  abstract resolve(): TResolved;
}

class SearchConfigResolver extends ConfigResolver<SearchRuntimeConfig> {
  private get searchConfig(): SearchConfig | undefined {
    return this.config.search;
  }

  private resolveMeilisearch() {
    const meilisearch = this.searchConfig?.meilisearch;

    return {
      provider: this.searchConfig?.provider === "meilisearch" ? "meilisearch" : "local",
      host: this.env(meilisearch?.hostEnv),
      searchKey: this.env(meilisearch?.searchKeyEnv),
      adminKey: this.env(meilisearch?.adminKeyEnv),
      indexName: meilisearch?.indexName?.trim() || "posts",
    };
  }

  resolve(): SearchRuntimeConfig {
    const meilisearch = this.resolveMeilisearch();
    const effectiveSearchKey = meilisearch.searchKey || meilisearch.adminKey;
    const enabled = meilisearch.provider === "meilisearch"
      && Boolean(meilisearch.host)
      && Boolean(effectiveSearchKey);

    if (!enabled) {
      return {
        provider: "local",
        meilisearch: null,
      };
    }

    return {
      provider: "meilisearch",
      meilisearch: {
        host: meilisearch.host ?? "",
        searchKey: effectiveSearchKey ?? "",
        indexName: meilisearch.indexName,
        showRankingScore: this.searchConfig?.meilisearch?.showRankingScore === true,
      },
    };
  }

  resolveSync(): SearchSyncConfig | null {
    const meilisearch = this.resolveMeilisearch();
    const enabled = meilisearch.provider === "meilisearch"
      && Boolean(meilisearch.host)
      && Boolean(meilisearch.adminKey);

    if (!enabled) {
      return null;
    }

    return {
      host: meilisearch.host ?? "",
      adminKey: meilisearch.adminKey ?? "",
      indexName: meilisearch.indexName,
    };
  }
}

const VALID_GISCUS_MAPPINGS: GiscusResolvedConfig["mapping"][] = [
  "pathname", "url", "title", "og:title", "specific", "number",
];

class CommentsConfigResolver extends ConfigResolver<CommentsResolvedConfig> {
  resolve(): CommentsResolvedConfig {
    const comments = this.config.comments;
    const giscus = comments?.giscus;
    const rawMapping = giscus?.mapping ?? "pathname";

    return {
      enabled: comments?.enabled === true,
      giscus: {
        repo: giscus?.repo ?? "",
        repoId: giscus?.repoId ?? "",
        category: giscus?.category ?? "Announcements",
        categoryId: giscus?.categoryId ?? "",
        mapping: VALID_GISCUS_MAPPINGS.find((mapping) => mapping === rawMapping) ?? "pathname",
        strict: giscus?.strict === true,
        reactionsEnabled: giscus?.reactionsEnabled !== false,
        inputPosition: giscus?.inputPosition === "bottom" ? "bottom" : "top",
        lang: giscus?.lang ?? "",
      },
    };
  }
}

abstract class AnalyticsProviderConfigResolver<TResolved extends AnalyticsRuntimeProviderConfig> extends ConfigResolver<TResolved> {
  constructor(config: FullConfig, protected readonly analyticsEnabled: boolean) {
    super(config);
  }

  protected isEnabled(providerEnabled?: boolean, requiredValue?: string): boolean {
    return this.analyticsEnabled && providerEnabled === true && Boolean(requiredValue);
  }
}

class GoogleAnalyticsConfigResolver extends AnalyticsProviderConfigResolver<GoogleAnalyticsRuntimeConfig> {
  resolve(): GoogleAnalyticsRuntimeConfig {
    const analytics = this.config.analytics;
    const measurementId = this.env(analytics?.ga?.measurementIdEnv);

    return {
      enabled: this.isEnabled(analytics?.ga?.enabled, measurementId),
      measurementId,
    };
  }
}

class MetaPixelConfigResolver extends AnalyticsProviderConfigResolver<MetaPixelRuntimeConfig> {
  resolve(): MetaPixelRuntimeConfig {
    const analytics = this.config.analytics;
    const pixelId = this.env(analytics?.metaPixel?.pixelIdEnv);

    return {
      enabled: this.isEnabled(analytics?.metaPixel?.enabled, pixelId),
      pixelId,
    };
  }
}

class SentryAnalyticsConfigResolver extends AnalyticsProviderConfigResolver<SentryRuntimeConfig> {
  resolve(): SentryRuntimeConfig {
    const analytics = this.config.analytics;
    const dsn = this.env(analytics?.sentry?.dsnEnv);
    const environment = this.env(analytics?.sentry?.environmentEnv);

    return {
      enabled: this.isEnabled(analytics?.sentry?.enabled, dsn),
      dsn,
      environment,
      tracesSampleRate: normalizeSampleRate(analytics?.sentry?.tracesSampleRate),
    };
  }
}

class AnalyticsConfigResolver extends ConfigResolver<AnalyticsRuntimeConfig> {
  resolve(): AnalyticsRuntimeConfig {
    const analytics = this.config.analytics;
    const analyticsEnabled = analytics?.enabled !== false;

    return {
      enabled: analyticsEnabled,
      debug: analytics?.debug === true,
      ga: new GoogleAnalyticsConfigResolver(this.config, analyticsEnabled).resolve(),
      metaPixel: new MetaPixelConfigResolver(this.config, analyticsEnabled).resolve(),
      sentry: new SentryAnalyticsConfigResolver(this.config, analyticsEnabled).resolve(),
    };
  }
}

let configLogged = false;
let configCache: { data: FullConfig; expiresAt: number } | null = null;

export function getConfig(): FullConfig {
  const ttlMs = process.env.NODE_ENV === "production" ? 60_000 : 0;

  if (ttlMs > 0 && configCache && configCache.expiresAt > Date.now()) {
    return configCache.data;
  }

  const contentDir = process.env.CONTENT_DIR || "content";
  const basePath = path.join(process.cwd(), contentDir);

  const siteConfig = loadYaml<SiteConfig>(path.join(basePath, "config.yml"));
  const profileConfig = loadYaml<ProfileConfig>(
    path.join(basePath, "profile.yml"),
  );

  const config = { ...siteConfig, ...profileConfig };

  if (!configLogged) {
    configLogged = true;
    logConfigBanner([
      { label: "Site", color: SECTION_COLORS.site, data: {
        title: config.site.title,
        titleTemplate: config.site.titleTemplate,
        description: config.site.description,
      }},
      { label: "Profile", color: SECTION_COLORS.profile, data: {
        name: config.profile.name,
        role: config.profile.role,
      }},
      { label: "Theme", color: SECTION_COLORS.theme, data: {
        default: config.theme?.default ?? "default",
      }},
      { label: "Search", color: SECTION_COLORS.search, data: {
        provider: config.search?.provider ?? "local",
        index: config.search?.meilisearch?.indexName ?? "posts",
      }},
      { label: "Comments", color: SECTION_COLORS.comments, data: {
        enabled: config.comments?.enabled ?? false,
        provider: config.comments?.enabled ? "giscus" : "none",
      }},
      { label: "Analytics", color: SECTION_COLORS.analytics, data: {
        enabled: config.analytics?.enabled ?? false,
        ga: config.analytics?.ga?.enabled ?? false,
        metaPixel: config.analytics?.metaPixel?.enabled ?? false,
        sentry: config.analytics?.sentry?.enabled ?? false,
      }},
      { label: "Typography", color: SECTION_COLORS.typography, data: {
        fontFamily: config.typography?.fontFamily ?? "Geist (system)",
        lineHeight: config.typography?.lineHeight ?? 1.75,
      }},
      { label: "FAQ", color: SECTION_COLORS.faq, data: {
        enabled: config.faq?.enabled ?? false,
      }},
    ]);
  }

  if (ttlMs > 0) {
    configCache = { data: config, expiresAt: Date.now() + ttlMs };
  }

  return config;
}

export function getPostsCacheTtlMs(): number {
  if (process.env.NODE_ENV !== "production") {
    return 0;
  }

  const ttlSeconds = getConfig().performance?.postsCacheTtlSeconds;

  if (typeof ttlSeconds !== "number" || Number.isNaN(ttlSeconds)) {
    return 60_000;
  }

  return Math.max(0, ttlSeconds) * 1000;
}

const searchLog = createLogger("search");

export function getSearchRuntimeConfig(): SearchRuntimeConfig {
  const result = new SearchConfigResolver().resolve();
  searchLog.debug("resolved provider", {
    provider: result.provider,
    host: result.meilisearch?.host ? "***" : null,
    hasSearchKey: Boolean(result.meilisearch?.searchKey),
  });
  return result;
}

export function getSearchSyncConfig(): SearchSyncConfig | null {
  return new SearchConfigResolver().resolveSync();
}

export function getCommentsConfig(): CommentsResolvedConfig {
  return new CommentsConfigResolver().resolve();
}

export function getAnalyticsRuntimeConfig(): AnalyticsRuntimeConfig {
  return new AnalyticsConfigResolver().resolve();
}

export function getSharingProviders(): SharingProvider[] {
  return getConfig().sharing ?? [];
}

export function getSEOConfig(): SEOConfig {
  const contentDir = process.env.CONTENT_DIR || "content";
  const configPath = path.join(process.cwd(), contentDir, "seo.yml");
  return loadYaml<SEOConfig>(configPath);
}

export function getSiteHost(): string {
  const seo = getSEOConfig();
  const rawHost = seo.host || seo.siteUrl || "https://example.com";

  try {
    return new URL(rawHost).origin;
  } catch {
    return new URL(`https://${rawHost}`).origin;
  }
}

export function parseRobotsPolicy(policy?: string): {
  index: boolean;
  follow: boolean;
} {
  const normalized = policy?.toLowerCase() ?? "index, follow";

  return {
    index: !normalized.includes("noindex"),
    follow: !normalized.includes("nofollow"),
  };
}
