# Complete Node.js Backend Setup with PostgreSQL

## 📋 Prerequisites

Before starting, ensure you have:
- Windows 10/11 operating system
- Administrator access for installations
- Internet connection

## 🚀 Installation Guide

### 1. Install Node.js

#### Download and Install:
1. Visit [Node.js Official Website](https://nodejs.org/)
2. Download the LTS version (recommended) or Current version
3. Run the installer with default settings
4. Verify installation:
```powershell
node --version
npm --version
```

### 2. Install PostgreSQL

#### Download and Install:
1. Visit [PostgreSQL Download Page](https://www.postgresql.org/download/windows/)
2. Download the latest version (e.g., PostgreSQL 18)
3. Run the installer with these settings:
   - Installation directory: `C:\Program Files\PostgreSQL\18`
   - Data directory: `C:\Program Files\PostgreSQL\18\data`
   - Port: `5432`
   - **Remember your password!** (We'll use `root` for development)
   - Select components: PostgreSQL Server, pgAdmin 4, Command Line Tools

#### Add PostgreSQL to PATH:
```powershell
# Add to PATH (Run as Administrator)
[Environment]::SetEnvironmentVariable("Path", $env:Path + ";C:\Program Files\PostgreSQL\18\bin", "User")
```

#### Verify PostgreSQL Installation:
```powershell
psql --version
# Should output: psql (PostgreSQL) 18.3
```

### 3. Create Project Structure

```powershell
# Create project directory
mkdir my-backend-app
cd my-backend-app

# Create folder structure
mkdir src
mkdir src\config
mkdir src\controllers
mkdir src\models
mkdir src\routes
mkdir src\middleware
mkdir src\utils
mkdir src\services
mkdir src\migrations
mkdir src\scripts
mkdir src\seeders
```

### 4. Initialize Node.js Project

```powershell
# Initialize package.json
npm init -y
```

### 5. Install Dependencies

```powershell
# Core dependencies
npm install express dotenv cors helmet morgan compression pg pg-hstore sequelize bcryptjs jsonwebtoken

# Development dependencies
npm install -D nodemon

# Install Sequelize CLI globally for migration commands
npm install -g sequelize-cli

# Install additional packages for migrations
npm install sequelize-cli --save-dev
```

### 6. Create Environment Configuration

#### Create `.env` file:
```powershell
@"
PORT=5000
NODE_ENV=development
DB_HOST=localhost
DB_PORT=5432
DB_NAME=myapp_db
DB_USER=postgres
DB_PASSWORD=root
JWT_ACCESS_SECRET=your_super_secret_access_key_change_this_to_a_long_random_string
JWT_REFRESH_SECRET=your_super_secret_refresh_key_change_this_to_a_different_long_string
JWT_ACCESS_EXPIRE=1h
JWT_REFRESH_EXPIRE=7d
"@ | Out-File -FilePath .env -Encoding utf8
```

#### Create `.gitignore`:
```powershell
@"
node_modules/
.env
dist/
.DS_Store
.env.local
.env.*.local
npm-debug.log*
yarn-debug.log*
yarn-error.log*
"@ | Out-File -FilePath .gitignore -Encoding utf8
```

### 7. Create Database Configuration

#### `src/config/database.js`:
```javascript
const { Sequelize } = require('sequelize');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

// Create Sequelize instance
const sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASSWORD,
    {
        host: process.env.DB_HOST,
        port: parseInt(process.env.DB_PORT) || 5432,
        dialect: 'postgres',
        logging: process.env.NODE_ENV === 'development' ? console.log : false,
        pool: {
            max: 10,
            min: 0,
            acquire: 30000,
            idle: 10000
        }
    }
);

// Test database connection
const connectDB = async () => {
    try {
        await sequelize.authenticate();
        console.log('✅ PostgreSQL connected successfully');
    } catch (error) {
        console.error('❌ Database connection failed:', error.message);
        process.exit(1);
    }
};

module.exports = { sequelize, connectDB };
```

### 8. Create Sequelize Configuration for Migrations

#### `src/config/sequelize-config.js`:
```javascript
require('dotenv').config();
const path = require('path');

module.exports = {
  development: {
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: 'postgres',
    logging: console.log,
    define: {
      timestamps: true,
      underscored: false,
      paranoid: true // Soft deletes
    }
  },
  test: {
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: `${process.env.DB_NAME}_test`,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: 'postgres',
    logging: false
  },
  production: {
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: 'postgres',
    logging: false,
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    }
  }
};
```

### 9. Create User Migration

#### `src/migrations/20240328000000-create-users-table.js`:
```javascript
'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Create ENUM type for user roles
    await queryInterface.sequelize.query(`
      DO $$ BEGIN
        CREATE TYPE "enum_Users_role" AS ENUM ('user', 'admin');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    // Create Users table
    await queryInterface.createTable('Users', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      name: {
        type: Sequelize.STRING(100),
        allowNull: false
      },
      email: {
        type: Sequelize.STRING(255),
        allowNull: false,
        unique: true
      },
      password: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      role: {
        type: Sequelize.ENUM('user', 'admin'),
        defaultValue: 'user',
        allowNull: false
      },
      isActive: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
        allowNull: false
      },
      refreshToken: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      refreshTokenExpiry: {
        type: Sequelize.DATE,
        allowNull: true
      },
      lastLogin: {
        type: Sequelize.DATE,
        allowNull: true
      },
      passwordChangedAt: {
        type: Sequelize.DATE,
        allowNull: true
      },
      resetPasswordToken: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      resetPasswordExpires: {
        type: Sequelize.DATE,
        allowNull: true
      },
      emailVerified: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull: false
      },
      emailVerificationToken: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      emailVerificationExpires: {
        type: Sequelize.DATE,
        allowNull: true
      },
      profilePicture: {
        type: Sequelize.STRING(500),
        allowNull: true
      },
      phoneNumber: {
        type: Sequelize.STRING(20),
        allowNull: true
      },
      address: {
        type: Sequelize.JSONB,
        allowNull: true,
        defaultValue: {}
      },
      preferences: {
        type: Sequelize.JSONB,
        allowNull: true,
        defaultValue: {}
      },
      metadata: {
        type: Sequelize.JSONB,
        allowNull: true,
        defaultValue: {}
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      deletedAt: {
        type: Sequelize.DATE,
        allowNull: true
      }
    });

    // Create indexes for better query performance
    await queryInterface.addIndex('Users', ['email'], {
      name: 'users_email_index',
      unique: true,
      using: 'BTREE'
    });

    await queryInterface.addIndex('Users', ['role'], {
      name: 'users_role_index',
      using: 'BTREE'
    });

    await queryInterface.addIndex('Users', ['isActive'], {
      name: 'users_active_index',
      using: 'BTREE'
    });

    await queryInterface.addIndex('Users', ['createdAt'], {
      name: 'users_created_at_index',
      using: 'BTREE'
    });
  },

  down: async (queryInterface, Sequelize) => {
    // Remove indexes
    await queryInterface.removeIndex('Users', 'users_email_index');
    await queryInterface.removeIndex('Users', 'users_role_index');
    await queryInterface.removeIndex('Users', 'users_active_index');
    await queryInterface.removeIndex('Users', 'users_created_at_index');
    
    // Drop the table
    await queryInterface.dropTable('Users');
    
    // Drop the ENUM type
    await queryInterface.sequelize.query(`
      DROP TYPE IF EXISTS "enum_Users_role";
    `);
  }
};
```

### 10. Create User Model

#### `src/models/User.js`:
```javascript
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const User = sequelize.define('User', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    name: {
        type: DataTypes.STRING(100),
        allowNull: false,
        validate: {
            notEmpty: true,
            len: [2, 100]
        }
    },
    email: {
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: true,
        validate: {
            isEmail: true,
            notEmpty: true
        }
    },
    password: {
        type: DataTypes.STRING(255),
        allowNull: false,
        validate: {
            len: [6, 100]
        }
    },
    role: {
        type: DataTypes.ENUM('user', 'admin'),
        defaultValue: 'user'
    },
    isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    },
    refreshToken: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    refreshTokenExpiry: {
        type: DataTypes.DATE,
        allowNull: true
    },
    lastLogin: {
        type: DataTypes.DATE,
        allowNull: true
    },
    passwordChangedAt: {
        type: DataTypes.DATE,
        allowNull: true
    },
    resetPasswordToken: {
        type: DataTypes.STRING(255),
        allowNull: true
    },
    resetPasswordExpires: {
        type: DataTypes.DATE,
        allowNull: true
    },
    emailVerified: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    emailVerificationToken: {
        type: DataTypes.STRING(255),
        allowNull: true
    },
    emailVerificationExpires: {
        type: DataTypes.DATE,
        allowNull: true
    },
    profilePicture: {
        type: DataTypes.STRING(500),
        allowNull: true
    },
    phoneNumber: {
        type: DataTypes.STRING(20),
        allowNull: true
    },
    address: {
        type: DataTypes.JSONB,
        defaultValue: {}
    },
    preferences: {
        type: DataTypes.JSONB,
        defaultValue: {}
    },
    metadata: {
        type: DataTypes.JSONB,
        defaultValue: {}
    }
}, {
    paranoid: true,
    timestamps: true,
    hooks: {
        beforeCreate: async (user) => {
            if (user.password) {
                user.password = await bcrypt.hash(user.password, 10);
            }
        },
        beforeUpdate: async (user) => {
            if (user.changed('password')) {
                user.password = await bcrypt.hash(user.password, 10);
                user.passwordChangedAt = new Date();
            }
        }
    }
});

