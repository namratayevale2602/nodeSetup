const dotenv = require('dotenv');
const path = require('path');

console.log('=================================');
console.log('Environment Variables Test');
console.log('=================================');
console.log('Current directory:', __dirname);
console.log('Looking for .env at:', path.join(__dirname, '.env'));
console.log('');

// Load .env file
const result = dotenv.config();

if (result.error) {
    console.error('❌ Error loading .env:', result.error.message);
    process.exit(1);
}

console.log('✅ .env file loaded successfully');
console.log('');
console.log('Environment variables:');
console.log('PORT:', process.env.PORT);
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('DB_HOST:', process.env.DB_HOST);
console.log('DB_PORT:', process.env.DB_PORT);
console.log('DB_NAME:', process.env.DB_NAME);
console.log('DB_USER:', process.env.DB_USER);
console.log('DB_PASSWORD:', process.env.DB_PASSWORD ? '✓ Set (value: ' + process.env.DB_PASSWORD + ')' : '✗ NOT SET');
console.log('JWT_SECRET:', process.env.JWT_SECRET ? '✓ Set' : '✗ NOT SET');
console.log('=================================');