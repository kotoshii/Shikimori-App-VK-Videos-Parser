"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPlaylistManifest = exports.getPlaylistsFromManifest = exports.createPlaylistUrl = exports.getResByOkQualityName = void 0;
const m3u8Parser = require("m3u8-parser");
const OkResQuality = {
    mobile: "144",
    lowest: "240",
    low: "360",
    sd: "480",
    hd: "720",
    full: "1080",
};
function getResByOkQualityName(okQuality) {
    return OkResQuality[okQuality];
}
exports.getResByOkQualityName = getResByOkQualityName;
function createPlaylistUrl(masterPlaylistUrl, fragmentUri) {
    const url = new URL(masterPlaylistUrl);
    url.pathname = url.pathname
        .split("/")
        .slice(0, -1)
        .concat(fragmentUri)
        .join("/");
    return url.href;
}
exports.createPlaylistUrl = createPlaylistUrl;
function getPlaylistsFromManifest(manifest, masterPlaylistUrl) {
    return (manifest?.playlists?.map(({ attributes, uri }) => ({
        quality: attributes.RESOLUTION.height.toString(),
        url: masterPlaylistUrl ? createPlaylistUrl(masterPlaylistUrl, uri) : uri,
    })) || []);
}
exports.getPlaylistsFromManifest = getPlaylistsFromManifest;
function getPlaylistManifest(masterPlaylistData) {
    const parser = new m3u8Parser.Parser();
    parser.push(masterPlaylistData);
    parser.end();
    return parser.manifest;
}
exports.getPlaylistManifest = getPlaylistManifest;
