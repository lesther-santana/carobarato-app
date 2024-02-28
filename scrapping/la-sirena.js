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
    'Wala',
    'Zerca',
    'Nuestras Marcas',
    'Bebés',
];

const fetchWithPuppeteer = async () => {

    try {

        const PAGE_QUERY = `?limit=30&sort=1`;
        let sirenaDictionary = {};
        let product_data = [];

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

        const collectProductsInformation = async (category_data) => {

            await page.waitForSelector(`.uk-grid.uk-grid-small.uk-grid-match.grid-products .item-product .item-product-title`)

            const products_arr = await page.evaluate(($category_data) => {

                const elements = Array.from([...document.body.querySelectorAll('.uk-grid.uk-grid-small.uk-grid-match.grid-products .item-product')], el => {
                    const price_el = el.querySelector('.item-product-price');
                    const link = el.children[1].href;
                    const image = el.children[1].outerHTML.split('&quot;')[1];
                    const title = el.children[2].children[0].innerText;
                    const discount = price_el.children.length > 1 ? price_el.children[1].innerText.substring(1) : null;
                    const price = price_el.children.length > 1 ? price_el.children[0].innerText.substring(1) : price_el.innerText.substring(1);
                    return { link, image, title, price, discount, ...$category_data, brand: null }
                });

                return elements

            }, category_data)

            product_data = [...product_data, ...products_arr]

            const nextPageButton = await page.$(`a[aria-label="Next page"]`);
            if (nextPageButton) {
                await nextPageButton.click();
                await page.waitForNavigation({ waitUntil: 'networkidle0' });
                await collectProductsInformation();
            }

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

                        console.log(`>> Fetching for Category ${category.label}`);

                        const category_data = { category: category.label, slug: category.link.split('category')[1] };

                        await page.goto(`${category.link}${PAGE_QUERY}&page=1`, { waitUntil: 'domcontentloaded' });

                        await collectProductsInformation(category_data);

                        const slug = category.link.substring(35);

                        sirenaDictionary[slug] = product_data;


                    };
                }

            } catch (error) {
                console.log('>>>> Selector not found, continuing with other tasks: ', item.label);
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
