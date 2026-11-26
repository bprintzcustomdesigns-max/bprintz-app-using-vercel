module.exports = async function handler(req, res) {
if (req.method !== 'POST') {
return res.status(405).json({ error: 'Method not allowed' });
}
try {
const secretKey = (process.env.STRIPE_SECRET_KEY || '').trim();
if (!secretKey) {
return res.status(500).json({ error: 'Missing STRIPE_SECRET_KEY' });
}
const { items, customerEmail } = req.body;
const origin = req.headers.origin || 'vercel.app';
const params = new URLSearchParams();
params.append('mode', 'payment');
params.append('payment_method_types[]', 'card');
params.append('success_url', origin + '/?payment=success');
params.append('cancel_url', origin + '/?payment=cancelled');
if (customerEmail && customerEmail.includes('@')) {
params.append('customer_email', customerEmail.trim());
}
items.forEach((item, index) => {
const unitAmount = Math.max(50, Math.round(Number(item.price || 35) * 100));
params.append('line_items[' + index + '][price_data][currency]', 'aud');
params.append('line_items[' + index + '][price_data][product_data][name]', item.name || 'Custom Garment');
params.append('line_items[' + index + '][price_data][unit_amount]', String(unitAmount));
params.append('line_items[' + index + '][quantity]', String(item.quantity || 1));
});
const stripeRes = await fetch('stripe.com', {
method: 'POST',
headers: {
'Authorization': 'Bearer ' + secretKey,
'Content-Type': 'application/x-www-form-urlencoded'
},
body: params.toString()
});
const session = await stripeRes.json();
if (!stripeRes.ok) {
return res.status(400).json({ error: session.error?.message || 'Stripe error' });
}
