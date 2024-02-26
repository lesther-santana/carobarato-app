import fs from 'fs';
import path from 'path';
import dotenv from "dotenv";

dotenv.config();

const projectRoot = process.cwd();

export const SUPERMARKETS = {
    SIRENA: 'https://sirena.do/',
    JUMBO: `https://jumbo.com.do/`
}

export const writeFile = (supermarket = 'Nacional', report) => {
    const filepath = path.join(projectRoot, 'files', supermarket + '.json');

    // Check if the file exists
    if (fs.existsSync(filepath)) {
        // If it exists, delete the file
        fs.unlinkSync(filepath);
        console.log(`Deleted old file for: ${supermarket}`);
    }

    // Now write the new file
    fs.writeFile(filepath, JSON.stringify(report, null, 2), error => {
        if (error) {
            console.error(`Error Writing file for: ${supermarket}`, error);
            return;
        }
        console.log('>>>> END: Wrote file for ', supermarket);
    });
};