// Instance methods
User.prototype.comparePassword = async function(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

User.prototype.generateAccessToken = function() {
    return jwt.sign(
        { id: this.id, email: this.email, role: this.role },
        process.env.JWT_ACCESS_SECRET,
        { expiresIn: process.env.JWT_ACCESS_EXPIRE || '1h' }
    );
};

User.prototype.generateRefreshToken = function() {
    return jwt.sign(
        { id: this.id, email: this.email, tokenType: 'refresh' },
        process.env.JWT_REFRESH_SECRET,
        { expiresIn: process.env.JWT_REFRESH_EXPIRE || '7d' }
    );
};

User.prototype.getPublicProfile = function() {
    const userObject = this.toJSON();
    delete userObject.password;
    delete userObject.refreshToken;
    delete userObject.refreshTokenExpiry;
    delete userObject.resetPasswordToken;
    delete userObject.resetPasswordExpires;
    delete userObject.emailVerificationToken;
    delete userObject.emailVerificationExpires;
    delete userObject.deletedAt;
    return userObject;
};

module.exports = User;
```

### 11. Create Models Index

#### `src/models/index.js`:
```javascript
const { sequelize } = require('../config/database');
const User = require('./User');

const db = {
    sequelize,
    User
};

module.exports = db;
```

### 12. Create Migration Runner Script

#### `src/scripts/run-migrations.js`:
```javascript
const { sequelize } = require('../models');
const path = require('path');
const fs = require('fs');
const { Sequelize } = require('sequelize');

async function runMigrations() {
    try {
        console.log('=================================');
        console.log('Running Database Migrations');
        console.log('=================================\n');

        await sequelize.authenticate();
        console.log('✅ Database connection established\n');

        // Create SequelizeMeta table if not exists
        await sequelize.query(`
            CREATE TABLE IF NOT EXISTS "SequelizeMeta" (
                "name" VARCHAR(255) NOT NULL PRIMARY KEY
            );
        `);
        console.log('✅ Migrations table ready\n');

        // Get all migration files
        const migrationsPath = path.join(__dirname, '../migrations');
        const migrationFiles = fs.readdirSync(migrationsPath)
            .filter(file => file.endsWith('.js'))
            .sort();

        console.log(`📁 Found ${migrationFiles.length} migration files\n`);

        // Get executed migrations
        const [executed] = await sequelize.query(
            'SELECT name FROM "SequelizeMeta" ORDER BY name'
        );
        const executedNames = new Set(executed.map(m => m.name));

        // Run pending migrations
        let pendingCount = 0;
        for (const file of migrationFiles) {
            if (!executedNames.has(file)) {
                pendingCount++;
                console.log(`⏳ Running migration: ${file}`);

                const migration = require(path.join(migrationsPath, file));
                const transaction = await sequelize.transaction();

                try {
                    await migration.up(sequelize.getQueryInterface(), Sequelize);
                    await sequelize.query(
                        'INSERT INTO "SequelizeMeta" (name) VALUES (:name)',
                        { replacements: { name: file }, transaction }
                    );
                    await transaction.commit();
                    console.log(`✅ Completed: ${file}\n`);
                } catch (error) {
                    await transaction.rollback();
                    console.error(`❌ Failed: ${file}`, error.message);
                    throw error;
                }
            } else {
                console.log(`⏭️  Skipping already executed: ${file}`);
            }
        }

        if (pendingCount === 0) {
            console.log('✨ No pending migrations. Database is up to date!\n');
        } else {
            console.log(`✨ Successfully ran ${pendingCount} migration(s)!\n`);
        }

        process.exit(0);
    } catch (error) {
        console.error('\n❌ Migration failed:', error.message);
        process.exit(1);
    }
}

runMigrations();
```

### 13. Create Migration Undo Script

#### `src/scripts/undo-migrations.js`:
```javascript
const { sequelize } = require('../models');
const path = require('path');

async function undoLastMigration() {
    try {
        console.log('=================================');
        console.log('Undoing Last Migration');
        console.log('=================================\n');

        // Get last executed migration
        const [lastMigration] = await sequelize.query(`
            SELECT name FROM "SequelizeMeta" 
            ORDER BY name DESC LIMIT 1
        `);

        if (!lastMigration.length) {
            console.log('No migrations to undo');
            process.exit(0);
        }

        const migrationFile = lastMigration[0].name;
        console.log(`⏳ Undoing migration: ${migrationFile}`);

        const migration = require(path.join(__dirname, '../migrations', migrationFile));
        const transaction = await sequelize.transaction();

        try {
            await migration.down(sequelize.getQueryInterface(), Sequelize);
            await sequelize.query(
                'DELETE FROM "SequelizeMeta" WHERE name = :name',
                { replacements: { name: migrationFile }, transaction }
            );
            await transaction.commit();
            console.log(`✅ Successfully undone: ${migrationFile}\n`);
        } catch (error) {
            await transaction.rollback();
            throw error;
        }

        process.exit(0);
    } catch (error) {
        console.error('\n❌ Failed to undo migration:', error.message);
        process.exit(1);
    }
}

undoLastMigration();
```

### 14. Create User Controller with JWT Authentication

#### `src/controllers/userController.js`:
```javascript
const User = require('../models/User');
const { generateAccessToken, generateRefreshToken, setTokenCookies, clearTokenCookies, verifyRefreshToken } = require('../utils/tokenUtils');

// @desc    Register new user
// @route   POST /api/users/register
// @access  Public
const registerUser = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Please provide name, email and password'
            });
        }

        const existingUser = await User.findOne({ where: { email } });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'Email already registered'
            });
        }

        const user = await User.create({ name, email, password });
        const accessToken = generateAccessToken(user);
        const refreshToken = generateRefreshToken(user);

        // Store refresh token in database
        const refreshTokenExpiry = new Date();
        refreshTokenExpiry.setDate(refreshTokenExpiry.getDate() + 7);
        await user.update({
            refreshToken,
            refreshTokenExpiry
        });

        setTokenCookies(res, accessToken, refreshToken);

        res.status(201).json({
            success: true,
            message: 'User registered successfully',
            data: {
                user: user.getPublicProfile(),
                accessToken
            }
        });
    } catch (error) {
        console.error('Register error:', error);
        res.status(500).json({
            success: false,
            message: 'Error registering user',
            error: error.message
        });
    }
};

