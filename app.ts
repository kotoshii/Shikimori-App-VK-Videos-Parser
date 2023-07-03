import express from 'express';
import axios from 'axios';

const app = express();

async function parsePlayists(playerUrl: string) {
    const res = await axios.get<string>(playerUrl);
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
                files: await parsePlayists(req.query.playerUrl as string)
            }]
        }
    })
})

app.listen(8080)