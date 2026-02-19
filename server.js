import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3001;
const DB_PATH = path.join(__dirname, 'database.json');

app.use(cors());
app.use(bodyParser.json());

// Initialize database file
if (!fs.existsSync(DB_PATH)) {
    fs.writeFileSync(DB_PATH, JSON.stringify([], null, 2));
}

const readDB = () => {
    const data = fs.readFileSync(DB_PATH, 'utf-8');
    return JSON.parse(data);
};

const writeDB = (data) => {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
};

// --- API Routes ---

// Register
app.post('/api/register', (req, res) => {
    const { account, password } = req.body;
    const users = readDB();

    if (users.find(u => u.account === account)) {
        return res.status(400).json({ message: '帳號已存在' });
    }

    const newUser = {
        account,
        password,
        holyPearl: 0,
        magicCore: 0,
        leaf: 0,
        goldCoin: 0,
        createdAt: new Date().toISOString()
    };

    users.push(newUser);
    writeDB(users);
    res.status(201).json({ message: '註冊成功', user: newUser });
});

// Login
app.post('/api/login', (req, res) => {
    const { account, password } = req.body;
    const users = readDB();

    const user = users.find(u => u.account === account && u.password === password);
    if (!user) {
        return res.status(401).json({ message: '帳號或密碼錯誤' });
    }

    res.json({ message: '登入成功', user });
});

// Update User Data (Currency, etc.)
app.post('/api/update-user', (req, res) => {
    const updatedUser = req.body;
    let users = readDB();

    const index = users.findIndex(u => u.account === updatedUser.account);
    if (index === -1) {
        return res.status(404).json({ message: '找不到該用戶' });
    }

    // Keep the password from the DB, only update other fields
    users[index] = { ...users[index], ...updatedUser, password: users[index].password };
    writeDB(users);
    res.json({ message: '同步成功', user: users[index] });
});

app.listen(PORT, () => {
    console.log(`Backend server is running on http://localhost:${PORT}`);
});
