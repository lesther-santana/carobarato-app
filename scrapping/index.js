import { load } from 'cheerio';
import axios from 'axios';
import puppeteer from 'puppeteer';
import { safeRequest } from '../scraping.js';
import { writeFile } from '../utils/index.js';

const SIRENA = 'https://sirena.do/';

const fetchWithPuppeteer = async () => {

    try {

        const PAGE_QUERY = `?limit=30&sort=1`;
        const browser = await puppeteer.launch({ headless: true });
        const page = await browser.newPage();
        await page.goto(SIRENA, { waitUntil: 'domcontentloaded' });
        // Perform scraping actions here

        let sirenaDictionary = {};

        console.log('> 1. Began fetching data from La Sirena');
        console.time('>> Time Elapsed Fetching')
        const getLinks = async (selector, item_type = 'category') => {

            if (item_type === 'category') {
                return await page.evaluate((selector) => {

                    let elements = Array.from(document.body.querySelectorAll(selector), (el) => ({ link: el.href, label: el.innerText }));
                    return elements

                }, selector)
            }

            return [];

        }

        await page.waitForSelector(`.uk-section h2`);

        const links = await getLinks(`#uk-slider-1 > li:not(:nth-child(4), :nth-child(5), :nth-child(6), :nth-child(7)) ul li:not(.uk-nav-header) a`);

        for (const [index, item] of links.entries()) {

            console.log(`> 2.${index + 1} Fetching for Category ${item.label}`);
            await page.goto(`${item.link}${PAGE_QUERY}&page=1`, { waitUntil: 'domcontentloaded' });
            try {
                // Wait for the selector with a specific timeout (e.g., 5 seconds).
                await page.waitForSelector('.subcat-nav.uk-margin-medium-top .uk-slider .uk-slider-items', { timeout: 3000 });

                const subcategories = await getLinks(`.subcat-nav.uk-margin-medium-top .uk-slider .uk-slider-items li a`)

                if (subcategories.length > 0) {

                    for (const category of subcategories) {

                        console.log(`>> Fetching for Category ${category.label}`);

                        const category_data = { category: item.label, subcategory: category.label };

                        let product_data = [];

                        await page.goto(`${category.link}${PAGE_QUERY}&page=1`, { waitUntil: 'domcontentloaded' });

                        async function collectProductsInformation() {


                            await page.waitForSelector(`.uk-grid.uk-grid-small.uk-grid-match.grid-products .item-product .item-product-title`)

                            const links = await page.evaluate(($category_data) => {

                                const elements = Array.from([...document.body.querySelectorAll('.uk-grid.uk-grid-small.uk-grid-match.grid-products .item-product')], el => {

                                    const link = el.children[1].href;
                                    const image = el.children[1].outerHTML.split('&quot;')[1];
                                    const title = el.children[2].children[0].innerText;
                                    const price = el.children[2].children[1].innerText.substring(1);


                                    return { link, image, title, price, ...$category_data }
                                });

                                return elements

                            }, category_data)

                            product_data = [...product_data, ...links]

                            const nextPageButton = await page.$(`a[aria-label="Next page"]`);
                            if (nextPageButton) {
                                await nextPageButton.click();
                                await page.waitForNavigation({ waitUntil: 'networkidle0' });
                                await collectProductsInformation();
                            }


                        }

                        await collectProductsInformation();

                        const slug = category.link.substring(35);

                        sirenaDictionary[slug] = product_data;

                    }
                }



            } catch (error) {
                console.log('>>>> Selector not found, continuing with other tasks: ', item.label);
            }


            await new Promise(resolve => setTimeout(resolve, 2000))

        }

        await browser.close();

        console.timeEnd('>> Time Elapsed Fetching')
        console.log('>>> Finished fetching data from La Sirena');

        await writeFile('la-sirena', sirenaDictionary)


    } catch (error) {

        console.log(error)
    }
};


fetchWithPuppeteer()


//     console.log('La Sirena Page title:', pageTitle);

//     await browser.close();
// })();
// (async () => {
//     const browser = await puppeteer.launch({ headless: true });
//     const page = await browser.newPage();
//     await page.goto('https://jumbo.com.do/supermercado/lacteos-y-huevos/lacteos.html', { waitUntil: 'domcontentloaded' });
//     // Perform scraping actions here

//     await page.waitForSelector('.tiles-list');

//     const firstItemData = await page.evaluate(() => {
//         const query = document.querySelectorAll('.tiles-list .product-item-info');
//         if (query.length > 0) {
//             // Extract and return the data you need from the element
//             return query[0].textContent; // Example: return the text content
//         }
//         return null;
//     });

//     console.log('First item data:', firstItemData);

//     await browser.close();
// })();


// (async () => {
//     try {

//         const headers = {
//             'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:121.0) Gecko/20100101 Firefox/121.0',
//             'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
//             'Accept-Language': 'en-US,en;q=0.5',
//             'Accept-Encoding': 'gzip, deflate, br',
//             'Referer': 'https://jumbo.com.do/',
//             'Connection': 'keep-alive',
//             'Upgrade-Insecure-Requests': '1',
//             'Sec-Fetch-Dest': 'document',
//             'Sec-Fetch-Mode': 'navigate',
//             'Sec-Fetch-Site': 'same-origin',
//             'Sec-Fetch-User': '?1',
//             'Pragma': 'no-cache',
//             'Cache-Control': 'no-cache'
//         };


//         // Fetch the HTML content of the webpage
//         const response = await axios.get('https://jumbo.com.do/supermercado/lacteos-y-huevos/lacteos.html', {
//             headers
//         });
//         const html = response.data;

//         // Load the HTML into Cheerio
//         const $ = cheerio.load(html);

//         // Query the DOM using Cheerio (similar to jQuery)
//         const productInfo = $('.tiles-list .product-item-info').first().text();

//         // Output the extracted information
//         console.log('First Product Info:', productInfo.trim());
//     } catch (error) {
//         console.error('Error fetching the webpage:', error);
//     }
// })();