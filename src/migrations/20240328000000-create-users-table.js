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
        allowNull: false,
        comment: 'Unique identifier for the user'
      },
      name: {
        type: Sequelize.STRING(100),
        allowNull: false,
        validate: {
          notEmpty: true,
          len: [2, 100]
        },
        comment: 'Full name of the user'
      },
      email: {
        type: Sequelize.STRING(255),
        allowNull: false,
        unique: true,
        validate: {
          isEmail: true,
          notEmpty: true
        },
        comment: 'Email address (unique)'
      },
      password: {
        type: Sequelize.STRING(255),
        allowNull: false,
        comment: 'Hashed password'
      },
      role: {
        type: Sequelize.ENUM('user', 'admin'),
        defaultValue: 'user',
        allowNull: false,
        comment: 'User role for authorization'
      },
      isActive: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
        allowNull: false,
        comment: 'Whether the account is active'
      },
      refreshToken: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'JWT refresh token for session management'
      },
      refreshTokenExpiry: {
        type: Sequelize.DATE,
        allowNull: true,
        comment: 'Expiration date for refresh token'
      },
      
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
        comment: 'Record creation timestamp'
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
        comment: 'Record last update timestamp'
      },
      deletedAt: {
        type: Sequelize.DATE,
        allowNull: true,
        comment: 'Soft delete timestamp'
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

    

    // Add comment on table
    await queryInterface.sequelize.query(`
      COMMENT ON TABLE "Users" IS 'Stores user account information and authentication details';
    `);
  },

  down: async (queryInterface, Sequelize) => {
    // Remove indexes
    await queryInterface.removeIndex('Users', 'users_email_index');
    await queryInterface.removeIndex('Users', 'users_role_index');
    await queryInterface.removeIndex('Users', 'users_active_index');
    await queryInterface.removeIndex('Users', 'users_created_at_index');
    await queryInterface.removeIndex('Users', 'users_email_verified_index');
    
    // Drop the table
    await queryInterface.dropTable('Users');
    
    // Drop the ENUM type
    await queryInterface.sequelize.query(`
      DROP TYPE IF EXISTS "enum_Users_role";
    `);
  }
};