import { Product, Price } from "../../database/models/associations.js"
import { Op, Sequelize } from 'sequelize';

export const getProducts = async (req, res) => {

    const { search, supermarket } = req.query;

    const ts_search = Sequelize.literal(`similarity(product_name, '${search}') > 0.1`)

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
            as: 'prices',
        }
    });

    return res.status(200).json(
        products
    )
};
export const getSpecificProduct = async (req, res) => {

    const { supermarket } = req.query;
    const { product } = req.params;

    const ts_search = Sequelize.literal(`similarity(product_name, '${product}') > 0.1`)
    const rank = Sequelize.literal(`similarity(product_name, '${product}')`)

    const products = await Product.findOne({
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
export const getSpecificProductsArray = async (req, res) => {

    const { search } = req.body;

    const products = await Promise.all(search.map(async (p) => {

        const ts_search = Sequelize.literal(`similarity(product_name, '${p.product}') > 0.1`)
        const rank = Sequelize.literal(`similarity(product_name, '${p.product}')`)

        const result = await Product.findOne({
            where: {
                [Op.and]: ts_search,
                supermercado: { [Op.iLike]: `%${p.supermarket}%` }
            },
            order: [
                [rank, 'DESC']
            ],
            include: {
                model: Price,
                as: 'prices'
            }
        });
        return result;
    }))
    return res.status(200).json(products)
};
