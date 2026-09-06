require('dotenv').config();
const express = require('express');
const path = require('path');
const crypto = require('crypto');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const PORT = process.env.PORT || 3000;

const ADMIN_USER = process.env.ADMIN_USER || 'admin';
const ADMIN_PASS = process.env.ADMIN_PASS || 'admin123';
const SECRET = process.env.JWT_SECRET || crypto.randomBytes(32).toString('hex');

// Supabase client using service-role key (server-side only, never exposed to browser)
const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

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

app.get('/api/posts', async (req, res) => {
    const { data, error } = await supabase
        .from('posts')
        .select('*')
        .order('id', { ascending: false });
    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
});

app.get('/api/posts/:id', async (req, res) => {
    const id = parseInt(req.params.id);
    const { data: post, error } = await supabase
        .from('posts')
        .select('*')
        .eq('id', id)
        .single();
    if (error || !post) return res.status(404).json({ error: 'Post not found' });

    await supabase
        .from('posts')
        .update({ views: post.views + 1 })
        .eq('id', id);

    post.views++;
    res.json(post);
});

app.post('/api/posts', authMiddleware, async (req, res) => {
    const { title, excerpt, content, author } = req.body;
    if (!title || !excerpt || !content || !author) {
        return res.status(400).json({ error: 'All fields are required' });
    }
    const post = {
        title: sanitize(title),
        excerpt: sanitize(excerpt),
        content: sanitizeHTML(content),
        author: sanitize(author),
        date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }),
        views: 0,
        rating: parseFloat((Math.random() + 4).toFixed(1))
    };
    const { data, error } = await supabase
        .from('posts')
        .insert(post)
        .select()
        .single();
    if (error) return res.status(500).json({ error: error.message });
    res.status(201).json(data);
});

app.delete('/api/posts/:id', authMiddleware, async (req, res) => {
    const id = parseInt(req.params.id);
    const { data, error } = await supabase
        .from('posts')
        .delete()
        .eq('id', id)
        .select();
    if (error) return res.status(500).json({ error: error.message });
    if (!data || data.length === 0) return res.status(404).json({ error: 'Post not found' });
    res.json({ success: true });
});

app.get('/api/search', async (req, res) => {
    const q = (req.query.q || '').toLowerCase().trim();
    if (!q) {
        const { data, error } = await supabase
            .from('posts')
            .select('*')
            .order('id', { ascending: false });
        if (error) return res.status(500).json({ error: error.message });
        return res.json(data);
    }
    const { data, error } = await supabase
        .from('posts')
        .select('*')
        .or(`title.ilike.%${q}%,excerpt.ilike.%${q}%,content.ilike.%${q}%,author.ilike.%${q}%`)
        .order('id', { ascending: false });
    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
});

app.listen(PORT, () => {
    console.log(`IPTV Reviews server running at http://localhost:${PORT}`);
});