// @desc    Login user
// @route   POST /api/users/login
// @access  Public
const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Please provide email and password'
            });
        }

        const user = await User.findOne({ where: { email } });
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        const isPasswordValid = await user.comparePassword(password);
        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        if (!user.isActive) {
            return res.status(401).json({
                success: false,
                message: 'Account is deactivated'
            });
        }

        const accessToken = generateAccessToken(user);
        const refreshToken = generateRefreshToken(user);

        const refreshTokenExpiry = new Date();
        refreshTokenExpiry.setDate(refreshTokenExpiry.getDate() + 7);
        await user.update({
            refreshToken,
            refreshTokenExpiry,
            lastLogin: new Date()
        });

        setTokenCookies(res, accessToken, refreshToken);

        res.status(200).json({
            success: true,
            message: 'Login successful',
            data: {
                user: user.getPublicProfile(),
                accessToken
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Error logging in',
            error: error.message
        });
    }
};

// @desc    Refresh access token
// @route   POST /api/users/refresh-token
// @access  Public
const refreshAccessToken = async (req, res) => {
    try {
        const refreshToken = req.cookies.refresh_token;

        if (!refreshToken) {
            return res.status(401).json({
                success: false,
                message: 'No refresh token provided'
            });
        }

        const decoded = verifyRefreshToken(refreshToken);
        if (!decoded) {
            return res.status(401).json({
                success: false,
                message: 'Invalid or expired refresh token'
            });
        }

        const user = await User.findOne({
            where: {
                id: decoded.id,
                refreshToken: refreshToken
            }
        });

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid refresh token'
            });
        }

        if (user.refreshTokenExpiry && new Date() > user.refreshTokenExpiry) {
            return res.status(401).json({
                success: false,
                message: 'Refresh token expired, please login again'
            });
        }

        const newAccessToken = generateAccessToken(user);

        res.cookie('access_token', newAccessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60 * 1000,
            path: '/'
        });

        res.status(200).json({
            success: true,
            message: 'Access token refreshed successfully',
            data: { accessToken: newAccessToken }
        });
    } catch (error) {
        console.error('Refresh token error:', error);
        res.status(500).json({
            success: false,
            message: 'Error refreshing token',
            error: error.message
        });
    }
};

