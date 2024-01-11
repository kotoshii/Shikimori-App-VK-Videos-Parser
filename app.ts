import express from "express";
import {
  parseOkPlaylists,
  parseSovetRomanticaPlaylists,
  parseVkPlaylists,
} from "./parsers";

const app = express();

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

app.listen(8080, () => console.log("Started on port 8080"));
