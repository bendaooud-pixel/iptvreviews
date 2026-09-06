const express = require('express');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'data', 'posts.json');

const ADMIN_USER = process.env.ADMIN_USER || 'admin';
const ADMIN_PASS = process.env.ADMIN_PASS || 'admin123';
const SECRET = process.env.JWT_SECRET || crypto.randomBytes(32).toString('hex');

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

function readPosts() {
    const data = fs.readFileSync(DATA_FILE, 'utf8');
    return JSON.parse(data);
}

function writePosts(posts) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(posts, null, 2));
}

function generateToken(username) {
    const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
    const payload = Buffer.from(JSON.stringify({ user: username, iat: Date.now() })).toString('base64url');
    const signature = crypto.createHmac('sha256', SECRET).update(header + '.' + payload).digest('base64url');
    return header + '.' + payload + '.' + signature;
}

function verifyToken(token) {
    if (!token) return false;
    const parts = token.split('.');
    if (parts.length !== 3) return false;
    const signature = crypto.createHmac('sha256', SECRET).update(parts[0] + '.' + parts[1]).digest('base64url');
    return signature === parts[2];
}

function authMiddleware(req, res, next) {
    const auth = req.headers.authorization;
    if (!auth || !auth.startsWith('Bearer ')) return res.status(401).json({ error: 'Unauthorized' });
    if (!verifyToken(auth.slice(7))) return res.status(401).json({ error: 'Invalid token' });
    next();
}

function sanitize(str) {
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function sanitizeHTML(html) {
    return String(html)
        .replace(/<script[\s\S]*?<\/script>/gi, '')
        .replace(/<style[\s\S]*?<\/style>/gi, '')
        .replace(/<iframe[\s\S]*?<\/iframe>/gi, '')
        .replace(/<object[\s\S]*?<\/object>/gi, '')
        .replace(/<embed[\s\S]*?>/gi, '')
        .replace(/<form[\s\S]*?<\/form>/gi, '')
        .replace(/on\w+\s*=\s*"[^"]*"/gi, '')
        .replace(/on\w+\s*=\s*'[^']*'/gi, '')
        .replace(/javascript\s*:/gi, '');
}

// --- API Routes ---

app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    if (username === ADMIN_USER && password === ADMIN_PASS) {
        const token = generateToken(username);
        res.json({ token });
    } else {
        res.status(401).json({ error: 'Invalid credentials' });
    }
});

app.get('/api/posts', (req, res) => {
    const posts = readPosts();
    res.json(posts);
});

app.get('/api/posts/:id', (req, res) => {
    const posts = readPosts();
    const post = posts.find(p => p.id === parseInt(req.params.id));
    if (!post) return res.status(404).json({ error: 'Post not found' });
    post.views++;
    writePosts(posts);
    res.json(post);
});

app.post('/api/posts', authMiddleware, (req, res) => {
    const { title, excerpt, content, author } = req.body;
    if (!title || !excerpt || !content || !author) {
        return res.status(400).json({ error: 'All fields are required' });
    }
    const posts = readPosts();
    const post = {
        id: Date.now(),
        title: sanitize(title),
        excerpt: sanitize(excerpt),
        content: sanitizeHTML(content),
        author: sanitize(author),
        date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }),
        views: 0,
        rating: (Math.random() + 4).toFixed(1)
    };
    posts.unshift(post);
    writePosts(posts);
    res.status(201).json(post);
});

app.delete('/api/posts/:id', authMiddleware, (req, res) => {
    let posts = readPosts();
    const len = posts.length;
    posts = posts.filter(p => p.id !== parseInt(req.params.id));
    if (posts.length === len) return res.status(404).json({ error: 'Post not found' });
    writePosts(posts);
    res.json({ success: true });
});

app.get('/api/search', (req, res) => {
    const q = (req.query.q || '').toLowerCase().trim();
    if (!q) return res.json(readPosts());
    const posts = readPosts().filter(p =>
        p.title.toLowerCase().includes(q) ||
        p.excerpt.toLowerCase().includes(q) ||
        p.content.toLowerCase().includes(q) ||
        p.author.toLowerCase().includes(q)
    );
    res.json(posts);
});

app.listen(PORT, () => {
    console.log(`IPTV Reviews server running at http://localhost:${PORT}`);
});
