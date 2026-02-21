import { useEffect } from "react";

interface SEOHeadProps {
  title: string;
  description: string;
  image?: string;
  url?: string;
  type?: "website" | "article";
  keywords?: string[];
  structuredData?: object;
}

const SEOHead = ({
  title,
  description,
  image,
  url,
  type = "website",
  keywords,
  structuredData,
}: SEOHeadProps) => {
  const fullTitle = `${title} | Anagha Safar`;
  const siteUrl = window.location.origin;
  const canonicalUrl = url ? `${siteUrl}${url}` : window.location.href;
  const ogImage = image || `${siteUrl}/lovable-uploads/ANAGHA_SAFAR_LOGO.png`;

  useEffect(() => {
    // Title
    document.title = fullTitle;

    // Helper to set or create meta
    const setMeta = (selector: string, content: string) => {
      let el = document.querySelector(selector) as HTMLMetaElement | null;
      if (!el) {
        el = document.createElement("meta");
        const attr = selector.startsWith("[property")
          ? "property"
          : selector.startsWith("[name")
          ? "name"
          : "name";
        const val = selector.match(/["']([^"']+)["']/)?.[1] || "";
        el.setAttribute(attr, val);
        document.head.appendChild(el);
      }
      el.content = content;
    };

    // Standard meta
    setMeta('[name="description"]', description.slice(0, 160));
    setMeta('[name="robots"]', "index, follow");

    // Keywords
    if (keywords && keywords.length > 0) {
      setMeta('[name="keywords"]', keywords.join(", "));
    }

    // Open Graph
    setMeta('[property="og:title"]', fullTitle);
    setMeta('[property="og:description"]', description.slice(0, 160));
    setMeta('[property="og:image"]', ogImage);
    setMeta('[property="og:url"]', canonicalUrl);
    setMeta('[property="og:type"]', type);
    setMeta('[property="og:site_name"]', "Anagha Safar");

    // Twitter Card
    setMeta('[name="twitter:card"]', "summary_large_image");
    setMeta('[name="twitter:title"]', fullTitle);
    setMeta('[name="twitter:description"]', description.slice(0, 160));
    setMeta('[name="twitter:image"]', ogImage);

    // Canonical
    let canonicalEl = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!canonicalEl) {
      canonicalEl = document.createElement("link");
      canonicalEl.rel = "canonical";
      document.head.appendChild(canonicalEl);
    }
    canonicalEl.href = canonicalUrl;

    // JSON-LD Structured Data
    const existingScript = document.getElementById("seo-structured-data");
    if (existingScript) existingScript.remove();

    if (structuredData) {
      const script = document.createElement("script");
      script.id = "seo-structured-data";
      script.type = "application/ld+json";
      script.textContent = JSON.stringify(structuredData);
      document.head.appendChild(script);
    }

    // Cleanup on unmount
    return () => {
      document.title = "Anagha Safar - Luxury Travel Booking Platform";
      const sd = document.getElementById("seo-structured-data");
      if (sd) sd.remove();
    };
  }, [fullTitle, description, ogImage, canonicalUrl, type, keywords, structuredData]);

  return null;
};

export default SEOHead;