// @desc    Logout user
// @route   POST /api/users/logout
// @access  Private
const logoutUser = async (req, res) => {
    try {
        if (req.user) {
            await User.update(
                { refreshToken: null, refreshTokenExpiry: null },
                { where: { id: req.user.id } }
            );
        }

        res.clearCookie('access_token', { path: '/' });
        res.clearCookie('refresh_token', { path: '/' });

        res.status(200).json({
            success: true,
            message: 'Logged out successfully'
        });
    } catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({
            success: false,
            message: 'Error logging out',
            error: error.message
        });
    }
};

// @desc    Get all users
// @route   GET /api/users
// @access  Private/Admin
const getAllUsers = async (req, res) => {
    try {
        const users = await User.findAll({
            attributes: { exclude: ['password', 'refreshToken', 'refreshTokenExpiry', 'deletedAt'] }
        });

        res.status(200).json({
            success: true,
            count: users.length,
            data: users
        });
    } catch (error) {
        console.error('Get users error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching users',
            error: error.message
        });
    }
};

// @desc    Get current user profile
// @route   GET /api/users/me
// @access  Private
const getMe = async (req, res) => {
    try {
        res.status(200).json({
            success: true,
            data: req.user.getPublicProfile()
        });
    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching profile',
            error: error.message
        });
    }
};

