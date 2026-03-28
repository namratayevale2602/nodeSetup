const { sequelize } = require('../config/database');

async function testConnection() {
  try {
    await sequelize.authenticate();
    console.log('✅ Connection has been established successfully.');
    
    // Test query
    const result = await sequelize.query('SELECT NOW() as current_time');
    console.log('📅 Current database time:', result[0][0].current_time);
    
    await sequelize.close();
    console.log('✅ Connection closed');
  } catch (error) {
    console.error('❌ Unable to connect to the database:', error);
  }
}

testConnection();