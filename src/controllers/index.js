import { Product, Price } from "../../database/models/associations.js"
import { Op } from 'sequelize';

export const getProducts = async (req, res) => {

    const { search, supermarket } = req.query;

    const products = await Product.findAll({
        limit: 10,
        where: {
            product_name: { [Op.iLike]: `%${search}%` },
            supermercado: { [Op.iLike]: `%${supermarket}%` }
        },
        include: {
            model: Price,
            as: 'prices'
        }
    });

    return res.status(200).json(
        products
    )
}