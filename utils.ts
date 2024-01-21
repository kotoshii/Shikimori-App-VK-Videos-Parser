const m3u8Parser = require("m3u8-parser");

type OkQuality = "mobile" | "lowest" | "low" | "sd" | "hd" | "full";
type ResQuality = "144" | "240" | "360" | "480" | "720" | "1080";

type OkResQualityMap = Record<OkQuality, ResQuality>;

export interface Track {
  quality: string;
  url: string;
}

const OkResQuality: OkResQualityMap = {
  mobile: "144",
  lowest: "240",
  low: "360",
  sd: "480",
  hd: "720",
  full: "1080",
};

export function getResByOkQualityName(okQuality: OkQuality): ResQuality {
  return OkResQuality[okQuality];
}

export function createPlaylistUrl(
  masterPlaylistUrl: string,
  fragmentUri: string,
) {
  const url = new URL(masterPlaylistUrl);
  url.pathname = url.pathname
    .split("/")
    .slice(0, -1)
    .concat(fragmentUri)
    .join("/");

  return url.href;
}

export function getPlaylistsFromManifest(
  manifest: any,
  masterPlaylistUrl?: string,
): Track[] {
  return (
    manifest?.playlists?.map(({ attributes, uri }) =>
      createTrack(
        attributes.RESOLUTION.height.toString(),
        masterPlaylistUrl ? createPlaylistUrl(masterPlaylistUrl, uri) : uri,
      ),
    ) || []
  );
}

export function getPlaylistManifest(masterPlaylistData: string) {
  const parser = new m3u8Parser.Parser();

  parser.push(masterPlaylistData);
  parser.end();

  return parser.manifest;
}

export function createTrack(quality: string, url: string): Track {
  return {
    quality,
    url,
  };
}

export function sortTracks(tracks: Track[]) {
  return tracks.sort((a, b) =>
    a.quality === "unknown" ? -1 : Number(b.quality) - Number(a.quality),
  );
}
