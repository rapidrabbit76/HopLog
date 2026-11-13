"use client";

import { useState, type ReactNode } from "react";
import { useLocale } from "@/components/LocaleProvider";
import { LOCALE_LABELS, type Locale } from "@/lib/i18n";
import TableOfContents from "@/components/TableOfContents";

type Version = { title: string; content: ReactNode };

export default function TranslatedPost({ original, originalLocale, translations }: {
  original: Version;
  originalLocale: Locale;
  translations: Partial<Record<Locale, Version>>;
}) {
  const { locale } = useLocale();
  const [selection, setSelection] = useState<Locale | null>(null);
  const versions = { ...translations, [originalLocale]: original };
  const selected = selection ?? locale;
  const active = versions[selected] ? selected : originalLocale;
  const version = versions[active] ?? original;

  return (
    <>
      <TableOfContents key={active} />
      {Object.keys(versions).length > 1 && (
        <nav aria-label="Article language" className="mb-4 flex flex-wrap gap-2">
          {Object.keys(versions).map((key) => {
            const language = key as Locale;
            return <button key={language} type="button" lang={language} aria-pressed={active === language} onClick={() => setSelection(language)} className="rounded-md border border-border px-3 py-1 text-sm text-muted-foreground hover:text-foreground focus-visible:outline focus-visible:outline-2 aria-pressed:bg-muted aria-pressed:text-foreground">{LOCALE_LABELS[language]}</button>;
          })}
        </nav>
      )}
      <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground leading-tight">{version.title}</h1>
      <div lang={active}>{version.content}</div>
    </>
  );
}
