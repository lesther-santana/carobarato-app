// associations.js
import Product from './products.js';
import Price from './prices.js';

Price.belongsTo(Product, { foreignKey: 'product_id' });

Product.hasMany(Price, { foreignKey: 'product_id', as: 'prices' }); // Ensure the foreignKey matches and add an alias

export { Product, Price };