"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const axios_1 = __importDefault(require("axios"));
const m3u8Parser = require("m3u8-parser");
const app = (0, express_1.default)();
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
app.listen(8080);
