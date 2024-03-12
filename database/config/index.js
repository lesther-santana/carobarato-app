import dotenv from 'dotenv';

dotenv.config();

export default {

  "username": process.env.PGUSER,
  "password": process.env.PGPASSWORD,
  "database": process.env.PGDATABASE,
  "host": process.env.PGHOST,
  "port": process.env.PGPORT,
  "dialect": 'postgres',
  "protocol": 'postgres',
  "dialectOptions": {
    "ssl": {
      "require": true,
      "rejectUnauthorized": false // For Heroku's self-signed certificate
    }
  },
  "logging": false

}