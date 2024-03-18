import express from 'express';
import { getProducts, getSpecificProduct, getSpecificProductsArray } from '../controllers/index.js';

const router = express.Router();

router.get('/api/products/', getProducts);
router.get('/api/products/:product', getSpecificProduct);
router.post('/api/specific-products/', getSpecificProductsArray);

export default router;

