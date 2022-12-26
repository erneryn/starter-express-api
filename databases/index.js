const mysql = require('mysql2/promise');


const config = {
  db_host : process.env.DB_HOST || '127.0.0.1',
  db_port : process.env.DB_PORT || '3306',
  db_user : process.env.DB_USER || 'root',
  db_pass : process.env.DB_PASS || 'smec123$',
  db_name : process.env.DB_NAME || 'bike_maintainer',
  url: process.env.URL_SERVER
}

const db_pool = mysql.createPool({
    host: config.db_host,
    user: config.db_user,
    password: config.db_pass,
    database: config.db_name,
    port: config.db_port,
    connectionLimit: 10,
    waitForConnections: true,
    namedPlaceholders: true,
    decimalNumbers: true,
    dateStrings: true,
    connectTimeout: 15000,
    timezone: '+00:00'
});

module.exports = db_pool