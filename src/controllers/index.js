import Product from "../../database/models/products.js"
export const getProducts = async (req, res) => {

    const products = await Product.findAll({
        limit: 20
    });
    return res.status(200).json({
        message: 'Hello, World!',
        products
    })
}