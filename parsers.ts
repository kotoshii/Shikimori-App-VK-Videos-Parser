import axios from "axios";
import {
  createTrack,
  getPlaylistManifest,
  getPlaylistsFromManifest,
  getResByOkQualityName,
  sortTracks,
  Track,
} from "./utils";
import parse from "node-html-parser";

export async function parseSovetRomanticaPlaylists(playlistUrl: string) {
  try {
    const res = await axios.get<string>(playlistUrl);
    const manifest = getPlaylistManifest(res.data);

    return getPlaylistsFromManifest(manifest, playlistUrl).reduce(
      (acc, { quality, url }) => ({
        ...acc,
        [`src_${quality}`]: url,
      }),
      {},
    );
  } catch (e) {
    return {};
  }
}

export async function parseSovetRomanticaPlaylistsExample(
  masterPlaylistUrl: string,
): Promise<Track[]> {
  try {
    const masterPlaylistData = await axios.get<string>(masterPlaylistUrl);
    const manifest = getPlaylistManifest(masterPlaylistData.data);

    return sortTracks(getPlaylistsFromManifest(manifest, masterPlaylistUrl));
  } catch (e) {
    return [];
  }
}

// returns a list of Tracks: `[{quality: '1080', url: '...'}]`
async function parseDzenPlaylists(embedUrl: string): Promise<Track[]> {
  try {
    const htmlRes = await axios.get(embedUrl);
    const doc = parse(htmlRes.data);

    const playerDataStr = doc
      .querySelector("body script")
      ?.text?.trim()
      ?.replace("Dzen.player.init(", "")
      .replace(/\);$/, "");

    if (!playerDataStr) return [];

    const playerData = JSON.parse(playerDataStr);
    const masterPlaylistUrl = playerData?.data?.content?.streams?.find(
      ({ url }) => url.includes("master.m3u8"),
    )?.url;

    const masterPlaylistData = await axios.get(masterPlaylistUrl);
    const manifest = getPlaylistManifest(masterPlaylistData.data);

    return sortTracks(
      getPlaylistsFromManifest(manifest, masterPlaylistUrl).filter(
        ({ url }) => !url.includes("redundant"),
      ),
    );
  } catch (e) {
    return [];
  }
}

async function parseNuumPlaylists(embedUrl: string): Promise<Track[]> {
  try {
    const videoId = new URL(embedUrl).pathname
      .replace(/\/+$/, "")
      .split("/")
      .pop();

    const apiRes = await axios.get(
      `https://nuum.ru/api/v2/media-containers/${videoId}`,
    );

    const _findMediaMeta = ({ media_meta }) =>
      media_meta?.media_archive_url?.includes("master.m3u8");

    const masterPlaylistUrl = apiRes.data?.result?.media_container_streams
      ?.find(({ stream_media }) => stream_media?.find(_findMediaMeta))
      ?.stream_media?.find(_findMediaMeta)?.media_meta?.media_archive_url;

    const masterPlaylistData = await axios.get(masterPlaylistUrl);
    const manifest = getPlaylistManifest(masterPlaylistData.data);

    return sortTracks(getPlaylistsFromManifest(manifest));
  } catch (e) {
    return [];
  }
}

async function parseAllvideoPlaylists(embedUrl: string): Promise<Track[]> {
  try {
    const htmlRes = await axios.get(embedUrl);
    const doc = parse(htmlRes.data);

    const script = doc
      .querySelectorAll("script")
      .find(
        (el) =>
          el.innerText.includes("isMobile") && el.innerText.includes("file:"),
      );

    if (!script) return [];

    const match = script.innerText.match(/file:\"(.+)\"/);

    if (!match) return [];

    const tracks: Track[] = [];

    match[1].split(",").forEach((el) => {
      const match = el.match(/\[(\d+)p\](.+)/);
      if (match) {
        tracks.push(createTrack(match[1], match[2]));
      } else {
        tracks.push(createTrack("unknown", el));
      }
    });

    return sortTracks(tracks);
  } catch (e) {
    return [];
  }
}

async function parseAnimejoyPlaylists(embedUrl: string): Promise<Track[]> {
  try {
    const url = new URL(
      embedUrl.startsWith("http") ? embedUrl : `https:${embedUrl}`,
    );
    const links = url.searchParams.get("file")?.split(",") || [];

    const tracks: Track[] = links.map<Track>((el) => {
      const match = el.match(/\[(\d+)p\](.+)/);
      if (match) {
        return createTrack(match[1], match[2]);
      } else {
        return createTrack("unknown", el);
      }
    });

    return sortTracks(tracks);
  } catch (e) {
    return [];
  }
}

async function parseMyviPlaylists(embedUrl: string): Promise<Track[]> {
  const substringAfter = (original: string, delimiter: string) =>
    original.slice(original.indexOf(delimiter) + delimiter.length);

  const substringBefore = (original: string, delimiter: string) =>
    original.slice(0, original.indexOf(delimiter));

  try {
    const res = await axios.get(embedUrl);
    const doc = parse(res.data);
    const script = doc
      .querySelectorAll("script")
      .find((el) => el.innerText.includes('CreatePlayer("v'));

    if (!script) return [];

    const url = decodeURIComponent(
      substringBefore(
        substringAfter(script?.innerText.replace("\n", "").trim(), '"v='),
        "\\u0026tp=video",
      )
        .replace("%26", "&")
        .replace("%3a", ":")
        .replace("%2f", "/")
        .replace("%3f", "?")
        .replace("%3d", "="),
    );

    return [createTrack("unknown", url)];
  } catch (e) {
    return [];
  }
}

/* @deprecated */
export async function parseOkPlaylists(playerUrl: string) {
  const res = await axios.get<string>(playerUrl);
  const doc = parse(res.data);

  try {
    const links = JSON.parse(
      JSON.parse(
        doc
          .querySelector('[data-module="OKVideo"]')
          ?.getAttribute("data-options") as string,
      ).flashvars.metadata,
    ).videos;

    return links
      .map(({ name, url }) => createTrack(getResByOkQualityName(name), url))
      .reverse();
  } catch (e) {
    return [];
  }
}

/* @deprecated */
export async function parseVkPlaylists(playerUrl: string) {
  const res = await axios.get<string>(playerUrl);
  return res.data.split(",").reduce((acc, el) => {
    const matches = el.match(/^"url([0-9]+)":/);
    return matches
      ? {
          ...acc,
          [`mp4_${matches[1]}`]: decodeURI(
            el.replace(matches[0], "").slice(1, -1),
          ),
        }
      : acc;
  }, {});
}
