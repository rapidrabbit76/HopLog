import type { Metadata, Viewport } from "next";
import { cookies } from "next/headers";
import { Geist, Geist_Mono } from "next/font/google";
import { LocaleProvider } from "@/components/LocaleProvider";
import AnalyticsRuntime from "@/components/AnalyticsRuntime";
import { ThemeProvider } from "@/components/theme-provider";
import Header from "@/components/Header";
import LayoutWrapper from "@/components/LayoutWrapper";
import CommandPalette from "@/components/CommandPalette";
import Footer from "@/components/Footer";
import PageTransition from "@/components/PageTransition";
import AppReadyMarker from "@/components/AppReadyMarker";
import { hasFAQContent } from "@/lib/faq";
import { getAnalyticsRuntimeConfig, getConfig, getSEOConfig, getSiteHost, parseRobotsPolicy } from "@/lib/config";
import { getHtmlLang, parseLocaleCookie } from "@/lib/i18n";
import { getSearchProviderMode } from "@/lib/search";
import { getColorThemes } from "@/lib/themes";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#000000" },
  ],
  width: "device-width",
  initialScale: 1,
};

export function generateMetadata(): Metadata {
  const config = getConfig();
  const seo = getSEOConfig();
  const siteHost = getSiteHost();
  const robotsPolicy = parseRobotsPolicy(seo.robots.policy);

  return {
    metadataBase: new URL(siteHost),
    title: {
      template: config.site.titleTemplate,
      default: config.site.title,
    },
    description: config.site.description,
    keywords: seo.keywords,
    appleWebApp: {
      capable: true,
      title: config.site.title,
      statusBarStyle: "default",
    },
    alternates: {
      canonical: "/",
    },
    openGraph: {
      title: seo.openGraph.title,
      description: seo.openGraph.description,
      url: siteHost,
      siteName: seo.openGraph.siteName,
      locale: seo.language,
      type: "website",
      images: [
        {
          url: seo.openGraph.image,
          width: seo.openGraph.imageWidth,
          height: seo.openGraph.imageHeight,
          alt: seo.openGraph.title,
        },
      ],
    },
    twitter: {
      card: seo.twitter.card,
      title: seo.openGraph.title,
      description: seo.openGraph.description,
      images: [seo.twitter.image],
      site: seo.twitter.site,
      creator: seo.twitter.creator,
    },
    icons: {
      icon: [
        { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
        { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      ],
      apple: "/apple-icon.png",
    },
    robots: {
      index: robotsPolicy.index,
      follow: robotsPolicy.follow,
      googleBot: {
        index: robotsPolicy.index,
        follow: robotsPolicy.follow,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const initialLocale = parseLocaleCookie(cookieStore.get("hoplog-locale")?.value);
  const config = getConfig();
  const analyticsConfig = getAnalyticsRuntimeConfig();
  const searchMode = getSearchProviderMode();
  const siteHost = getSiteHost();
  const themes = getColorThemes();
  const faqEnabled = hasFAQContent();

  const themeCss = themes
    .map((themeOption) => {
      const processVars = (colorMap: Record<string, string>) => {
        const vars = Object.entries(colorMap).map(([k, v]) => `--${k}: ${v};`);
        // Auto-generate activity levels if not explicitly defined
        if (!colorMap["activity-0"]) vars.push(`--activity-0: var(--muted);`);
        if (!colorMap["activity-1"]) vars.push(`--activity-1: ${colorMap.primary}40;`);
        if (!colorMap["activity-2"]) vars.push(`--activity-2: ${colorMap.primary}80;`);
        if (!colorMap["activity-3"]) vars.push(`--activity-3: ${colorMap.primary}c0;`);
        if (!colorMap["activity-4"]) vars.push(`--activity-4: ${colorMap.primary};`);
        return vars.join("");
      };

      const lightVars = processVars(themeOption.light);
      const darkVars = processVars(themeOption.dark);
      return `
      [data-color-theme="${themeOption.id}"] { ${lightVars} }
      .dark[data-color-theme="${themeOption.id}"] { ${darkVars} }
    `;
    })
    .join("\n");

  // GEO Optimization: JSON-LD Structured Data
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: config.site.title,
    url: siteHost,
    description: config.site.description,
    author: {
      "@type": "Person",
      name: config.profile.name,
      description: config.profile.bio,
      url: config.profile.github,
    },
    publisher: {
      "@type": "Organization",
      name: config.site.title,
      logo: {
        "@type": "ImageObject",
        url: `${siteHost}/favicon.png`,
      },
    },
  };

  const rawDefault = config.theme?.default || "default";
  const configDefault = JSON.stringify(/^[a-z0-9_-]+$/i.test(rawDefault) ? rawDefault : "default");
  const themeBootScript = `
    try {
      var configDefault = ${configDefault};
      // Migrate legacy key (vimlog-storage -> hoplog-storage)
      var legacy = localStorage.getItem('vimlog-storage');
      if (legacy && !localStorage.getItem('hoplog-storage')) {
        localStorage.setItem('hoplog-storage', legacy);
      }
      if (legacy) {
        localStorage.removeItem('vimlog-storage');
      }

      var store = localStorage.getItem('hoplog-storage');
      if (store) {
        var parsed = JSON.parse(store);
        if (parsed && parsed.state) {
          if (parsed.state.isWideMode === false) {
            document.documentElement.setAttribute('data-wide', 'false');
          }
          var persistedTheme = parsed.state.colorTheme || parsed.state.colorSchema;
          if (persistedTheme) {
            document.documentElement.setAttribute('data-color-theme', persistedTheme);
          }
        }
      } else {
        document.documentElement.setAttribute('data-color-theme', configDefault);
        localStorage.setItem('hoplog-storage', JSON.stringify({state:{colorTheme:configDefault,isWideMode:true},version:0}));
      }
    } catch (e) {}

    // Apply dark/light mode before next-themes hydrates to prevent FOUC
    try {
      var theme = localStorage.getItem('theme');
      var isDark = theme === 'dark' || ((!theme || theme === 'system') && window.matchMedia('(prefers-color-scheme: dark)').matches);
      document.documentElement.classList.toggle('dark', isDark);
    } catch (e) {}

    // Unregister any active service workers to prevent PWA caching issues
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then(function(registrations) {
        for (let registration of registrations) {
          registration.unregister();
        }
      });
    }
  `;

  return (
    <html
      lang={getHtmlLang(initialLocale)}
      data-color-theme={config.theme?.default || "default"}
      suppressHydrationWarning
    >
      <head>
        {config.typography?.fontUrl && <link rel="stylesheet" href={config.typography.fontUrl} />}
        <style>{themeCss}</style>
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
        <script data-cfasync="false">{themeBootScript}</script>
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen flex flex-col`}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <LocaleProvider initialLocale={initialLocale}>
            <AppReadyMarker />
            <AnalyticsRuntime config={analyticsConfig} />
            <Header title={config.site.title} faqEnabled={faqEnabled} />
            <CommandPalette themes={themes} faqEnabled={faqEnabled} searchMode={searchMode} />
            <LayoutWrapper>
              <main className="relative z-0 flex-grow w-full px-4 py-4">
                <PageTransition>{children}</PageTransition>
              </main>

              <Footer email={config.profile.email} social={config.social} />
            </LayoutWrapper>
          </LocaleProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
