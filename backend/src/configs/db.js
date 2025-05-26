const mysql = require('mysql2/promise');

const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  port: parseInt(process.env.DB_PORT, 10),
  waitForConnections: true,
  connectionLimit: 5, 
  queueLimit: 0,       
  connectTimeout: 10000 
};

const pool = mysql.createPool(dbConfig);

async function testConnection() {
  let connection;
  try {
    connection = await pool.getConnection(); 
    console.log(`Successfully connected to database: ${dbConfig.database} on host ${dbConfig.host}`);
    return true;
  } catch (error) {
    console.error('Error connecting to the database:');
    console.error(`- Host: ${dbConfig.host}`);
    console.error(`- User: ${dbConfig.user}`);
    console.error(`- Database: ${dbConfig.database}`);
    console.error(`- Error Code: ${error.code}`);
    console.error(`- Error Message: ${error.message}`);
    return false;
  } finally {
    if (connection) connection.release(); 
  }
}

module.exports = {
  pool, 
  testConnection 
};