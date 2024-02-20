import puppeteer from 'puppeteer';
import { writeFile, SUPERMARKETS } from '../utils/index.js';
import { safeRequest } from '../scraping.js';
import { load } from 'cheerio';

const headers = {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:121.0) Gecko/20100101 Firefox/121.0',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.5',
    'Accept-Encoding': 'gzip, deflate, br',
    'Referer': 'https://jumbo.com.do/',
    'Connection': 'keep-alive',
    'Upgrade-Insecure-Requests': '1',
    'Sec-Fetch-Dest': 'document',
    'Sec-Fetch-Mode': 'navigate',
    'Sec-Fetch-Site': 'same-origin',
    'Sec-Fetch-User': '?1',
    'Pragma': 'no-cache',
    'Cache-Control': 'no-cache'
};


const fetchProductsCategories = async () => {
    try {
        // Fetch the HTML content of the webpage
        const response = await safeRequest({ url: SUPERMARKETS.JUMBO, headers });
        const html = response.data;
        // Load the HTML into Cheerio
        const $ = load(html);
        const routes_array = []
        // Query the DOM using Cheerio (similar to jQuery)

        console.log('> 1. Began fetching data from Jumbo');

        $('.top-nav__main .top-nav__links-list .nav-1 ul').contents().each((index, element) => {

            if (element.attribs.class.includes('level1') && !element.attribs.class.includes('submenu')) {

                routes_array.push({ label: $(element.children[0]).text(), routes: [] })

                $(element.children[1]).contents().contents().each((_i, tag) => {

                    if (tag.name === 'a') {

                        routes_array[index].routes.push({
                            label: $(tag).text(),
                            link: tag.attribs.href
                        })
                        // console.log(tag)
                    }
                })


            }

        });

        console.log('> 2. Prepared Product Category Routes');

        // Output the extracted information
        // console.log('First Product Info:', productInfo[0].children[1]);

        return routes_array;
    } catch (error) {
        console.error('Error fetching the webpage:', error);
    }
};

const produceProductsCatalogue = (html) => {

    const $ = load(html)
    const $items = $(".subcategory-tiles-list").children()
    const products = [];

    $items.each(function () {
        const image = $(this).find(".product-item-tile__img")[0].attribs.src;
        const url = $(this).find(".product-item-tile__name .product-item-tile__link")[0].attribs.href
        const name = $(this).find(".product-item-tile__name .product-item-tile__link").text();
        const price = $(this).find(`[data-price-type="finalPrice"]`).text().split('$')[1];
        products.push({ name, price, image, url });

    })

    return products;

};

(async () => {

    const jumboRoutes = await fetchProductsCategories();

    let catalogue = {};

    console.log('> 3. Started data fetch');

    console.time('>> Time Elapsed Fetching');

    for (const [index, parent] of jumboRoutes.entries()) {

        let category = parent.routes[0].link.split('/');

        console.log(`> 3.${index + 1} Started fetch for parent category ${parent.label}`);

        category = category[category.length - 1].split('.')[0];


        for (const route of parent.routes) {

            const url = route.link + '?product_list_limit=50';
            const response = await safeRequest({ url, headers });

            console.log(`>> Fetched for ${route.label} | Page 1`);

            const html = response.data;

            const products = produceProductsCatalogue(html);

            const $ = load(html);

            const article_count = $('.total_items').text().split(' ')[0];

            let page_count = article_count / 15;
            page_count = page_count > parseInt(page_count) ? parseInt(page_count) + 1 : parseInt(page_count);

            catalogue[category] = [];
            catalogue[category].push(...products);


            if (page_count > 1) {
                let page = 2;

                while (true) {
                    // console.log('CURRENT PAGE: ', page);

                    try {

                        console.time(`>> Fetched for ${route.label} | Page ${page}`);

                        const html = (await safeRequest({ url: url + `?product_list_limit=50&p=${page}`, headers })).data;

                        const products = produceProductsCatalogue(html);

                        console.timeEnd(`>> Fetched for ${route.label} | Page ${page}`);
                        catalogue[category].push(...products);

                        if (page === page_count) break;

                        page++;

                        await new Promise(resolve => setTimeout(resolve, 1000))


                    } catch (error) {
                        console.error("Cannot get data from", url.toString(), error);
                        break
                    }

                }
            }


            // if( article_count /)
            // console.log({ page_count })

        }
    }


    console.log(`> 4. Data fetching ended succesfully`);

    console.timeEnd('>> Time Elapsed Fetching')

    writeFile('jumbo', catalogue)


})()