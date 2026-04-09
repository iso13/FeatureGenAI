
import { Pool } from 'pg';
import { readFileSync } from 'fs';

async function runMigration() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      require: true,
      rejectUnauthorized: false
    }
  });

  try {
    const client = await pool.connect();
    
    console.log('Running migration...');
    
    // Read and execute the migration
    const migrationSQL = readFileSync('./migrations/0002_add_company_id_to_users.sql', 'utf8');
    await client.query(migrationSQL);
    
    console.log('Migration completed successfully!');
    
    client.release();
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runMigration();
