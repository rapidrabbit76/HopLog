import { Fragment } from "react";
import Script from "next/script";
import type { AnalyticsRuntimeConfig } from "@/lib/config";
import { UMAMI_SCRIPT_PATH } from "@/lib/umami";

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
    fbq?: {
      (...args: unknown[]): void;
      callMethod?: (...args: unknown[]) => void;
      queue?: unknown[];
      loaded?: boolean;
      version?: string;
      push?: (...args: unknown[]) => number;
    };
    _fbq?: Window["fbq"];
  }
}

interface AnalyticsPageViewContext {
  pagePath: string;
}

interface AnalyticsScriptsProps {
  debug: boolean;
}

export abstract class AnalyticsProvider {
  constructor(readonly key: string, readonly enabled: boolean) {}

  initialize(): void | Promise<void> {}

  dispose(): void {}

  trackPageView(context: AnalyticsPageViewContext): void {
    void context;
  }

  renderScripts(props: AnalyticsScriptsProps): React.ReactNode {
    void props;
    return null;
  }
}

class GoogleAnalyticsProvider extends AnalyticsProvider {
  constructor(private readonly measurementId?: string) {
    super("ga", Boolean(measurementId));
  }

  override trackPageView({ pagePath }: AnalyticsPageViewContext): void {
    if (!this.enabled || !this.measurementId || typeof window.gtag !== "function") {
      return;
    }

    window.gtag("event", "page_view", {
      page_path: pagePath,
      page_location: window.location.href,
      page_title: document.title,
    });
  }

  override renderScripts({ debug }: AnalyticsScriptsProps): React.ReactNode {
    if (!this.enabled || !this.measurementId) {
      return null;
    }

    return (
      <>
        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=${this.measurementId}`}
          strategy="afterInteractive"
        />
        <Script id="ga-init" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            window.gtag = gtag;
            gtag('js', new Date());
            gtag('config', '${this.measurementId}', {
              send_page_view: false,
              debug_mode: ${debug ? "true" : "false"}
            });
          `}
        </Script>
      </>
    );
  }
}

class MetaPixelProvider extends AnalyticsProvider {
  constructor(private readonly pixelId?: string) {
    super("meta-pixel", Boolean(pixelId));
  }

  override trackPageView(): void {
    if (!this.enabled || !this.pixelId || typeof window.fbq !== "function") {
      return;
    }

    window.fbq("track", "PageView");
  }

  override renderScripts(): React.ReactNode {
    if (!this.enabled || !this.pixelId) {
      return null;
    }

    return (
      <>
        <Script id="meta-pixel-init" strategy="afterInteractive">
          {`
            !function(f,b,e,v,n,t,s){
              if(f.fbq)return;
              n=f.fbq=function(){n.callMethod?
              n.callMethod.apply(n,arguments):n.queue.push(arguments)};
              if(!f._fbq)f._fbq=n;
              n.push=n;n.loaded=!0;n.version='2.0';
              n.queue=[];t=b.createElement(e);t.async=!0;
              t.src=v;s=b.getElementsByTagName(e)[0];
              s.parentNode.insertBefore(t,s)
            }(window, document,'script','https://connect.facebook.net/en_US/fbevents.js');
            fbq('init', '${this.pixelId}');
          `}
        </Script>
        <noscript>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            height="1"
            width="1"
            style={{ display: "none" }}
            src={`https://www.facebook.com/tr?id=${this.pixelId}&ev=PageView&noscript=1`}
            alt=""
          />
        </noscript>
      </>
    );
  }
}

// Umami tracks page views (including client-side navigations) by itself, so trackPageView stays a no-op
class UmamiProvider extends AnalyticsProvider {
  constructor(private readonly websiteId?: string) {
    super("umami", Boolean(websiteId));
  }

  override renderScripts(): React.ReactNode {
    if (!this.enabled || !this.websiteId) {
      return null;
    }

    return <Script src={UMAMI_SCRIPT_PATH} strategy="afterInteractive" data-website-id={this.websiteId} />;
  }
}

export class AnalyticsProviderCollection {
  constructor(readonly providers: AnalyticsProvider[]) {}

  initialize(): void {
    this.providers.forEach((provider) => {
      provider.initialize();
    });
  }

  dispose(): void {
    this.providers.forEach((provider) => {
      provider.dispose();
    });
  }

  trackPageView(context: AnalyticsPageViewContext): void {
    this.providers.forEach((provider) => {
      provider.trackPageView(context);
    });
  }

  renderScripts(props: AnalyticsScriptsProps): React.ReactNode {
    return this.providers.map((provider) => (
      <Fragment key={provider.key}>{provider.renderScripts(props)}</Fragment>
    ));
  }
}

export async function createAnalyticsProviderCollection(config: AnalyticsRuntimeConfig): Promise<AnalyticsProviderCollection> {
  const providers: AnalyticsProvider[] = [
    new GoogleAnalyticsProvider(config.ga.enabled ? config.ga.measurementId : undefined),
    new MetaPixelProvider(config.metaPixel.enabled ? config.metaPixel.pixelId : undefined),
    new UmamiProvider(config.umami.enabled ? config.umami.websiteId : undefined),
  ];

  // Dynamically import SentryProvider only when enabled to avoid bundling @sentry/browser (334KB)
  if (config.sentry.enabled) {
    const { SentryProvider } = await import("./analytics-sentry");
    providers.push(
      new SentryProvider(
        config.sentry.dsn,
        config.sentry.environment,
        config.sentry.tracesSampleRate,
      ),
    );
  }

  return new AnalyticsProviderCollection(providers);
}
