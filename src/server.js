const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const cookieParser = require('cookie-parser');
const path = require('path');
const { connectDB, sequelize } = require('./config/database');
const { notFound, errorHandler } = require('./middleware/errorHandler');

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Import routes
const userRoutes = require('./routes/userRoutes');

// Initialize app
const app = express();
const PORT = process.env.PORT || 5000;

// Connect to database
connectDB();

// Middleware
app.use(helmet());
app.use(cors({
    origin: 'http://localhost:3000', // Your frontend URL
    credentials: true // Allow cookies to be sent
}));
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser()); // Parse cookies

// Logging
if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
}

// Handle favicon.ico
app.get('/favicon.ico', (req, res) => res.status(204).end());

// Welcome route
app.get('/', (req, res) => {
    res.json({
        success: true,
        message: 'Node.js Backend API with JWT Authentication',
        version: '1.0.0',
        endpoints: {
            users: '/api/users',
            health: '/health',
            'refresh-token': '/api/users/refresh-token'
        },
        timestamp: new Date().toISOString()
    });
});

// Health check
app.get('/health', async (req, res) => {
    try {
        await sequelize.authenticate();
        res.status(200).json({
            success: true,
            status: 'healthy',
            database: 'connected',
            uptime: process.uptime(),
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            status: 'unhealthy',
            database: 'disconnected',
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

// API routes
app.use('/api/users', userRoutes);

// Error handling
app.use(notFound);
app.use(errorHandler);

// Start server
const server = app.listen(PORT, () => {
    console.log('\n=================================');
    console.log('🚀 Server is running!');
    console.log(`📍 URL: http://localhost:${PORT}`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV}`);
    console.log(`🗄️  Database: ${process.env.DB_NAME} on ${process.env.DB_HOST}:${process.env.DB_PORT}`);
    console.log(`🔐 JWT Access Expiry: ${process.env.JWT_ACCESS_EXPIRE}`);
    console.log(`🔐 JWT Refresh Expiry: ${process.env.JWT_REFRESH_EXPIRE}`);
    console.log('=================================\n');
});

module.exports = app;