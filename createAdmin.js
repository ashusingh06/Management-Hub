import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const USERS_FILE = path.join(__dirname, 'data', 'users.json');

async function createAdmin() {
  const args = process.argv.slice(2);
  const email = (args[0] || 'aashishsinghh06@gmail.com').toLowerCase().trim();
  const password = args[1] || 'admin2026';
  const name = args[2] || 'Aashish Singh (Administrator)';

  if (!fs.existsSync(path.join(__dirname, 'data'))) {
    fs.mkdirSync(path.join(__dirname, 'data'), { recursive: true });
  }

  let users = [];
  if (fs.existsSync(USERS_FILE)) {
    try {
      users = JSON.parse(fs.readFileSync(USERS_FILE, 'utf-8'));
    } catch (e) {
      users = [];
    }
  }

  // Hash password securely with bcrypt (10 rounds)
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  const existingIndex = users.findIndex(u => u.email.toLowerCase() === email);

  if (existingIndex !== -1) {
    users[existingIndex].password = hashedPassword;
    users[existingIndex].role = 'admin';
    users[existingIndex].name = name;
    users[existingIndex].updatedAt = new Date().toISOString();
    console.log(`\n✓ Admin account updated successfully!`);
  } else {
    const newAdmin = {
      id: Date.now().toString(),
      name,
      email,
      password: hashedPassword,
      role: 'admin',
      createdAt: new Date().toISOString()
    };
    users.unshift(newAdmin);
    console.log(`\n✓ New Admin account created successfully!`);
  }

  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));

  console.log(`--------------------------------------------------`);
  console.log(` Admin Email : ${email}`);
  console.log(` Role        : admin`);
  console.log(` Password    : [HIDDEN - Bcrypt Hash Stored]`);
  console.log(` Storage     : ${USERS_FILE}`);
  console.log(`--------------------------------------------------\n`);
}

createAdmin();
