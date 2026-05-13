import { Helmet } from "react-helmet-async";

const SITE_URL = "https://ticdia.vercel.app";

interface SEOProps {
  title: string;
  description: string;
  path: string;
  type?: "website" | "article";
  image?: string;
  jsonLd?: Record<string, unknown> | Record<string, unknown>[];
  noindex?: boolean;
}

/**
 * Per-route SEO head: unique <title>, description, canonical, og:* and optional JSON-LD.
 * Drop one near the top of every page component.
 */
export const SEO = ({
  title,
  description,
  path,
  type = "website",
  image,
  jsonLd,
  noindex,
}: SEOProps) => {
  const url = `${SITE_URL}${path}`;
  const safeTitle = title.length > 60 ? title.slice(0, 57) + "…" : title;
  const safeDesc =
    description.length > 160 ? description.slice(0, 157) + "…" : description;
  const ogImage = image
    ? image.startsWith("http")
      ? image
      : `${SITE_URL}${image}`
    : `${SITE_URL}/og-image.svg`;

  return (
    <Helmet>
      <title>{safeTitle}</title>
      <meta name="description" content={safeDesc} />
      <link rel="canonical" href={url} />
      {noindex && <meta name="robots" content="noindex, nofollow" />}

      <meta property="og:title" content={safeTitle} />
      <meta property="og:description" content={safeDesc} />
      <meta property="og:url" content={url} />
      <meta property="og:type" content={type} />
      <meta property="og:image" content={ogImage} />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={safeTitle} />
      <meta name="twitter:description" content={safeDesc} />
      <meta name="twitter:image" content={ogImage} />

      {jsonLd && (
        <script type="application/ld+json">
          {JSON.stringify(jsonLd)}
        </script>
      )}
    </Helmet>
  );
};

export default SEO;
