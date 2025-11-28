// สร้าง bcrypt hash สำหรับรหัสผ่าน demo1234
const bcrypt = require('bcryptjs');

const password = 'demo1234';
const hash = bcrypt.hashSync(password, 10);

console.log('Password:', password);
console.log('Hash:', hash);
console.log('\nTest verification:', bcrypt.compareSync(password, hash));