module.exports = {
    registerUser,
    loginUser,
    refreshAccessToken,
    logoutUser,
    getAllUsers,
    getMe
};
```

### 15. Create Token Utilities

#### `src/utils/tokenUtils.js`:
```javascript
const jwt = require('jsonwebtoken');

const generateAccessToken = (user) => {
    return jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        process.env.JWT_ACCESS_SECRET,
        { expiresIn: process.env.JWT_ACCESS_EXPIRE }
    );
};

const generateRefreshToken = (user) => {
    return jwt.sign(
        { id: user.id, email: user.email, tokenType: 'refresh' },
        process.env.JWT_REFRESH_SECRET,
        { expiresIn: process.env.JWT_REFRESH_EXPIRE }
    );
};

const verifyAccessToken = (token) => {
    try {
        return jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    } catch (error) {
        return null;
    }
};

const verifyRefreshToken = (token) => {
    try {
        return jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    } catch (error) {
        return null;
    }
};

const setTokenCookies = (res, accessToken, refreshToken) => {
    const isProduction = process.env.NODE_ENV === 'production';

    res.cookie('access_token', accessToken, {
        httpOnly: true,
        secure: isProduction,
        sameSite: 'lax',
        maxAge: 60 * 60 * 1000,
        path: '/'
    });

    res.cookie('refresh_token', refreshToken, {
        httpOnly: true,
        secure: isProduction,
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000,
        path: '/'
    });
};

