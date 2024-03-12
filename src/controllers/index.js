import { Product, Price } from "../../database/models/associations.js"
import { Op, Sequelize } from 'sequelize';
import format from "pg-format";

export const getProducts = async (req, res) => {

    const { search, supermarket } = req.query;

    const ts_search = Sequelize.literal(
        `product_name_index_col @@ plainto_tsquery('spanish', %L)`, 
        search
    )

    const rank = Sequelize.literal(
        `ts_rank(product_name_index_col, plainto_tsquery('spanish', %L)) DESC`, 
        search
    )

    const products = await Product.findAll({
        limit: 10,
        where: {
            [Op.and]: ts_search,
            supermercado: { [Op.iLike]: `%${supermarket}%` }
        },
        order: rank,
        include: {
            model: Price,
            as: 'prices'
        }
    });

    return res.status(200).json(
        products
    )
};
