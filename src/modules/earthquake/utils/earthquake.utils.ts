import sharp from "sharp";
import {getStorageService} from "../../../index";
import fs from "fs";

export class EarthquakeUtils {
    static getColorByMagnitude = (magnitude: number) => {
        if (magnitude < 4) {
            return 'green';
        } else if (magnitude >= 4 && magnitude < 5) {
            return 'yellow';
        } else if (magnitude >= 5 && magnitude < 7) {
            return 'orange';
        } else {
            return 'red';
        }
    }

    static getBadge = async (magnitude: number) => {
        const fileName = `badge-magnitude-${magnitude.toFixed(1)}.png`;

        if(await getStorageService().hasFileInStorageBucket(fileName, "badges")) {
            return `https://storage.googleapis.com/quakely/badges/${fileName}`;
        } else {
            const color = EarthquakeUtils.getColorByMagnitude(magnitude);
            const text = magnitude.toFixed(1);

            const svg = `
                <svg width="90" height="50" xmlns="http://www.w3.org/2000/svg">
                  <rect x="10" y="10" width="60" height="30" rx="10" ry="10" style="fill:white;" />
                  <text x="40" y="30" font-family="Arial" font-weight="bold" font-size="14" fill="${color}" text-anchor="middle">M${text}</text>
                </svg>
            `;

            const buffer = await sharp(Buffer.from(svg))
                .png()
                .toBuffer();

            const tempFilePath = `tmp/${fileName}`;
            fs.writeFileSync(tempFilePath, buffer);

            return await getStorageService().uploadFileToStorageBucket(tempFilePath, fileName, "badges");
        }
    }
}
