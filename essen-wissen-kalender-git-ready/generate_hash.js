const crypto = require('crypto');
const { promisify } = require('util');
const scrypt = promisify(crypto.scrypt);

(async () => {
  const password = 'password123';
  const salt = crypto.randomBytes(16).toString('hex');
  const key = await scrypt(password, salt, 64, { N: 16384, r: 8, p: 1 });
  const hash = `scrypt$${salt}$${key.toString('hex')}`;
  console.log(hash);
})();
