// Seed script to generate password hashes for test users
// Run: node seed-passwords.js

const bcrypt = require('bcryptjs');

const password = 'password123';
const saltRounds = 10;

async function generateHash() {
    const hash = await bcrypt.hash(password, saltRounds);
    console.log('Password:', password);
    console.log('Hash:', hash);
    console.log('\nUse this hash in schema.sql for all test users');
}

generateHash().catch(console.error);
