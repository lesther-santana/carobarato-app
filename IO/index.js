import * as fs from "fs"
import pg from 'pg'
import dotenv from "dotenv";
import format from "pg-format";
const { Pool } = pg

/**
 * Renames the keys of a given object to match a specified database schema.
 * This operation is performed in place, meaning the original object is modified.
 * 
 * @param {Object} entry - The object whose keys are to be renamed.
 * @param {String} [schema='products'] - The name of the schema to match the object keys against.
 *                                       Defaults to 'products' if not specified.
 * 
 * @example
 * const product = { name: "Laptop", link: "www.example.com", image: "image.jpg" };
 * matchDbSchema(product);
 * // The product object now will be:
 * {product_name: "Laptop", product_url: "www.example.com", image_url: "image.jpg"}
 */
function matchDbSchema(entry) {
    const dbSchemas = { 
        name: "product_name",
        link: "product_url",
        image: "img_url",
        price: "list_price",
        discount: "discounted_price",
    }
    for (const [oldKey, newKey] of Object.entries(dbSchemas)) {
        if (entry.hasOwnProperty(oldKey)) {
            entry[newKey] = entry[oldKey]
            delete entry[oldKey]
        }
    }
}

class EntryProcessor {
    constructor(supermercado, dbPool) {
        this.supermercado = supermercado;
        this.pool = dbPool
    }

    async process(items) {
        if (items.length === 0) {
            return
        }
        const uniqueLinks = new Set();
        const uniqueArr = items.filter(obj => {
            if (!uniqueLinks.has(obj.link)) {
                uniqueLinks.add(obj.link);
                return true;
            }
            return false;
        })
        
        items = uniqueArr


        console.log('>> Processing', items.length, 'entries');
        const prodTableCols = [
            'supermercado', 
            'product_name',
            'category',
            'brand', 
            'product_url', 
            'img_url',
            'slug',
        ]
        const priceTableCols= ['product_id','list_price', 'discounted_price']
        const prodTableFormat = 'INSERT INTO products(%I) VALUES %L ON CONFLICT (product_url) DO UPDATE SET img_url = EXCLUDED.img_url RETURNING product_id;' 
        const priceTableFormat = 'INSERT INTO prices(%I) VALUES %s RETURNING price_id' 
        const productTableValues = [] 
        items.map(item => {
            item["supermercado"] = this.supermercado
            matchDbSchema(item)
            productTableValues.push([
                item.supermercado,
                item.product_name,
                item.category,
                item.brand,
                item.product_url,
                item.img_url,
                item.slug,
            ])
        })
        const productQuery = format(prodTableFormat, prodTableCols, productTableValues)
        //console.log(productQuery)
        try {
            const client = await this.pool.connect()
            try {
                await client.query('BEGIN')
                const res = await client.query(productQuery)
                const prices = []
                //console.log(res.rows.length)
                res.rows.forEach((row, i) => {
                    const product_id = row.product_id
                    const item = items[i]
                    prices.push(
                        format(
                            '(%L)', 
                            [
                                product_id, 
                                this.convertToNumber(item.list_price), 
                                this.convertToNumber(item.discounted_price)
                            ]
                        )
                    )
                })
                const pricesQuery = format(priceTableFormat, priceTableCols, prices.join(", "))
                await client.query(pricesQuery)
                await client.query('COMMIT;')
            } catch (err) {
                await client.query('ROLLBACK;')
                throw err
            } finally {
                await client.release()
            }
        } catch (err) {
            console.error('Database operation failed:', err.message);
        }
    }

    convertToNumber(str) {
        if (str === null || str === undefined || str.trim() === '') {
            return 0
        }
        const number = parseFloat(str.replace(/,/g, ''));
        return isNaN(number) ? 0 : number
    }
}

async function main() {
    
    if (process.argv.length != 4) {
        console.error("Missing filepath or supermercado")
        process.exit(1)
    }
    
    const filePath = process.argv[2]
    const supermercado = process.argv[3]
    
    console.log(">> Processing Items in", filePath,"---", supermercado)
    console.time('execTime'); // Start timing with a label
    
    dotenv.config();
    let pool
    try {        
        
        pool = new Pool({
            user: process.env.PGUSER,
            password: process.env.PGPASSWORD,
            database: process.env.PGDATABASE,
            port: process.env.PGPORT,
            host: process.env.PGHOST,
        })
        process.on('SIGINT', async function() {
            await pool.end()
            process.exit()
        })
        const rawFile = fs.readFileSync(filePath, 'utf-8') 
        const jsonData = JSON.parse(rawFile)
        
        const processor = new EntryProcessor(supermercado, pool)
        const parsedEndpointPromises = Object.values(jsonData).map(x => processor.process(x))
        await Promise.all(parsedEndpointPromises)

    } catch (err) {
        console.error('error', err)
    } finally {
        if (pool) {
            await pool.end()
        }
    }
    console.timeEnd('execTime');
}

main().catch(error => {
    console.error('Main function encountered an error:', error);
    process.exit(1);
});
