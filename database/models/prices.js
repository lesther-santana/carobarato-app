// Price model definition
import { DataTypes, Model } from 'sequelize';
import sequelize from '../index'; // Import your Sequelize instance

class Price extends Model { }

Price.init(
    {
        price_id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        product_id: {
            type: DataTypes.UUID,
            allowNull: false,
        },
        list_price: {
            type: DataTypes.DECIMAL(7, 2),
            allowNull: false,
        },
        discounted_price: {
            type: DataTypes.DECIMAL(7, 2),
            allowNull: false,
        },
        created_at: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW,
        },
    },
    {
        sequelize, // We need to pass the connection instance
        modelName: 'prices', // We need to choose the model name
        tableName: 'prices', // Explicitly define the table name
        timestamps: false, // Set to true if you want timestamps
        underscored: true, // Set to true if your columns are in snake_case
    }
);

// Define the foreign key constraint
Price.belongsTo(Product, { foreignKey: 'product_id' });

export default Price;