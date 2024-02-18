import * as cheerio from 'cheerio'
import axios from 'axios';

export async function buildCatalog(rootURL) {
    let catalog = {}
    const html = (await axios.get(rootURL)).data
    const $  = cheerio.load(html)
    const endpoints = getEndpoints($)
    const productPromises = endpoints.map(url => parseEndpoint(url))
    const products = await Promise.all(productPromises)
    endpoints.forEach((url, i) => {
        catalog[url] = products[i]
    })
    return catalog
}

function getEndpoints($) {
    const links = []
    const $ahrefs = $("li.level2 a")
    $ahrefs.each(function() {
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
            $items.each(function() {
                const name = $(this).find(".product.name").text().trim()
                const price = $(this).find("span.price").text().trim()
                products.push({name, price})
            })
            if ( $items.length === 0 || products.length === totalItems) {
                break
            }
            // Update url params
            p++ 
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
    for (let i = 0;  i < retries; i++) {
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