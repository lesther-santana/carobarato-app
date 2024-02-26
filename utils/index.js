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

    if (fs.existsSync(filepath)) {
        fs.unlink(filepath, error => {
            if (error) {
                console.error(`Error deleting file for: ${supermarket}`, error);
                return;
            }
            console.log('>>>> File deleted for ', supermarket);
            writeNewFile(filepath, report, supermarket);
        });
    } else {
        writeNewFile(filepath, report, supermarket);
    }
};

const writeNewFile = (filepath, report, supermarket) => {
    fs.writeFile(filepath, JSON.stringify(report), error => {
        if (error) {
            console.error(`Error writing file for: ${supermarket}`, error);
            return;
        }
        console.log('>>>> END: Wrote file for ', supermarket);
    });
};

