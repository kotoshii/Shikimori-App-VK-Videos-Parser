import axios from "axios";
import {
  getPlaylistManifest,
  getPlaylistsFromManifest,
  getResByOkQualityName,
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
) {
  try {
    const masterPlaylistData = await axios.get<string>(masterPlaylistUrl);
    const manifest = getPlaylistManifest(masterPlaylistData.data);

    return getPlaylistsFromManifest(manifest, masterPlaylistUrl).reverse();
  } catch (e) {
    return [];
  }
}

// returns a list of Tracks: `[{quality: '1080', url: '...'}]`
async function parseDzenPlaylists(embedUrl: string) {
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

    return getPlaylistsFromManifest(manifest, masterPlaylistUrl)
      .filter(({ url }) => !url.includes("redundant"))
      .reverse();
  } catch (e) {
    return [];
  }
}

async function parseNuumPlaylists(embedUrl: string) {
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

    return getPlaylistsFromManifest(manifest).reverse();
  } catch (e) {
    return [];
  }
}

async function parseAllvideoPlaylists(embedUrl: string) {
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

    const tracks = [];

    match[1].split(",").forEach((el) => {
      const match = el.match(/\[(\d+)p\](.+)/);
      if (match) {
        // @ts-ignore
        tracks.push({
          quality: match[1],
          url: match[2],
        });
      } else {
        // @ts-ignore
        tracks.push({
          quality: "unknown",
          url: el,
        });
      }
    });

    return tracks.reverse();
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
      .map(({ name, url }) => ({
        quality: getResByOkQualityName(name),
        url,
      }))
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
