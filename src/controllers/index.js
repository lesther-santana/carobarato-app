import { Product, Price } from "../../database/models/associations.js"

const SAMPLE_IDS = {
    "similar_items": ['99434c4a-5778-48a7-940e-ff71ed5b653d',
        '7894ed89-f9bc-4b25-a908-255850e558b6',
        'db9522ff-ddfd-4f71-9f7f-8edd89de1970',
        'ebc2e7ec-1e8a-4e4a-a0c7-df027a8c6baa',
        '3e36e16c-7c17-44fd-a02f-5b153072fa18']
}

export const getProducts = async (req, res) => {

    const products = await Product.findAll({
        limit: 20,
        where: {
            product_id: SAMPLE_IDS.similar_items
        },
        include: {
            model: Price,
            as: 'prices' // assuming the association alias is 'prices'
        }
    });

    return res.status(200).json(
        products
    )
}