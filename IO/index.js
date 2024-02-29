import * as fs from "fs"
import pg from 'pg'
import dotenv from "dotenv";

dotenv.config();


const { Pool } = pg
const pool = new Pool({
    user: process.env.PGUSER,
    password: process.env.PGPASSWORD,
    database: process.env.PGDATABASE,
    port: process.env.PGPORT,
    host: process.env.PGHOST,
})


function getInsertProductText() {
    const insertText = "INSERT INTO products(supermercado, product_name, product_url, img_url, slug, brand)"
    const valuesText = "VALUES ($1, $2, $3, $4, $5, $6) RETURNING product_id;"
    return [insertText, valuesText].join(" ")
};


function getInsertPriceText() {
    const insertText = "INSERT INTO prices(product_id, list_price, discounted_price)"
    const valuesText = "VALUES ($1, $2, $3);"
    return [insertText, valuesText].join(" ")
}

function getProdExistQuery() {
    const s = "SELECT product_id FROM public.products WHERE product_url = $1;"
    return s
}

async function insertProduct(product) {
    const client = await pool.connect()
    try {
        await client.query("BEGIN;")
        let res
        let product_id
        res = await client.query(getProdExistQuery(), [product.product_url])
        if (res.rowCount > 0) {
            product_id = res.rows[0].product_id
        } else {
            const insertProductText = getInsertProductText()
            const values = [
                product.supermercado, 
                product.product_name, 
                product.product_url, 
                product.img_url,
                product.slug,
                product.brand
            ]
            res = await client.query(insertProductText, values)
            product_id = res.rows[0].product_id
        }
        const insertPriceText = getInsertPriceText()
        await client.query(insertPriceText, [product_id, product.price, product.discount])
        await client.query("COMMIT;")
    } catch (err) {
        client.query("ROLLBACK;")
        console.error(err.message)
    } finally {
        client.release()
    }
}



const dirPath = "files/"
const files = fs.readdirSync(dirPath)

console.log(">>> Begin .json pipeline")
console.time('>> Time Elapsed Pipeline');
files.forEach(element => {
    fs.readFile(dirPath + element, (err, jsonString) => {
        if (err) {
            console.error("Error reading file from disk:", err);
            return;
        }
        try {
            const jsonData = JSON.parse(jsonString);
            const products = Object.values(jsonData).flat()
            console.log(">> Inserting from ", element, "to DB")

            products.map(p => {
                insertProduct({
                    supermercado: element,
                    product_name: p.name,
                    product_url: p.link,
                    img_url: p.image,
                    slug: p.slug,
                    brand: null,
                    price: p.price ? Number(p.price.replace(/,/g, '')): null,
                    discount: p.discount ? Number(p.discount.replace(/,/g, '')): null
                })
            })
        } catch (err) {
            console.error('Error parsing JSON string:', err);
        }
    })
})
console.log(">>> End .json pipeline")
console.timeEnd('>> Time Elapsed Pipeline')