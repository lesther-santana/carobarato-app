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

async function insertProduct(product) {
    const client = await pool.connect()
    try {
        await client.query("BEGIN;")
        const queryText = "INSERT INTO public.products( supermercado, product_name, product_url, img_url, slug, brand) VALUES ($1, $2, $3, $4, $5, $6) RETURNING product_id;"
        await client.query(queryText, Object.values(product))
        await client.query("COMMIT;")
    } catch (err) {
        client.query("ROLLBACK;")
        console.error(err.message, product.supermercado, product.product_name, product.product_url,)
    } finally {
        client.release()
    }
}



const dirPath = "files/"
const files = fs.readdirSync(dirPath)
const products = 0

files.forEach(element => {
    fs.readFile(dirPath + element, (err, jsonString) => {
        if (err) {
            console.error("Error reading file from disk:", err);
            return;
        }
        try {
            console.log(">> Parsing", element)
            const jsonData = JSON.parse(jsonString);
            const products = Object.values(jsonData).flat()
            console.log(">> Inserting from ", element, "to DB")
            
            products.map(p => {
                const parsedProduct = {
                    supermercado: element, 
                    product_name: p.name, 
                    product_url: p.link, 
                    img_url: p.image, 
                    slug: p.slug, 
                    brand: null
                }
                insertProduct(parsedProduct)
            })
            console.log(">> Done with", element)
        } catch (err) {
            console.error('Error parsing JSON string:', err);
        }
    })
})