"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseVkPlaylists = exports.parseOkPlaylists = exports.parseSovetRomanticaPlaylistsExample = exports.parseSovetRomanticaPlaylists = void 0;
const axios_1 = __importDefault(require("axios"));
const utils_1 = require("./utils");
const node_html_parser_1 = __importDefault(require("node-html-parser"));
async function parseSovetRomanticaPlaylists(playlistUrl) {
    try {
        const res = await axios_1.default.get(playlistUrl);
        const manifest = (0, utils_1.getPlaylistManifest)(res.data);
        return (0, utils_1.getPlaylistsFromManifest)(manifest, playlistUrl).reduce((acc, { quality, url }) => ({
            ...acc,
            [`src_${quality}`]: url,
        }), {});
    }
    catch (e) {
        return {};
    }
}
exports.parseSovetRomanticaPlaylists = parseSovetRomanticaPlaylists;
async function parseSovetRomanticaPlaylistsExample(masterPlaylistUrl) {
    try {
        const masterPlaylistData = await axios_1.default.get(masterPlaylistUrl);
        const manifest = (0, utils_1.getPlaylistManifest)(masterPlaylistData.data);
        return (0, utils_1.sortTracks)((0, utils_1.getPlaylistsFromManifest)(manifest, masterPlaylistUrl));
    }
    catch (e) {
        return [];
    }
}
exports.parseSovetRomanticaPlaylistsExample = parseSovetRomanticaPlaylistsExample;
// returns a list of Tracks: `[{quality: '1080', url: '...'}]`
async function parseDzenPlaylists(embedUrl) {
    try {
        const htmlRes = await axios_1.default.get(embedUrl);
        const doc = (0, node_html_parser_1.default)(htmlRes.data);
        const playerDataStr = doc
            .querySelector("body script")
            ?.text?.trim()
            ?.replace("Dzen.player.init(", "")
            .replace(/\);$/, "");
        if (!playerDataStr)
            return [];
        const playerData = JSON.parse(playerDataStr);
        const masterPlaylistUrl = playerData?.data?.content?.streams?.find(({ url }) => url.includes("master.m3u8"))?.url;
        const masterPlaylistData = await axios_1.default.get(masterPlaylistUrl);
        const manifest = (0, utils_1.getPlaylistManifest)(masterPlaylistData.data);
        return (0, utils_1.sortTracks)((0, utils_1.getPlaylistsFromManifest)(manifest, masterPlaylistUrl).filter(({ url }) => !url.includes("redundant")));
    }
    catch (e) {
        return [];
    }
}
async function parseNuumPlaylists(embedUrl) {
    try {
        const videoId = new URL(embedUrl).pathname
            .replace(/\/+$/, "")
            .split("/")
            .pop();
        const apiRes = await axios_1.default.get(`https://nuum.ru/api/v2/media-containers/${videoId}`);
        const _findMediaMeta = ({ media_meta }) => media_meta?.media_archive_url?.includes("master.m3u8");
        const masterPlaylistUrl = apiRes.data?.result?.media_container_streams
            ?.find(({ stream_media }) => stream_media?.find(_findMediaMeta))
            ?.stream_media?.find(_findMediaMeta)?.media_meta?.media_archive_url;
        const masterPlaylistData = await axios_1.default.get(masterPlaylistUrl);
        const manifest = (0, utils_1.getPlaylistManifest)(masterPlaylistData.data);
        return (0, utils_1.sortTracks)((0, utils_1.getPlaylistsFromManifest)(manifest));
    }
    catch (e) {
        return [];
    }
}
async function parseAllvideoPlaylists(embedUrl) {
    try {
        const htmlRes = await axios_1.default.get(embedUrl);
        const doc = (0, node_html_parser_1.default)(htmlRes.data);
        const script = doc
            .querySelectorAll("script")
            .find((el) => el.innerText.includes("isMobile") && el.innerText.includes("file:"));
        if (!script)
            return [];
        const match = script.innerText.match(/file:\"(.+)\"/);
        if (!match)
            return [];
        const tracks = [];
        match[1].split(",").forEach((el) => {
            const match = el.match(/\[(\d+)p\](.+)/);
            if (match) {
                tracks.push((0, utils_1.createTrack)(match[1], match[2]));
            }
            else {
                tracks.push((0, utils_1.createTrack)(utils_1.UNKNOWN_QUALITY, el));
            }
        });
        return (0, utils_1.sortTracks)(tracks);
    }
    catch (e) {
        return [];
    }
}
async function parseAnimejoyPlaylists(embedUrl) {
    try {
        const url = new URL(embedUrl.startsWith("http") ? embedUrl : `https:${embedUrl}`);
        const links = url.searchParams.get("file")?.split(",") || [];
        const tracks = links.map((el) => {
            const match = el.match(/\[(\d+)p\](.+)/);
            if (match) {
                return (0, utils_1.createTrack)(match[1], match[2]);
            }
            else {
                return (0, utils_1.createTrack)(utils_1.UNKNOWN_QUALITY, el);
            }
        });
        return (0, utils_1.sortTracks)(tracks);
    }
    catch (e) {
        return [];
    }
}
async function parseMyviPlaylists(embedUrl) {
    const substringAfter = (original, delimiter) => original.slice(original.indexOf(delimiter) + delimiter.length);
    const substringBefore = (original, delimiter) => original.slice(0, original.indexOf(delimiter));
    try {
        const res = await axios_1.default.get(embedUrl);
        const doc = (0, node_html_parser_1.default)(res.data);
        const script = doc
            .querySelectorAll("script")
            .find((el) => el.innerText.includes('CreatePlayer("v'));
        if (!script)
            return [];
        const url = decodeURIComponent(substringBefore(substringAfter(script?.innerText.replace("\n", "").trim(), '"v='), "\\u0026tp=video")
            .replace("%26", "&")
            .replace("%3a", ":")
            .replace("%2f", "/")
            .replace("%3f", "?")
            .replace("%3d", "="));
        return [(0, utils_1.createTrack)(utils_1.UNKNOWN_QUALITY, url)];
    }
    catch (e) {
        return [];
    }
}
/* @deprecated */
async function parseOkPlaylists(playerUrl) {
    const res = await axios_1.default.get(playerUrl);
    const doc = (0, node_html_parser_1.default)(res.data);
    try {
        const links = JSON.parse(JSON.parse(doc
            .querySelector('[data-module="OKVideo"]')
            ?.getAttribute("data-options")).flashvars.metadata).videos;
        return links
            .map(({ name, url }) => (0, utils_1.createTrack)((0, utils_1.getResByOkQualityName)(name), url))
            .reverse();
    }
    catch (e) {
        return [];
    }
}
exports.parseOkPlaylists = parseOkPlaylists;
/* @deprecated */
async function parseVkPlaylists(playerUrl) {
    const res = await axios_1.default.get(playerUrl);
    return res.data.split(",").reduce((acc, el) => {
        const matches = el.match(/^"url([0-9]+)":/);
        return matches
            ? {
                ...acc,
                [`mp4_${matches[1]}`]: decodeURI(el.replace(matches[0], "").slice(1, -1)),
            }
            : acc;
    }, {});
}
exports.parseVkPlaylists = parseVkPlaylists;
