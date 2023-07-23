import express from "express";
import axios from "axios";
import parse from "node-html-parser";
import { getResByOkQualityName } from "./utils";
const m3u8Parser = require("m3u8-parser");

const app = express();

/* @deprecated */
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

/* @deprecated */
async function parseOkPlaylists(playerUrl: string) {
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

// Not used in App anymore
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

// Not used in App anymore
app.get("/api/anime/ok-videos", async (req, res) => {
  return res.json({
    tracks: await parseOkPlaylists(req.query.playerUrl as string),
  });
});

app.listen(8080);
