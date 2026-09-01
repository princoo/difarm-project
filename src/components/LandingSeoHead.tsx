import Head from "next/head";
import {
  LANDING_DESCRIPTION,
  LANDING_OG_IMAGE,
  LANDING_TITLE,
  SITE_URL,
} from "@/lib/landingSeo";

type Props = {
  /** Canonical path, e.g. "/" or "/home" */
  path?: string;
};

/** SEO tags for the public landing / marketing pages. */
export default function LandingSeoHead({ path = "/home" }: Props) {
  const canonical = `${SITE_URL}${path === "/" ? "" : path}`;

  return (
    <Head>
      <title>{LANDING_TITLE}</title>
      <meta name="description" content={LANDING_DESCRIPTION} />
      <link rel="canonical" href={canonical} />

      <meta property="og:type" content="website" />
      <meta property="og:site_name" content="DiFarm" />
      <meta property="og:title" content={LANDING_TITLE} />
      <meta property="og:description" content={LANDING_DESCRIPTION} />
      <meta property="og:url" content={canonical} />
      <meta property="og:image" content={LANDING_OG_IMAGE} />
      <meta property="og:locale" content="en_RW" />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={LANDING_TITLE} />
      <meta name="twitter:description" content={LANDING_DESCRIPTION} />
      <meta name="twitter:image" content={LANDING_OG_IMAGE} />
    </Head>
  );
}