const clearTokenCookies = (res) => {
    res.clearCookie('access_token', { path: '/' });
    res.clearCookie('refresh_token', { path: '/' });
};

module.exports = {
    generateAccessToken,
    generateRefreshToken,
    verifyAccessToken,
    verifyRefreshToken,
    setTokenCookies,
    clearTokenCookies
};
```

### 16. Create Authentication Middleware

#### `src/middleware/auth.js`:
```javascript
const { verifyAccessToken } = require('../utils/tokenUtils');
const User = require('../models/User');

const protect = async (req, res, next) => {
    try {
        const token = req.cookies.access_token;

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Not authorized, no token provided'
            });
        }

        const decoded = verifyAccessToken(token);
        if (!decoded) {
            return res.status(401).json({
                success: false,
                message: 'Not authorized, token expired or invalid'
            });
        }

        const user = await User.findByPk(decoded.id, {
            attributes: { exclude: ['password', 'refreshToken', 'refreshTokenExpiry'] }
        });

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'User not found'
            });
        }

        if (!user.isActive) {
            return res.status(401).json({
                success: false,
                message: 'Account is deactivated'
            });
        }

        req.user = user;
        next();
    } catch (error) {
        console.error('Auth error:', error);
        return res.status(401).json({
            success: false,
            message: 'Not authorized'
        });
    }
};

const authorize = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: `User role ${req.user.role} is not authorized to access this route`
            });
        }
        next();
    };
};

module.exports = { protect, authorize };
```

### 17. Create Error Handler Middleware

#### `src/middleware/errorHandler.js`:
```javascript
const errorHandler = (err, req, res, next) => {
    console.error('Error:', err.stack);

    let error = { ...err };
    error.message = err.message;

    if (err.name === 'SequelizeValidationError') {
        const message = Object.values(err.errors).map(val => val.message).join(', ');
        error.statusCode = 400;
        error.message = message;
    }

    if (err.name === 'SequelizeUniqueConstraintError') {
        error.statusCode = 400;
        error.message = 'Duplicate field value entered';
    }

    const statusCode = error.statusCode || 500;
    const message = error.message || 'Internal Server Error';

    res.status(statusCode).json({
        success: false,
        message,
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
        timestamp: new Date().toISOString()
    });
};

const notFound = (req, res, next) => {
    const error = new Error(`Not Found - ${req.originalUrl}`);
    error.statusCode = 404;
    next(error);
};

module.exports = { errorHandler, notFound };
```

### 18. Create Routes

#### `src/routes/userRoutes.js`:
```javascript
const express = require('express');
const router = express.Router();
const {
    registerUser,
    loginUser,
    refreshAccessToken,
    logoutUser,
    getAllUsers,
    getMe
} = require('../controllers/userController');
const { protect, authorize } = require('../middleware/auth');

