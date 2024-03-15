import fs from 'fs';
import path from 'path';
import dotenv from "dotenv";
import axios from 'axios';

dotenv.config();

const projectRoot = process.cwd();

export const SUPERMARKETS = {
    SIRENA: 'https://sirena.do/',
    JUMBO: `https://jumbo.com.do/`
}

export const writeFile = (supermarket = 'Nacional', data) => {
    const filepath = path.join(projectRoot, 'files', supermarket + '.json');

    // Check if the directory exists, if not create it
    if (!fs.existsSync("files")){
        fs.mkdirSync("files", { recursive: true });
    }

    if (fs.existsSync(filepath)) {
        fs.unlink(filepath, error => {
            if (error) {
                console.error(`Error deleting file for: ${supermarket}`, error);
                return;
            }
            console.log('>>>> File deleted for ', supermarket);
            writeNewFile(filepath, data, supermarket);
        });
    } else {
        writeNewFile(filepath, data, supermarket);
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

export async function safeRequest( url, retries = 3, delay = 1000, headers = {} ) {
    let lastError;
    for (let i = 0; i < retries; i++) {
        try {
            return await axios.get(url, { headers });
        } catch (error) {
            lastError = error
            if (error.code === 'ECONNRESET') {
                //console.log(`Attempt ${i + 1}: Connection reset. Retrying...`);
                await new Promise(resolve => setTimeout(resolve, delay))
            }
        }
    }
    throw lastError
};