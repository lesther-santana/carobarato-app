import puppeteer from 'puppeteer';
import { writeFile } from '../utils/index.js';

const SIRENA = 'https://sirena.do/';

const IGNORE_FETCH = [
    'Bebidas',
    'Cuidado Personal y Belleza',
    'Frutas y Vegetales',
    'Limpieza',
    'Alimentación',
    'Hogar y Electrodomésticos',
    'Recreación',
    'Organización y Decoración',
    'Mesa y cocina',
    'Lavado y Secado ',
    'Ferretería y Jardinería ',
    'Electrodomésticos Pequeños ',
    'Electrodomésticos de Cocina',
    'Audio, Televisión y Tecnología',
    'Aires Acondicionados y Abanicos',
    'Hogar y Electrodomésticos',
    'Plaguicidas ',
    'Mascotas',
    'Zerca',
    'Nuestras Marcas',
    'Bebés',
    'Cigarrillos',
    'Belleza',
    'Cuidado para el Cabello',
    'Cuidado para la Piel',
    'Cuidado Personal',
    'Farmacia',
    'Limpieza',
    'Cuidado de la Ropa',
    'Desechables',
    'Limpieza del Hogar',
    'Organización y Decoración'
];

const fetchWithPuppeteer = async () => {

    try {

        const PAGE_QUERY = `?limit=60&sort=1`;
        let sirenaDictionary = {};

        const browser = await puppeteer.launch({ headless: true });
        const page = await browser.newPage();
        await page.setViewport({
            width: 1600,
            height: 900
        });

        await page.goto(SIRENA, { waitUntil: 'domcontentloaded' });

        console.log('> 1. Began fetching data from La Sirena');
        console.time('>> Time Elapsed Fetching');

        const getLinks = async (selector, item_type = 'category') => {
            if (item_type === 'category') {
                return await page.evaluate((selector) => {

                    let elements = Array.from(document.body.querySelectorAll(selector), (el) => ({ link: el.href, label: el.innerText }));
                    return elements
                }, selector)
            }

            return [];
        }

        await page.waitForSelector(`.uk-section h2`, { timeout: 5000 });

        const links = (await getLinks(`#sub-categorybar .uk-slider ul.uk-nav li a`)).filter(item => !IGNORE_FETCH.includes(item.label));

        for (const [index, item] of links.entries()) {
            console.log(`> 2.${index + 1} Fetching for Category ${item.label}`);

            await page.goto(`${item.link}${PAGE_QUERY}&page=1`, { waitUntil: 'domcontentloaded' });

            try {
                await page.waitForSelector('.subcat-nav.uk-margin-medium-top .uk-slider .uk-slider-items', { timeout: 3000 });

                const subcategories = await getLinks(`.subcat-nav.uk-margin-medium-top .uk-slider .uk-slider-items li a`)

                if (subcategories.length > 0) {
                    for (const category of subcategories) {
                        let product_data = [];

                        const collectProductsInformation = async (category_data, page_number) => {

                            console.time(`>> Time Elapsed Fetching ${item.label}`);
                            const pagesArray = Array.from(Array(Number(page_number)).keys());
                            const fetchLoop = await pagesArray.map(async (index) => {

                                const page_number = index + 1;

                                const clickHandler = async (retryCount = 3) => {
                                    const selector = `.uk-pagination li:nth-child(${page_number}) a`;
                                    // Assuming mouse is not pressed initially
                                    let isMouseDown = false; // Track if the mouse is down
                                    try {
                                        await page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 5000 });
                                        await page.waitForSelector(selector, { timeout: 5000 });

                                        // Before attempting to release the mouse, check if it was pressed
                                        if (isMouseDown) {
                                            await page.mouse.up();
                                            isMouseDown = false; // Reset the mouse state
                                        }

                                        // Perform the click
                                        await page.click(selector);
                                        // Wait for the necessary selector after clicking
                                        await page.waitForSelector(`.uk-grid.uk-grid-small.uk-grid-match.grid-products .item-product .item-product-title`, { timeout: 5000 });
                                    } catch (error) {
                                        console.error('Error during click operation.');
                                        // Release the mouse if it's down when an error occurs
                                        if (isMouseDown) {
                                            await page.mouse.up();
                                            isMouseDown = false;
                                            console.log('Mouse up after error');
                                        }

                                        // Retry mechanism
                                        if (retryCount > 0) {
                                            console.log(`Retrying clickHandler on page ${page_number}, URL: ${await page.url()}. Attempts remaining: ${retryCount}`);
                                            // Wait a moment before retrying to give the page a chance to settle
                                            // Recursively retry the clickHandler function with a decremented retryCount
                                            await clickHandler(retryCount - 1);
                                        } else {
                                            console.log('No more retries left.', error);
                                            // Throw the error after all retries have been exhausted
                                            throw new Error('clickHandler failed after multiple attempts');
                                        }
                                    }
                                };


                                if (pagesArray.length > 1 && page_number > 1) {
                                    try {
                                        await clickHandler();
                                    } catch (error) {
                                        console.error(`Error during click operation. Page: ${await page.url()}`, error);
                                        await page.goto(`${category.link}${PAGE_QUERY}&page=1`, { waitUntil: 'domcontentloaded' });
                                        await clickHandler();
                                        console.log('Retrying click operation...')
                                    }

                                } else {
                                    await page.goto(`${category.link}${PAGE_QUERY}&page=${page_number}`, { waitUntil: 'domcontentloaded' });
                                    await page.waitForSelector(`.uk-grid.uk-grid-small.uk-grid-match.grid-products .item-product .item-product-title`, { timeout: 2000 })
                                }

                                const products_arr = await page.evaluate(($category_data) => {
                                    const elements = Array.from([...document.body.querySelectorAll('.uk-grid.uk-grid-small.uk-grid-match.grid-products .item-product')], el => {
                                        const price_el = el.querySelector('.item-product-price');
                                        const link = el.children[1].href;
                                        const image = el.children[1].outerHTML.split('&quot;')[1];
                                        const name = el.children[2].children[0].innerText;
                                        const discount = price_el.children.length > 1 ? price_el.children[1].innerText.substring(1) : null;
                                        const price = price_el.children.length > 1 ? price_el.children[0].innerText.substring(1) : price_el.innerText.substring(1);
                                        return { link, image, name, price, discount, ...$category_data, brand: null }
                                    });

                                    return elements

                                }, category_data)

                                console.log('CONCLUSION', { page_number, count: products_arr.length })

                                product_data = [...product_data, ...products_arr]

                                return products_arr
                            });

                            await Promise.all(fetchLoop);

                            console.timeEnd(`>> Time Elapsed Fetching ${item.label}`);


                        };

                        console.log(`>> Fetching for Category ${category.label}`);

                        const category_data = { category: category.label, slug: category.link.split('category')[1] };
                        await page.goto(`${category.link}${PAGE_QUERY}&page=1`, { waitUntil: 'domcontentloaded' });

                        await page.waitForSelector(`.uk-grid.uk-grid-small.uk-grid-match.grid-products .item-product .item-product-title`)

                        let page_number = await page.evaluate(() => {

                            const page_articles_count = document.querySelector('div.uk-flex-middle:nth-child(2) > div:nth-child(1) > span:nth-child(1)');
                            return page_articles_count.innerText;
                        })

                        page_number = (page_number.split(' artículos')[0]) / 60
                        page_number = Math.round(page_number) > page_number ? Math.round(page_number) : Math.round(page_number) + 1

                        await collectProductsInformation(category_data, page_number);

                        console.log(`>> Finished fetching for Category ${category.label} | Products Count: ${product_data.length}`);

                        const slug = category.link.substring(36);
                        sirenaDictionary[slug] = product_data;


                    };
                }

            } catch (error) {
                console.log(`>>>> Selector not found ${item.label}, continuing with other tasks.`, error);
            }

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
