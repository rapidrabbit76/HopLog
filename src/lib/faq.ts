import fs from "fs";
import path from "path";
import yaml from "js-yaml";
import { getConfig } from "@/lib/config";
import { DEFAULT_LOCALE, isLocale, type Locale, type UIStrings } from "@/lib/i18n";

export interface FAQItem {
  id: string;
  question: string;
  answer: string;
}

export interface FAQGroup {
  id: string;
  title: string;
  items: FAQItem[];
}

export interface FAQDocument {
  title: string;
  description: string;
  groups: FAQGroup[];
}

export type FAQCatalog = Partial<Record<Locale, FAQDocument>>;

function getFAQDir() {
  const contentDir = process.env.CONTENT_DIR || "content";
  return path.join(process.cwd(), contentDir, "faq");
}

function isFAQEnabled() {
  return getConfig().faq?.enabled === true;
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

export function isValidFAQDocument(value: unknown): value is FAQDocument {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<FAQDocument>;

  if (!isNonEmptyString(candidate.title) || !isNonEmptyString(candidate.description) || !Array.isArray(candidate.groups)) {
    return false;
  }

  if (candidate.groups.length === 0) {
    return false;
  }

  return candidate.groups.every((group) => {
    if (!group || typeof group !== "object") {
      return false;
    }

    const faqGroup = group as Partial<FAQGroup>;

    if (!isNonEmptyString(faqGroup.id) || !isNonEmptyString(faqGroup.title) || !Array.isArray(faqGroup.items)) {
      return false;
    }

    if (faqGroup.items.length === 0) {
      return false;
    }

    return faqGroup.items.every((item) => {
      if (!item || typeof item !== "object") {
        return false;
      }

      const faqItem = item as Partial<FAQItem>;

      return isNonEmptyString(faqItem.id) && isNonEmptyString(faqItem.question) && isNonEmptyString(faqItem.answer);
    });
  });
}

function loadFAQFile(locale: Locale): FAQDocument | null {
  const filePath = path.join(getFAQDir(), `${locale}.yml`);

  if (!fs.existsSync(filePath)) {
    return null;
  }

  try {
    const fileContents = fs.readFileSync(filePath, "utf8");
    const parsed = yaml.load(fileContents);
    return isValidFAQDocument(parsed) ? parsed : null;
  } catch (error) {
    console.error(`Failed to load faq file for locale ${locale}`, error);
    return null;
  }
}

export function getFAQCatalog(): FAQCatalog {
  if (!isFAQEnabled()) {
    return {};
  }

  const englishFAQ = loadFAQFile(DEFAULT_LOCALE);

  if (!englishFAQ) {
    return {};
  }

  const catalog: FAQCatalog = {
    [DEFAULT_LOCALE]: englishFAQ,
  };

  for (const locale of ["ko", "ja", "zh"] as const) {
    const localeFAQ = loadFAQFile(locale);

    if (localeFAQ) {
      catalog[locale] = localeFAQ;
    }
  }

  return catalog;
}

export function hasFAQContent() {
  return Boolean(getFAQCatalog()[DEFAULT_LOCALE]);
}

export function getFAQForLocale(locale: string, catalog: FAQCatalog = getFAQCatalog()): FAQDocument | null {
  if (!catalog[DEFAULT_LOCALE]) {
    return null;
  }

  if (isLocale(locale) && catalog[locale]) {
    return catalog[locale] ?? null;
  }

  return catalog[DEFAULT_LOCALE] ?? null;
}

export function getFAQPageTitle(locale: string, ui: UIStrings, catalog: FAQCatalog = getFAQCatalog()) {
  return getFAQForLocale(locale, catalog)?.title ?? ui.header.faq;
}
