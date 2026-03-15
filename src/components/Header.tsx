"use client";

import * as React from "react";
import Link from "next/link";
import { useTheme } from "next-themes";
import { Check, ChevronDown, Languages, Moon, Sun, Maximize, Minimize, Search } from "lucide-react";
import { getUIStrings, LOCALE_LABELS, SUPPORTED_LOCALES, type Locale } from "@/lib/i18n";
import { useLocale } from "@/components/LocaleProvider";
import { cn } from "@/lib/utils";
import { useBlogStore } from "@/store/useStore";

export default function Header({ title, faqEnabled }: { title: string; faqEnabled: boolean }) {
  const { theme, setTheme } = useTheme();
  const { isWideMode, toggleWideMode } = useBlogStore();
  const { locale, setLocale } = useLocale();
  const [mounted, setMounted] = React.useState(false);
  const [localeMenuOpen, setLocaleMenuOpen] = React.useState(false);
  const localeMenuRef = React.useRef<HTMLDivElement>(null);
  const ui = getUIStrings(locale);

  React.useEffect(() => {
    setMounted(true);
    if (isWideMode) {
      document.documentElement.removeAttribute("data-wide");
    } else {
      document.documentElement.setAttribute("data-wide", "false");
    }
  }, [isWideMode]);

  React.useEffect(() => {
    if (!localeMenuOpen) {
      return;
    }

    const handlePointerDown = (event: MouseEvent) => {
      if (localeMenuRef.current && !localeMenuRef.current.contains(event.target as Node)) {
        setLocaleMenuOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setLocaleMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [localeMenuOpen]);

  const toggleTheme = (e?: React.MouseEvent) => {
    const isDark = theme === "dark";
    const nextTheme = isDark ? "light" : "dark";

    if (!document.startViewTransition) {
      setTheme(nextTheme);
      return;
    }

    const x = e ? e.clientX : window.innerWidth / 2;
    const y = e ? e.clientY : 0;
    document.documentElement.style.setProperty("--theme-toggle-x", `${x}px`);
    document.documentElement.style.setProperty("--theme-toggle-y", `${y}px`);

    document.startViewTransition(() => {
      setTheme(nextTheme);
    });
  };

  return (
    <header className="sticky top-0 z-[100] isolate w-full border-b border-border/40 bg-background/80 backdrop-blur-md transition-colors duration-300">
      <div
        className={cn(
          "mx-auto flex h-14 items-center justify-between px-5 max-w-5xl narrow:max-w-2xl",
          mounted && "transition-all duration-500 ease-in-out",
        )}
      >
        <Link
          href="/"
          className="group flex items-center gap-1 active:scale-95 transition-transform"
          aria-label={ui.header.homeAria}
          title="G H"
        >
          <span className="font-bold tracking-tight text-xl text-foreground">{title}</span>
          <span className="w-1.5 h-1.5 rounded-full bg-primary mb-1 inline-block"></span>
        </Link>

        <div className="flex items-center gap-3 sm:gap-4">
          <nav className="hidden sm:flex gap-5 text-[13px] font-medium text-muted-foreground mr-1">
            <Link href="/about" className="hover:text-foreground transition-colors group relative" title="G B">
              {ui.header.about}
              <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 px-1.5 py-0.5 bg-foreground text-background text-[9px] font-mono font-bold rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                G B
              </span>
            </Link>
            {faqEnabled && (
              <Link href="/faq" className="hover:text-foreground transition-colors group relative" title="G F">
                {ui.header.faq}
                <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 px-1.5 py-0.5 bg-foreground text-background text-[9px] font-mono font-bold rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                  G F
                </span>
              </Link>
            )}
          </nav>

          <div className="flex items-center gap-1">
            <div className="relative" ref={localeMenuRef}>
              <button
                type="button"
                onClick={() => setLocaleMenuOpen((open) => !open)}
                aria-label={ui.header.languageMenu}
                aria-haspopup="menu"
                aria-expanded={localeMenuOpen}
                className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-background/70 px-2.5 py-1.5 text-[11px] font-bold text-muted-foreground transition-all duration-200 hover:border-border hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
              >
                <Languages className="h-3.5 w-3.5" />
                <span>{locale.toUpperCase()}</span>
                <ChevronDown
                  className={cn("h-3.5 w-3.5 transition-transform duration-200", localeMenuOpen && "rotate-180")}
                />
              </button>

              {localeMenuOpen && (
                <div className="absolute right-0 top-[calc(100%+0.5rem)] z-50 min-w-[150px] overflow-hidden rounded-2xl border border-border/70 bg-background/95 p-1.5 shadow-[0_18px_40px_-18px_rgba(0,0,0,0.45)] backdrop-blur-md">
                  {SUPPORTED_LOCALES.map((localeOption) => {
                    const active = locale === localeOption;

                    return (
                      <button
                        key={localeOption}
                        type="button"
                        onClick={() => {
                          setLocale(localeOption as Locale);
                          setLocaleMenuOpen(false);
                        }}
                        className={cn(
                          "flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-[12px] font-semibold transition-colors",
                          active
                            ? "bg-primary/10 text-foreground"
                            : "text-muted-foreground hover:bg-muted hover:text-foreground",
                        )}
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="text-[10px] font-black uppercase tracking-[0.18em] text-primary/80">
                            {localeOption}
                          </span>
                          <span>{LOCALE_LABELS[localeOption]}</span>
                        </div>
                        {active && <Check className="h-3.5 w-3.5 text-primary" />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => window.dispatchEvent(new Event("toggle-command-palette"))}
              className="p-1.5 rounded-full text-muted-foreground hover:bg-muted hover:text-foreground active:scale-95 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary group relative"
              aria-label={ui.command.commandPalette}
            >
              <Search className="w-4 h-4" />
              <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 px-1.5 py-0.5 bg-foreground text-background text-[9px] font-mono font-bold rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                ⌘⇧P
              </span>
            </button>

            <button
              type="button"
              onClick={toggleWideMode}
              className="p-1.5 rounded-full text-muted-foreground hover:bg-muted hover:text-foreground active:scale-95 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary hidden md:block group relative"
              aria-label={ui.header.toggleWideMode}
            >
              {isWideMode ? (
                <Minimize className={cn("w-4 h-4 transition-opacity duration-300", mounted ? "opacity-100" : "opacity-0")} />
              ) : (
                <Maximize className={cn("w-4 h-4 transition-opacity duration-300", mounted ? "opacity-100" : "opacity-0")} />
              )}
              <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 px-1.5 py-0.5 bg-foreground text-background text-[9px] font-mono font-bold rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                W
              </span>
            </button>

            <button
              type="button"
              onClick={toggleTheme}
              className="p-1.5 rounded-full text-muted-foreground hover:bg-muted hover:text-foreground active:scale-95 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary group relative"
              aria-label={ui.header.toggleTheme}
            >
              <Sun className="w-4 h-4 hidden dark:block" />
              <Moon className="w-4 h-4 block dark:hidden" />
              <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 px-1.5 py-0.5 bg-foreground text-background text-[9px] font-mono font-bold rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                T
              </span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
