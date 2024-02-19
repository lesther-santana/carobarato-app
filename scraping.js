import * as cheerio from 'cheerio'
import axios from 'axios';
import dotenv from "dotenv";

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
            const html = (await safeRequest(url)).data
            const $ = cheerio.load(html)
            const totalItemsText = $(".toolbar-number").text()
            totalItems = totalItemsText ? parseInt(totalItemsText) : 0
            const $items = $("ol.products").children()

            if ($items.length === 0 || products.length === totalItems) {
                break
            }

            $items.each(function () {
                const image = $(this).find(".product-image-container .product-image-photo")[0].attribs.src;
                const brand = $(this).find(".product-brand").text().trim();
                const name = $(this).find(".product.name").text().trim();
                const price = $(this).find("span.price").text().trim().slice(1);

                products.push({ name, price, image, brand });

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

export async function safeRequest(url, retries = 3, delay = 1000) {
    let lastError;
    for (let i = 0; i < retries; i++) {
        try {
            return await axios.get(url);
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