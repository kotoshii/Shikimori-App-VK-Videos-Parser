type OkQuality = "mobile" | "lowest" | "low" | "sd" | "hd" | "full";
type ResQuality = "144" | "240" | "360" | "480" | "720" | "1080";

type OkResQualityMap = Record<OkQuality, ResQuality>;

const OkResQuality: OkResQualityMap = {
  mobile: "144",
  lowest: "240",
  low: "360",
  sd: "480",
  hd: "720",
  full: "1080",
};

export function getResByOkQualityName(okQuality: OkQuality): ResQuality {
  return OkResQuality[okQuality];
}
