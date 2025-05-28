const dotenv = require('dotenv');
dotenv.config();

const { pool } = require('./configs/db');
const { hashPassword } = require('./utils/passwordUtils');

async function createAdminAccount() {
  const adminData = {
    fullname: 'Super Admin', 
    phone: '0901772837',         
    password: 'leminhtuan123', 
    email: 'admin@ttvres.com',
    address: 'TTVRes Headquarters',
    user_type: 1,
    status: 1
  };

  let connection;
  try {
    connection = await pool.getConnection();
    console.log('Database connected for admin creation...');

    const [existingUsers] = await connection.query('SELECT id FROM users WHERE phone = ?', [adminData.phone]);
    if (existingUsers.length > 0) {
      console.log(`User with phone ${adminData.phone} already exists. Skipping creation.`);
      console.log(`If you want to re-create, delete the existing user with phone ${adminData.phone} from the database first.`);
      return;
    }

    const hashedPassword = await hashPassword(adminData.password);

    const sql = `
      INSERT INTO users (fullname, phone, password, email, address, user_type, status, join_date)
      VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
    `;
    const [result] = await connection.query(sql, [
      adminData.fullname,
      adminData.phone,
      hashedPassword,
      adminData.email,
      adminData.address,
      adminData.user_type,
      adminData.status
    ]);

    if (result.insertId) {
      console.log(`Admin account created successfully!`);
      console.log(`   ID: ${result.insertId}`);
      console.log(`   Phone: ${adminData.phone}`);
      console.log(`   (Remember the original password: "${adminData.password}")`);
    } else {
      console.error('Failed to create admin account.');
    }

  } catch (error) {
    console.error('Error creating admin account:', error);
  } finally {
    if (connection) {
      connection.release();
      console.log('Database connection released.');
    }
    
    try {
        await pool.end();
        console.log('Connection pool closed.');
    } catch (poolEndError) {
        console.error('Error closing connection pool:', poolEndError);
    }
  }
}

createAdminAccount();