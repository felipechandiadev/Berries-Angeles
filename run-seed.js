#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const environment = process.argv[2] || 'test';
const profile = process.argv[3] || process.env.SEED_PROFILE || 'full';
const envLocal = path.resolve('.env.local');
const envExample = path.resolve('.env.example');

if (fs.existsSync(envLocal)) {
  require('dotenv').config({ path: envLocal });
} else if (fs.existsSync(envExample)) {
  require('dotenv').config({ path: envExample });
}

process.env.SEED_PROFILE = profile;

console.log(`Running seed for environment: ${environment}, profile: ${profile}`);
execSync(`npx tsx data/seed/seed.ts ${environment} ${profile}`, { stdio: 'inherit' });
