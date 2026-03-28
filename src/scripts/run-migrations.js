const { sequelize } = require('../models');
const path = require('path');
const fs = require('fs');
const { Sequelize } = require('sequelize');

async function runMigrations() {
  try {
    console.log('=================================');
    console.log('Running Database Migrations');
    console.log('=================================\n');

    // Test connection
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
    console.error(error);
    process.exit(1);
  }
}

runMigrations();