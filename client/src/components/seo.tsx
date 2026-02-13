import { ReactNode, useMemo } from "react";
import { Helmet } from "react-helmet-async";
import { useLocation } from "wouter";
import defaultOgImage from "@/assets/88away-logo.png";

const SITE_NAME = "88Away";
const DEFAULT_TITLE = `${SITE_NAME} — The Ultimate KDP Publishing Platform for Romance Authors`;
const DEFAULT_DESCRIPTION =
  "Write, design, optimize, and publish your romance novels directly to Amazon KDP. AI-powered writing tools, cover design studio, keyword research, and royalty analytics — built exclusively for romance authors by 88Away LLC.";

type JsonLd = Record<string, unknown>;

type SeoProps = {
  title?: string;
  description?: string;
  canonical?: string;
  keywords?: string[];
  ogImage?: string;
  ogType?: string;
  twitterCard?: string;
  twitterHandle?: string;
  twitterImage?: string;
  structuredData?: JsonLd | JsonLd[];
  robots?: string;
  noindex?: boolean;
  children?: ReactNode;
};

const sanitizeBaseUrl = (url: string) =>
  url.endsWith("/") ? url.slice(0, -1) : url;

export function Seo({
  title,
  description,
  canonical,
  keywords,
  ogImage,
  ogType,
  twitterCard,
  twitterHandle,
  twitterImage,
  structuredData,
  robots,
  noindex,
  children,
}: SeoProps) {
  const [location] = useLocation();

  const baseUrl = useMemo(() => {
    const envBase =
      (import.meta.env as { VITE_SITE_URL?: string })?.VITE_SITE_URL ?? "";

    if (envBase) {
      return sanitizeBaseUrl(envBase);
    }

    if (typeof window !== "undefined" && window.location?.origin) {
      return sanitizeBaseUrl(window.location.origin);
    }

    return "https://88away.com";
  }, []);

  const currentPath = location?.startsWith("/")
    ? location
    : `/${location ?? ""}`;
  const canonicalUrl = canonical ?? `${baseUrl}${currentPath || "/"}`;
  const computedTitle = title ? `${title} | ${SITE_NAME}` : DEFAULT_TITLE;
  const computedDescription = description ?? DEFAULT_DESCRIPTION;
  const computedRobots =
    robots ?? (noindex ? "noindex, nofollow" : "index, follow");
  const computedKeywords = keywords?.length ? keywords.join(", ") : undefined;
  const computedOgImage = ogImage ?? twitterImage ?? defaultOgImage;
  const computedTwitterImage = twitterImage ?? computedOgImage;
  const computedTwitterCard = twitterCard ?? "summary_large_image";
  const computedTwitterHandle = twitterHandle ?? "@88Away";
  const jsonLdPayloads = structuredData
    ? Array.isArray(structuredData)
      ? structuredData
      : [structuredData]
    : [];

  return (
    <Helmet prioritizeSeoTags>
      <title>{computedTitle}</title>
      <meta name="description" content={computedDescription} />
      <meta name="robots" content={computedRobots} />
      <meta property="og:title" content={computedTitle} />
      <meta property="og:description" content={computedDescription} />
      <meta property="og:type" content={ogType ?? "website"} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:site_name" content={SITE_NAME} />
      {computedOgImage ? (
        <meta property="og:image" content={computedOgImage} />
      ) : null}
      <meta name="twitter:card" content={computedTwitterCard} />
      <meta name="twitter:title" content={computedTitle} />
      <meta name="twitter:description" content={computedDescription} />
      <meta name="twitter:site" content={computedTwitterHandle} />
      {computedTwitterImage ? (
        <meta name="twitter:image" content={computedTwitterImage} />
      ) : null}
      {computedKeywords ? (
        <meta name="keywords" content={computedKeywords} />
      ) : null}
      <link rel="canonical" href={canonicalUrl} />
      {jsonLdPayloads.map((schema, index) => (
        <script key={index} type="application/ld+json">
          {JSON.stringify(schema)}
        </script>
      ))}
      {children}
    </Helmet>
  );
}
