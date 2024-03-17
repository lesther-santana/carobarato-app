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

    const ts_search = Sequelize.literal(`similarity(product_name, '${search}') > 0.1`)
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

        const ts_search = Sequelize.literal(`similarity(product_name, '${search}') > 0.1`)
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

        console.log(result.product_name)

        return result;
    }))
    return res.status(200).json(products)
};

// Camaron
// Sirena
// CAMARON CRUDO WALA 21/25
// Nacional
// Cola De Camarón Crudo 16/20 Congelada, Lb
// Jumbo
// Camarón Crudo 16/20 Líder 1 Lb
// PriceSmart
// Vima Camarón Crudo Congelado 21-25 Bolsa 1 kg / 2.2 lb


// Platanos
// PriceSmart
// Member's Selection Plátano Verde 8 Unidades
// Sirena
// PLATANO VERDE UND
// Jumbo
// Plátano Verde
// Nacional
// Platano Verde


// Romo
// Sirena
// RON XV RESERVA BRUGAL 700 ML
// Nacional / Jumbo
// Ron Xv Brugal 70 Cl
// PriceSmart
// Brugal Ron Reserva Especial XV en Botella de 700 ml