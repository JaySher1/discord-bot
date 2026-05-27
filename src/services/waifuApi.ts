import { containsBlockedNsfwTerm } from "./nsfwSafety.js";

export type WaifuImage = {
  id: string;
  provider: "waifu.im";
  providerId: string;
  url: string;
  source?: string;
  tags: string[];
  width?: number;
  height?: number;
  isNsfw: boolean;
};

type WaifuImTag = {
  name?: string;
  slug?: string;
};

type WaifuImImage = {
  id: number;
  url: string;
  source?: string | null;
  tags?: WaifuImTag[];
  width?: number;
  height?: number;
  isNsfw?: boolean;
};

type WaifuImResponse = {
  items?: WaifuImImage[];
};

const excludedTags = [
  "loli",
  "shota",
  "maid",
  "uniform"
];

function buildWaifuUrl(): string {
  const url = new URL("https://api.waifu.im/images");
  url.searchParams.append("IncludedTags", "waifu");
  url.searchParams.set("IsNsfw", "True");
  url.searchParams.set("PageSize", "1");

  for (const tag of excludedTags) {
    url.searchParams.append("ExcludedTags", tag);
  }

  return url.toString();
}

function mapImage(image: WaifuImImage): WaifuImage | null {
  const tags = (image.tags ?? [])
    .map((tag) => tag.slug ?? tag.name ?? "")
    .filter(Boolean);
  const combinedSafetyText = [image.source ?? "", ...tags].join(" ");

  if (!image.isNsfw || containsBlockedNsfwTerm(combinedSafetyText)) {
    return null;
  }

  return {
    id: `waifuim-${image.id}`,
    provider: "waifu.im",
    providerId: String(image.id),
    url: image.url,
    source: image.source ?? undefined,
    tags,
    width: image.width,
    height: image.height,
    isNsfw: image.isNsfw ?? false
  };
}

export async function fetchAdultWaifu(): Promise<WaifuImage> {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const response = await fetch(buildWaifuUrl(), {
      headers: {
        Accept: "application/json",
        "User-Agent": "ServerCommandDiscordBot/1.0"
      }
    });

    if (!response.ok) {
      throw new Error(`Waifu.im returned HTTP ${response.status}`);
    }

    const data = (await response.json()) as WaifuImResponse;
    const image = data.items?.map(mapImage).find(Boolean);

    if (image) {
      return image;
    }
  }

  throw new Error("Waifu.im did not return a safe adult waifu after filtering.");
}
