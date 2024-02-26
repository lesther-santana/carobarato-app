import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';
import config from './config/index.js';

// const config = await import('./config/index.js');
dotenv.config();

let sequelize;

sequelize = new Sequelize(config);


export default sequelize;