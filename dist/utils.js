"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getResByOkQualityName = void 0;
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