// Public routes
router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/refresh-token', refreshAccessToken);

// Protected routes
router.use(protect);
router.post('/logout', logoutUser);
router.get('/me', getMe);
router.get('/', authorize('admin'), getAllUsers);

module.exports = router;
```

### 19. Create Main Server File

#### `src/server.js`:
```javascript
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
    origin: 'http://localhost:3000',
    credentials: true
}));
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Logging
if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
}

// Handle favicon
app.get('/favicon.ico', (req, res) => res.status(204).end());

// Welcome route
app.get('/', (req, res) => {
    res.json({
        success: true,
        message: 'Node.js Backend API with PostgreSQL',
        version: '1.0.0',
        endpoints: {
            users: '/api/users',
            health: '/health'
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
    console.log('=================================\n');
});

// Handle unhandled rejections
process.on('unhandledRejection', (err) => {
    console.error('Unhandled Rejection:', err);
    server.close(() => process.exit(1));
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
    server.close(() => process.exit(1));
});

module.exports = app;
```

### 20. Create Test Environment Script

#### `test-env.js`:
```javascript
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
console.log('DB_PASSWORD:', process.env.DB_PASSWORD ? '✓ Set' : '✗ NOT SET');
console.log('JWT_ACCESS_SECRET:', process.env.JWT_ACCESS_SECRET ? '✓ Set' : '✗ NOT SET');
console.log('JWT_REFRESH_SECRET:', process.env.JWT_REFRESH_SECRET ? '✓ Set' : '✗ NOT SET');
console.log('=================================');
```

### 21. Update package.json

```json
{
  "name": "my-backend-app",
  "version": "1.0.0",
  "description": "Node.js backend with PostgreSQL and JWT authentication",
  "main": "src/server.js",
  "scripts": {
    "start": "node src/server.js",
    "dev": "nodemon src/server.js",
    "migrate": "node src/scripts/run-migrations.js",
    "migrate:undo": "node src/scripts/undo-migrations.js",
    "test:env": "node test-env.js",
    "create-admin": "node src/scripts/create-admin.js"
  },
  "keywords": ["nodejs", "postgresql", "express", "sequelize", "jwt"],
  "author": "",
  "license": "ISC",
  "dependencies": {
    "bcryptjs": "^3.0.3",
    "compression": "^1.8.1",
    "cors": "^2.8.6",
    "dotenv": "^17.3.1",
    "express": "^5.2.1",
    "helmet": "^8.1.0",
    "jsonwebtoken": "^9.0.3",
    "morgan": "^1.10.1",
    "pg": "^8.20.0",
    "pg-hstore": "^2.3.4",
    "sequelize": "^6.37.8",
    "cookie-parser": "^1.4.7"
  },
  "devDependencies": {
    "nodemon": "^3.1.14",
    "sequelize-cli": "^6.6.2"
  }
}
```

### 22. Create Database

```powershell
# Connect to PostgreSQL
psql -U postgres

# Create database (at postgres=# prompt)
CREATE DATABASE myapp_db;

# Verify
\l

# Exit
\q
```

### 23. Run the Application

```powershell
# Install dependencies
npm install

# Test environment variables
npm run test:env

# Run migrations to create tables
npm run migrate

# Run in development mode
npm run dev
```

### 24. Test the API

#### Open a new terminal and test endpoints:

```powershell
# Test root endpoint
curl http://localhost:5000/

# Test health check
curl http://localhost:5000/health

# Register a user
curl -X POST http://localhost:5000/api/users/register `
  -H "Content-Type: application/json" `
  -d '{"name":"John Doe","email":"john@example.com","password":"password123"}' `
  -c cookies.txt

# Login
curl -X POST http://localhost:5000/api/users/login `
  -H "Content-Type: application/json" `
  -d '{"email":"john@example.com","password":"password123"}' `
  -c cookies.txt

# Get current user profile (using cookies from login)
curl http://localhost:5000/api/users/me `
  -b cookies.txt

# Get all users (admin only)
curl http://localhost:5000/api/users/ `
  -b cookies.txt

# Refresh token
curl -X POST http://localhost:5000/api/users/refresh-token `
  -b cookies.txt `
  -c cookies.txt

# Logout
curl -X POST http://localhost:5000/api/users/logout `
  -b cookies.txt
```

## 📁 Project Structure

```
my-backend-app/
├── src/
│   ├── config/
│   │   ├── database.js
│   │   └── sequelize-config.js
│   ├── controllers/
│   │   └── userController.js
│   ├── middleware/
│   │   ├── auth.js
│   │   └── errorHandler.js
│   ├── migrations/
│   │   └── 20240328000000-create-users-table.js
│   ├── models/
│   │   ├── index.js
│   │   └── User.js
│   ├── routes/
│   │   └── userRoutes.js
│   ├── scripts/
│   │   ├── run-migrations.js
│   │   ├── undo-migrations.js
│   │   └── create-admin.js
│   ├── utils/
│   │   └── tokenUtils.js
│   ├── services/
│   └── server.js
├── .env
├── .gitignore
├── test-env.js
├── package.json
└── README.md
```

## 🔧 Troubleshooting

### Common Issues and Solutions:

#### 1. **"psql is not recognized"**
```powershell
# Add PostgreSQL to PATH
[Environment]::SetEnvironmentVariable("Path", $env:Path + ";C:\Program Files\PostgreSQL\18\bin", "User")
```

#### 2. **"Password authentication failed"**
```powershell
# Reset PostgreSQL password
psql -U postgres
ALTER USER postgres WITH PASSWORD 'root';
\q
```

#### 3. **"Database does not exist"**
```powershell
# Create database
psql -U postgres -c "CREATE DATABASE myapp_db;"
```

#### 4. **"Port 5000 already in use"**
Change PORT in `.env` file:
```
PORT=5001
```

#### 5. **"Connection refused"**
```powershell
# Start PostgreSQL service
net start postgresql-18
```

#### 6. **Migration errors**
```powershell
# Check migration status
npm run migrate

# Undo last migration if needed
npm run migrate:undo
```

## 📚 API Documentation

### Endpoints

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/` | Welcome message | Public |
| GET | `/health` | Health check | Public |
| POST | `/api/users/register` | Register new user | Public |
| POST | `/api/users/login` | Login user | Public |
| POST | `/api/users/refresh-token` | Refresh access token | Public |
| POST | `/api/users/logout` | Logout user | Private |
| GET | `/api/users/me` | Get current user profile | Private |
| GET | `/api/users` | Get all users | Private/Admin |

### Token Management

- **Access Token**: Valid for 1 hour, stored in HTTP-only cookie
- **Refresh Token**: Valid for 7 days, stored in HTTP-only cookie
- **Auto-refresh**: Use `/api/users/refresh-token` endpoint

## 🚀 Next Steps

1. Add email verification
2. Implement password reset functionality
3. Add rate limiting
4. Create more models (products, orders, etc.)
5. Add input validation with Joi
6. Implement logging with Winston
7. Write unit tests
8. Containerize with Docker
9. Deploy to cloud platforms

## ✅ Verification Checklist

- [ ] Node.js installed (v14+)
- [ ] PostgreSQL installed and running
- [ ] Database created
- [ ] .env file configured
- [ ] Dependencies installed
- [ ] Migrations run successfully
- [ ] Server starts without errors
- [ ] Database connection successful
- [ ] User registration works
- [ ] User login works
- [ ] Token refresh works
- [ ] Protected routes work with authentication

## 🎉 Congratulations!

Your Node.js backend with PostgreSQL and JWT authentication is now fully set up with:
- ✅ Complete database migration system
- ✅ JWT access and refresh tokens
- ✅ HTTP-only cookie storage
- ✅ User registration and login
- ✅ Token refresh mechanism
- ✅ Protected routes
- ✅ Role-based authorization
- ✅ Error handling
- ✅ Database indexes for performance

Your application is ready for production development! 🚀