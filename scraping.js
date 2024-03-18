import * as cheerio from 'cheerio'
import axios from 'axios';
import dotenv from "dotenv";
import puppeteer from 'puppeteer';
dotenv.config();

function getEndpoints($) {
    const links = []
    const $ahrefs = $("li.level2 a")

    $ahrefs.each(function () {
        const href = $(this).attr('href')
        links.push(href)
    })
    return links
}

async function parseEndpoint(endpoint) {
    let totalItems
    const products = []
    let p = 1
    let url = new URL(endpoint)
    while (true) {
        url.searchParams.set("p", p)
        try {
            const html = (await safeRequest({ url: url.toString(), headers })).data
            const $ = cheerio.load(html)
            const totalItemsText = $(".toolbar-number").text()
            totalItems = totalItemsText ? parseInt(totalItemsText) : 0
            const $items = $("ol.products").children()

            if ($items.length === 0 || products.length === totalItems) {
                break
            }

            $items.each(function () {
                const category = $('.page-title-wrapper').find(".page-title").text().trim();
                const image = $(this).find(".product-image-container .product-image-photo")[0].attribs.src;
                const brand = $(this).find(".product-brand").text().trim();
                const name = $(this).find(".product.name").text().trim();
                const prices = $(this).find("span.price")
                const slug = url.pathname.toString()
                let discount = null
                let price = null

                if (prices.length > 1) {
                    discount = $(this).find("span.special-price .price").text().trim().slice(1);
                    price = $(this).find("span.old-price .price").text().trim().slice(1);
                } else {
                    price = $(this).find("span.price").text().trim().slice(1);
                }

                const link = $(this).find(".product-item-link").attr('href');

                products.push({ name, price, discount, image, brand, link, category, slug });

            })

            // Update url params
            p++

            // Loops only once for Development purposes. Disable if needed
            // if (process.env.ENV !== 'prod') {
            //     break
            // }

        } catch (error) {
            console.error("Cannot get data from", url.toString(), error);
            break
        }
    }
    console.log(url.pathname, "Items=", totalItems, "Items found=", products.length)
    return products
}


export async function safeRequest({ url, retries = 3, delay = 2000, proxies }) {
    let lastError;
    for (let i = 0; i < retries; i++) {
        try {

            let randomIndex = Math.floor(Math.random() * proxies.ip_addresses.length);
            const ip = proxies.ip_addresses[randomIndex];
            randomIndex = Math.floor(Math.random() * proxies.port_numbers.length);
            const port_number = proxies.port_numbers[randomIndex];


            const proxy = `--proxy-server=${ip}:${port_number}`;

            console.log({ proxy })
            // return await axios.get(url, { headers, proxy: proxyConfig });
            const browser = await puppeteer.launch({
                // args: [proxy],
                headless: false // Set false if you want to see the browser
            });

            const page = await browser.newPage();

            await page.setExtraHTTPHeaders({
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.5'
            });

            // Navigate to the URL
            const response = await page.goto(url, { waitUntil: 'networkidle2' });

            if (response.status() === 200) {
                const content = await page.content();
                await browser.close();
                return content;
            } else {
                throw new Error(`Request failed with status ${response.status()}`);
            }
        } catch (error) {
            lastError = error
            if (error.code === 'ECONNRESET') {
                //console.log(`Attempt ${i + 1}: Connection reset. Retrying...`);
                await new Promise(resolve => setTimeout(resolve, delay))
            }
        }
    }
    throw lastError
}

export async function buildCatalog(rootURL) {
    let catalog = {}
    const html = (await axios.get(rootURL)).data
    const $ = cheerio.load(html)
    const endpoints = getEndpoints($)
    const productPromises = endpoints.map(url => parseEndpoint(url))
    const products = await Promise.all(productPromises)
    endpoints.forEach((url, i) => {
        catalog[url.split('.com')[1]] = products[i]
    })
    return catalog
}