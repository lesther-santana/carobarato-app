// Product model definition
import { DataTypes, Model } from 'sequelize';
import sequelize from '../index.js'; // Import your Sequelize instance

class Product extends Model { }

Product.init(
    {
        product_id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        supermercado: {
            type: DataTypes.STRING(50),
            allowNull: false,
        },
        product_name: {
            type: DataTypes.TEXT,
            allowNull: false,
        },
        product_url: {
            type: DataTypes.TEXT,
            allowNull: false,
        },
        img_url: {
            type: DataTypes.TEXT,
        },
        slug: {
            type: DataTypes.TEXT,
        },
        brand: {
            type: DataTypes.TEXT,
        },
        created_at: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW,
        },
    },
    {
        sequelize, // We need to pass the connection instance
        modelName: 'products', // We need to choose the model name
        tableName: 'products', // Explicitly define the table name
        timestamps: false, // Set to true if you want timestamps
        underscored: true, // Set to true if your columns are in snake_case
    }
);

export default Product;