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
    const res = await axios_1.default.get(playlistUrl);
    const manifest = (0, utils_1.getPlaylistManifest)(res.data);
    return (0, utils_1.getPlaylistsFromManifest)(manifest, playlistUrl).reduce((acc, { quality, url }) => ({
        ...acc,
        [`src_${quality}`]: url,
    }), {});
}
exports.parseSovetRomanticaPlaylists = parseSovetRomanticaPlaylists;
async function parseSovetRomanticaPlaylistsExample(masterPlaylistUrl) {
    try {
        const res = await axios_1.default.get(masterPlaylistUrl);
        const manifest = (0, utils_1.getPlaylistManifest)(res.data);
        return (0, utils_1.getPlaylistsFromManifest)(manifest, masterPlaylistUrl).reverse();
    }
    catch (e) {
        return [];
    }
}
exports.parseSovetRomanticaPlaylistsExample = parseSovetRomanticaPlaylistsExample;
// returns a list of Tracks: `[{quality: '1080', url: '...'}]`
async function parseDzenStreams(embedUrl) {
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
        return (0, utils_1.getPlaylistsFromManifest)(manifest, masterPlaylistUrl)
            .filter(({ url }) => !url.includes("redundant"))
            .reverse();
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
            .map(({ name, url }) => ({
            quality: (0, utils_1.getResByOkQualityName)(name),
            url,
        }))
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
