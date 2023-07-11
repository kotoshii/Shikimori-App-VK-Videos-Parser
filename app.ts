import express from "express";
import axios from "axios";
const m3u8Parser = require("m3u8-parser");

const app = express();

async function parseVkPlaylists(playerUrl: string) {
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

async function parseSovetRomanticaPlaylists(playlistUrl: string) {
  const res = await axios.get<string>(playlistUrl);
  const parser = new m3u8Parser.Parser();

  parser.push(res.data);
  parser.end();

  const url = new URL(playlistUrl);

  return parser.manifest.playlists.reduce(
    (acc, { attributes, uri }) => ({
      ...acc,
      [`src_${attributes.RESOLUTION.height}`]: `${url.origin}${url.pathname
        .split("/")
        .slice(0, -1)
        .join("/")}/${uri}`,
    }),
    {},
  );
}

app.get("/api/anime/vk-videos", async (req, res) => {
  return res.json({
    response: {
      items: [
        {
          files: await parseVkPlaylists(req.query.playerUrl as string),
        },
      ],
    },
  });
});

app.get("/api/anime/sovetromantica-videos", async (req, res) => {
  const parsed = await parseSovetRomanticaPlaylists(
    req.query.playlistUrl as string,
  );
  return res.json(parsed);
});

app.listen(8080);
