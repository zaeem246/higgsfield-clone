import type { Metadata } from "next";
import { Geist, Geist_Mono, Instrument_Serif } from "next/font/google";
import { cookies } from "next/headers";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { ViewTransitions } from "@/components/view-transitions";
import { currentAccount } from "@/lib/api.server";
import { parseTheme, THEME_COOKIE } from "@/lib/theme";
import "./globals.css";

const display = Instrument_Serif({
  variable: "--font-instrument-serif",
  subsets: ["latin"],
  weight: "400",
  display: "swap",
});

const sans = Geist({ variable: "--font-geist-sans", subsets: ["latin"], display: "swap" });

const mono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"], display: "swap" });

const appName = process.env.NEXT_PUBLIC_APP_NAME ?? "Kinograde";

export const metadata: Metadata = {
  title: {
    default: `${appName} — AI images and video you direct`,
    template: `%s · ${appName}`,
  },
  description:
    "Kinograde generates images and video from a prompt. Choose the film stock, the colour, the lighting, the effect and the camera move, and read the finished prompt and its price before you spend a credit.",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const jar = await cookies();
  const theme = parseTheme(jar.get(THEME_COOKIE)?.value);

  // The session is httpOnly, so signed-in state can only be established on the
  // server and handed down as a plain prop.
  const me = await currentAccount();
  const account = me.ok ? me.data : null;

  return (
    <html
      lang="en"
      data-theme={theme}
      className={`${display.variable} ${sans.variable} ${mono.variable} antialiased`}
    >
      <head>
        {/* Entrance animations start hidden; without JS nothing would ever
            reveal them, so a no-script render opts out entirely. */}
        <noscript>
          <style>{".reveal{opacity:1;transform:none}"}</style>
        </noscript>
      </head>
      <body className="flex min-h-dvh flex-col">
        <ViewTransitions />
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-50 focus:rounded-[2px] focus:border focus:border-rule focus:bg-raised focus:px-3 focus:py-2 focus:text-sm"
        >
          Skip to content
        </a>
        <SiteHeader account={account} theme={theme} />
        <main id="main" className="flex-1">
          {children}
        </main>
        <SiteFooter signedIn={account !== null} />
      </body>
    </html>
  );
}
