import { Product, Price } from "../../database/models/associations.js"
import { Op, Sequelize } from 'sequelize';

export const getProducts = async (req, res) => {

    const { search, supermarket } = req.query;

    const ts_search = Sequelize.literal(`similarity(product_name, '${search}') > 0.2`)

    const rank = Sequelize.literal(`similarity(product_name, '${search}')`)


    const products = await Product.findAll({
        limit: 10,
        where: {
            [Op.and]: ts_search,
            supermercado: { [Op.iLike]: `%${supermarket}%` }
        },
        order: [
            [rank, 'DESC']
        ],
        include: {
            model: Price,
            as: 'prices'
        }
    });

    return res.status(200).json(
        products
    )
};
