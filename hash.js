const bcrypt = require('bcryptjs');

// The password you want to use
const password = 'admin';

// Generate a "salt"
const salt = bcrypt.genSaltSync(10);

// Create the hash
const hash = bcrypt.hashSync(password, salt);

console.log('--- Your New Admin Hash ---');
console.log(hash);
console.log('-----------------------------');