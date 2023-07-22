"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const axios_1 = __importDefault(require("axios"));
const node_html_parser_1 = __importDefault(require("node-html-parser"));
const utils_1 = require("./utils");
const m3u8Parser = require("m3u8-parser");
const app = (0, express_1.default)();
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
async function parseSovetRomanticaPlaylists(playlistUrl) {
    const res = await axios_1.default.get(playlistUrl);
    const parser = new m3u8Parser.Parser();
    parser.push(res.data);
    parser.end();
    const url = new URL(playlistUrl);
    return parser.manifest.playlists.reduce((acc, { attributes, uri }) => ({
        ...acc,
        [`src_${attributes.RESOLUTION.height}`]: `${url.origin}${url.pathname
            .split("/")
            .slice(0, -1)
            .join("/")}/${uri}`,
    }), {});
}
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
// Not used in App anymore
app.get("/api/anime/vk-videos", async (req, res) => {
    return res.json({
        response: {
            items: [
                {
                    files: await parseVkPlaylists(req.query.playerUrl),
                },
            ],
        },
    });
});
app.get("/api/anime/sovetromantica-videos", async (req, res) => {
    const parsed = await parseSovetRomanticaPlaylists(req.query.playlistUrl);
    return res.json(parsed);
});
app.get("/api/anime/ok-videos", async (req, res) => {
    return res.json({
        tracks: await parseOkPlaylists(req.query.playerUrl),
    });
});
app.listen(8080);
