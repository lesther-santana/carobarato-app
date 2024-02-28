import * as cheerio from 'cheerio'
import axios from 'axios';
import dotenv from "dotenv";

dotenv.config();

const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:123.0) Gecko/20100101 Firefox/123.0',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.5',
    'Accept-Encoding': 'gzip, deflate, br',
    'Connection': 'keep-alive',
    'Upgrade-Insecure-Requests': '1',
    'Sec-Fetch-Dest': 'document',
    'Sec-Fetch-Mode': 'navigate',
    'Sec-Fetch-Site': 'same-origin',
    'Pragma': 'no-cache',
    'Cache-Control': 'no-cache'
};


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
            if (process.env.ENV !== 'prod') {
                break
            }

        } catch (error) {
            console.error("Cannot get data from", url.toString(), error);
            break
        }
    }
    console.log(url.pathname, "Items=", totalItems, "Items found=", products.length)
    return products
}


export async function safeRequest({ url, retries = 3, delay = 1000, headers = {} }) {
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