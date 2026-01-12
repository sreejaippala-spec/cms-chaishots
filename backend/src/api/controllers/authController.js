const db = require('../../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_key_123';

exports.login = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        // 1. Find User
        const user = await db('users').where({ email }).first();
        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // 2. Output Check (for debug if needed, remove in prod)
        // console.log('Checking password for', email);

        // 3. Compare Password
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // 4. Generate Token
        const token = jwt.sign(
            { id: user.id, role: user.role, email: user.email },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({ token, role: user.role, email: user.email });
    } catch (err) {
        next(err);
    }
};
