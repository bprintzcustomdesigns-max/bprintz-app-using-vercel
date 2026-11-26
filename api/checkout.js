module.exports = async function handler(req, res) {
if (req.method !== 'POST') {
return res.status(405).json({ error: 'Method not allowed' });
}
try {
const secretKey = (process.env.STRIPE_SECRET_KEY || '').trim();
if (!secretKey) {
return res.status(500).json({ error: 'Missing STRIPE_SECRET_KEY in Vercel' });
}
