import axios from 'axios';
import { writeFile, SUPERMARKETS, safeRequest } from '../utils/index.js';
import { load } from 'cheerio';
import url from 'url';

const headers = {
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
    "Accept-Encoding": "gzip, deflate, br",
    "Accept-Language": "en-US,en;q=0.5",
    "Connection": "keep-alive",
    "Host": "www.pricesmart.com",
    "Sec-Fetch-Dest": "document",
    "Sec-Fetch-Mode": "navigate",
    "Sec-Fetch-Site": "same-origin",
    "Sec-Fetch-User": "?1",
    "Upgrade-Insecure-Requests": "1",
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:123.0) Gecko/20100101 Firefox/123.0"
};




async function process(categoryURL, rootURL) {
    try {
        const response = await axios.get(categoryURL, {headers})
        const html = response.data  
        const $ = load(html)
        const $products = $('div.search-product-box')
        const products = []
        $products.each((i, element) => {
            const link = url.resolve(rootURL, $(element).find('a[id^="search-result"]').attr('href'));
            const image = $(element).find('img').attr('src');
            const name = $(element).find('p#product-name').text().trim();
            const price = $(element).find('strong#product-price').text().trim();
            const discount = null;
            const product = {name, link, image, price, discount}
            products.push(product)
        });       
        return products
    } catch (error) {
        console.log(error)
        return []
    }
}

async function main() {

    const rootURL = "https://www.pricesmart.com/site/do/es";

    console.log(">>> Scrapping from Pricesmart Starting");
    console.log(">>> Getting html from", rootURL);
    console.time('execTime');
    
    try {
        const response =  await axios.get(rootURL, headers)
        
        const $ = load(response.data);
        const links = $('a[href]:not([href=""]).categories-section-link');
        const catalog = {}

        for (const link of links) {
            const href = $(link).attr('href');
            catalog[href] = await process(url.resolve(rootURL, href), rootURL)
        }

        writeFile('pricesmart', catalog)

    } catch (error) {

        console.log(error)

    }
    console.log('>>> Done!')
    console.timeEnd('execTime');

}

main()