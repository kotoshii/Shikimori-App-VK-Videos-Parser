"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const axios_1 = __importDefault(require("axios"));
const app = (0, express_1.default)();
async function parsePlayists(playerUrl) {
    const res = await axios_1.default.get(playerUrl);
    const playlists = res.data.split(',').reduce((acc, el) => {
        const matches = el.match(/^"url([0-9]+)":/);
        return matches ? { ...acc, [`mp4_${matches[1]}`]: decodeURI(el.replace(matches[0], '').slice(1, -1)) } : acc;
    }, {});
    return playlists;
}
app.get('/api/anime/vk-videos', async (req, res) => {
    return res.json({
        response: {
            items: [{
                    files: await parsePlayists(req.query.playerUrl)
                }]
        }
    });
});
app.listen(8080);
