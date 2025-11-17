import { ReactNode, useMemo } from "react";
import { Helmet } from "react-helmet-async";
import { useLocation } from "wouter";
import defaultOgImage from "@/assets/88away-logo.png";

const SITE_NAME = "88Away";
const DEFAULT_TITLE = `${SITE_NAME} — Professional Writing Platform`;
const DEFAULT_DESCRIPTION =
  "88Away is a comprehensive writing platform with AI-powered assistance, real-time collaboration, and advanced story management tools for professional authors.";

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
