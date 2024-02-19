import fs from 'fs';
import path from 'path';
import dotenv from "dotenv";

dotenv.config();

const projectRoot = process.cwd();


export const writeFile = (supermarket = 'Nacional', report) => {

    const filepath = path.join(projectRoot, 'files', supermarket + '.json');

    fs.writeFile(filepath, JSON.stringify(report), error => {

        if (error) {
            console.error(`Error Writting file for: ${supermarket}`, error)
            return;
        }

        console.log('>>>> END: Wrote file for ', supermarket)

    })

}
