import axios from 'axios';
import axiosRetry from 'axios-retry';
import { writeFile } from '../utils/index.js';
import { load } from 'cheerio';
import url from 'url';

const ROOT_URL = 'https://www.pricesmart.com/site/do/es'

const retryOptions = {
    retries: 3, // Number of retry attempts
    retryDelay: axiosRetry.exponentialDelay,
    retryCondition: axiosRetry.isRetryableError,
  };
  
axiosRetry(axios, retryOptions);

async function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function processCategory(relCategoryURL) {

    try {

        const categoryURL = url.resolve(ROOT_URL, relCategoryURL);
        const asURL = new URL(relCategoryURL, ROOT_URL)
        let page_n = 1;
        const products = [];

        while (true) {
            const paginated_url = categoryURL + '&' + `r133_r1_r3_r1:page=${page_n}` + '&' + '133_r1_r3_r1:_sps=12';
            console.log('>>> Processing ', paginated_url)
            const response = await axios.get(paginated_url);
            const html = response.data;  
            const $ = load(html);
            const $products = $('div.search-product-box');

            if ($products.length === 0) {
                break
            }
            
            $products.each((i, element) => {
                const link = url.resolve(ROOT_URL, $(element).find('a[id^="search-result"]').attr('href'));
                const image = $(element).find('img').attr('src');
                const name = $(element).find('p#product-name').text().trim();
                const price = $(element).find('strong#product-price').text().trim();
                const discount = null;
                const category = $(element).find('span#category_banner_title').text().trim();
                const slug = asURL.pathname.toString();
                products.push({name, link, image, price, discount, category, slug});
            });
            
            page_n++;
        }

        console.log(`>>> Done with ${categoryURL} found ${products.length} items`)
        return {[relCategoryURL]: products}

    } catch (error) {
        console.log(error.messagge)
        return {[relCategoryURL]: []}
    }
}

async function main() {

    console.log(">> Getting html from", ROOT_URL);
    console.time('execTime');
    
    try {
        const response =  await axios.get(ROOT_URL)
        
        const $ = load(response.data);
        const links = $('a[href]:not([href=""]).categories-section-link');
        
        console.log(`>> Found ${links.length} categories`);
        
        const promises = [];
        
        for (const link of links) {
            const href = $(link).attr('href'); 
            promises.push(processCategory(href));
        }
        
        const categories = await Promise.all(promises)
        writeFile('pricesmart', Object.assign({}, ...categories))
        console.log('>>> Done!')
    } catch (error) {
        console.log(error)
    }
    console.timeEnd('execTime');
}

main()