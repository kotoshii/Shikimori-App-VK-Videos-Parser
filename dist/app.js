"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const parsers_1 = require("./parsers");
const app = (0, express_1.default)();
// Not used in App anymore
app.get("/api/anime/vk-videos", async (req, res) => {
    return res.json({
        response: {
            items: [
                {
                    files: await (0, parsers_1.parseVkPlaylists)(req.query.playerUrl),
                },
            ],
        },
    });
});
app.get("/api/anime/sovetromantica-videos", async (req, res) => {
    const parsed = await (0, parsers_1.parseSovetRomanticaPlaylists)(req.query.playlistUrl);
    return res.json(parsed);
});
// Not used in App anymore
app.get("/api/anime/ok-videos", async (req, res) => {
    return res.json({
        tracks: await (0, parsers_1.parseOkPlaylists)(req.query.playerUrl),
    });
});
app.listen(8080, () => console.log("Started on port 8080"));
