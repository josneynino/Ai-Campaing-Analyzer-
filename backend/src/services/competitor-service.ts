import { env } from "../config/env";

export type NormalizedCompetitor = {
  source: "meta" | "google";
  platform: string;
  advertiserName: string;
  title: string | null;
  text: string;
  url: string | null;
};

async function fetchJson(url: string): Promise<unknown | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) {
      // eslint-disable-next-line no-console
      console.error("Error HTTP al consultar competidores:", res.status, url);
      return null;
    }
    return (await res.json()) as unknown;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Error de red al consultar competidores:", error);
    return null;
  }
}

async function fetchMetaCompetitors(
  niche: string,
  keywords: string[],
): Promise<NormalizedCompetitor[]> {
  if (!env.META_AD_LIBRARY_ACCESS_TOKEN) {
    return [];
  }

  const base =
    env.META_AD_LIBRARY_ENDPOINT ??
    "https://graph.facebook.com/v20.0/ads_archive";

  const searchTerms = `${niche} ${keywords.slice(0, 4).join(" ")}`.trim();

  const params = new URLSearchParams({
    access_token: env.META_AD_LIBRARY_ACCESS_TOKEN,
    search_terms: searchTerms,
    fields:
      "ad_creative_body,ad_creative_link_title,page_name,ad_snapshot_url,publisher_platforms",
    limit: "5",
  });

  const url = `${base}?${params.toString()}`;
  const json = (await fetchJson(url)) as { data?: unknown[] } | null;

  if (!json?.data || !Array.isArray(json.data)) {
    return [];
  }

  type MetaAdLibraryItem = {
    ad_creative_body?: string;
    ad_creative_link_title?: string;
    page_name?: string;
    ad_snapshot_url?: string;
    publisher_platforms?: string[];
  };

  const results: NormalizedCompetitor[] = [];

  for (const raw of json.data) {
    const item = raw as MetaAdLibraryItem;
    const body: string | undefined = item.ad_creative_body;
    const title: string | undefined = item.ad_creative_link_title;
    const pageName: string | undefined = item.page_name;
    const snapshotUrl: string | undefined = item.ad_snapshot_url;
    const platforms: string[] | undefined = item.publisher_platforms;

    if (!body || !pageName) {
      continue;
    }

    results.push({
      source: "meta",
      platform: platforms?.join(", ") || "meta",
      advertiserName: pageName,
      title: title ?? null,
      text: body,
      url: snapshotUrl ?? null,
    });
  }

  return results;
}

async function fetchGoogleCompetitors(): Promise<NormalizedCompetitor[]> {
  // La API pública de Google Ads Transparency Center es limitada.
  // Dejamos el hook preparado para futura integración real.
  if (!env.GOOGLE_ADS_TRANSPARENCY_ENDPOINT) {
    return [];
  }

  // Placeholder: aquí iría la llamada real cuando se disponga de un endpoint estable.
  return [];
}

export async function findCompetitors(
  niche: string,
  keywords: string[],
): Promise<NormalizedCompetitor[]> {
  const [meta, google] = await Promise.all([
    fetchMetaCompetitors(niche, keywords),
    fetchGoogleCompetitors(),
  ]);

  const all = [...meta, ...google];

  // Normalización extra: limitar a máximo 5 resultados relevantes
  return all.slice(0, 5);
}

