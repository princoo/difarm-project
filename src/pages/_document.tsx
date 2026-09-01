import { Html, Head, Main, NextScript } from "next/document";
import {
  LANDING_DESCRIPTION,
  LANDING_OG_IMAGE,
  LANDING_TITLE,
  SITE_URL,
} from "@/lib/landingSeo";

export default function Document() {
  return (
    <Html lang="en" dir="ltr" data-scroll-behavior="smooth">
      <Head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/favicon.png" type="image/png" sizes="64x64" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" sizes="180x180" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#16a34a" />
        <meta name="description" content={LANDING_DESCRIPTION} />
        <meta property="og:title" content={LANDING_TITLE} />
        <meta property="og:description" content={LANDING_DESCRIPTION} />
        <meta property="og:image" content={LANDING_OG_IMAGE} />
        <meta property="og:url" content={SITE_URL} />
        <meta property="og:site_name" content="DiFarm" />
        <meta property="og:type" content="website" />
        <link
          href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      </Head>
      <body className="antialiased">
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
