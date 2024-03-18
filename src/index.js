import net from 'net';
import express from 'express';
import dotenv from 'dotenv';
import router from './routes/index.js';
import cors from 'cors';
import os from 'os';
import sequelize from '../database/index.js';

dotenv.config();

// import sequelize from '../database/index.js';

const app = express();

let port = process.env.PORT || 4000;

const findAvailablePort = (port) => {
    const server = net.createServer()
    return new Promise((resolve, reject) => {
        server.on('error', (err) => {
            if (err.code === 'EADDRINUSE') {
                resolve(findAvailablePort(port + 1))
            } else {
                reject(err)
            }
        })
        server.listen(port, () => {
            server.close(() => {
                resolve(port)
            })
        })
    })
};

const corsOptions = {
    origin: process.env.ENV === 'prod' ? ['https://carobarato.com', 'https://www.carobarato.com'] : '*',
    optionsSuccessStatus: 200,
    methods: ['GET', 'POST'],
};


// Custom middleware to handle CORS errors
const handleCorsError = (req, res, next) => {
    if (!corsOptions.origin || corsOptions.origin === '*' || corsOptions.origin === req.headers.origin) {
        next();
    } else {
        res.status(403).send('Origin not allowed');
    }
};

app.use(handleCorsError);
app.use(cors(corsOptions))
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(router);

// Usage
findAvailablePort(port)
    .then((availablePort) => {
        sequelize.authenticate()
            .then(() => {

                const hostname = os.hostname();

                console.log(`Available port: ${availablePort}`)

                app.listen(availablePort, () => console.log(`App listening on http://${hostname}:${availablePort}/api`));

            })
            .catch(err => {
                console.error('Unable to connect to the database:', err);
            });
    })
    .catch((err) => {
        console.error('Error finding available port:', err)
    })
