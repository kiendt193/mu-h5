'use strict';
// External durable storage for MU H5 game state. DATABASE_URL is set as a
// Render environment variable, never committed to GitHub.
const {Pool}=require('pg');

async function connect(connectionString){
  if(!connectionString) throw new Error('DATABASE_URL is required');
  const uri=new URL(connectionString);
  if(!['postgres:','postgresql:'].includes(uri.protocol)) throw new Error('DATABASE_URL must be PostgreSQL');
  if(!uri.hostname) throw new Error('DATABASE_URL is missing database host');
  // Use verified TLS certificates; remove URI SSL parameters that can override
  // the explicit node-postgres SSL verification setting.
  for(const key of ['sslmode','sslcert','sslkey','sslrootcert']) uri.searchParams.delete(key);
  const pool=new Pool({
    connectionString:uri.toString(),
    ssl:{rejectUnauthorized:true},
    max:3,
    connectionTimeoutMillis:20000,
    idleTimeoutMillis:30000,
    keepAlive:true
  });
  pool.on('error',err=>console.error('PostgreSQL idle connection error:',err.code||err.message));
  try {
    await pool.query(`CREATE TABLE IF NOT EXISTS mu_game_state (
      id integer PRIMARY KEY CHECK (id=1),
      payload jsonb NOT NULL,
      updated_at timestamptz NOT NULL DEFAULT now()
    )`);
  } catch(err){ await pool.end(); throw err; }
  return {
    async read(){
      const result=await pool.query('SELECT payload FROM mu_game_state WHERE id=1');
      if(!result.rowCount) return null;
      const payload=result.rows[0].payload;
      if(!payload||!Array.isArray(payload.users)) throw new Error('Invalid saved MU H5 database state');
      return payload;
    },
    async write(bytes){
      await pool.query(`INSERT INTO mu_game_state (id,payload,updated_at)
        VALUES (1,$1::jsonb,now())
        ON CONFLICT(id) DO UPDATE SET payload=EXCLUDED.payload,updated_at=now()`,[bytes]);
    },
    async close(){await pool.end();}
  };
}
module.exports={connect};
