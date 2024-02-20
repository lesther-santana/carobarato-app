import { buildCatalog } from './scraping.js';
import dotenv from "dotenv";
import { writeFile } from './utils/index.js';
dotenv.config();




async function main() {
    const root_url = "https://supermercadosnacional.com/"
    console.log("Getting html from", root_url)
    console.time('execTime'); // Start timing with a label
    try {
        const catalog = await buildCatalog(root_url)
        console.log("Done!")
        report(catalog)



        if (process.env.ENV !== 'prod')
            writeFile('Nacional', catalog);

    } catch (error) {
        console.log(error)
    }
    console.timeEnd('execTime');
}


function report(catalog) {
    const endpointsCount = Object.keys(catalog).length
    let productCount = 0
    Object.values(catalog).forEach(value => {
        productCount = productCount + value.length
    })
    console.log(endpointsCount, "Endpoints scrapped")
    console.log(productCount, "Products found")
}


main()