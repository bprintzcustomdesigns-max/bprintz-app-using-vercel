const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { items, customerEmail, fulfillmentMethod } = req.body;

    const lineItems = items.map((item) => ({
      price_data: {
        currency: 'aud',
        product_data: {
          name: item.name,
          description: `Size: ${item.size || 'Standard'} | Print: ${item.printType || 'Custom'}`,
        },
        unit_amount: Math.round(item.price * 100),
      },
      quantity: item.quantity,
    }));

    if (fulfillmentMethod === 'shipping') {
      lineItems.push({
        price_data: {
          currency: 'aud',
          product_data: { name: 'Standard Shipping (Australia)' },
          unit_amount: 1000, // $10.00 AUD
        },
        quantity: 1,
      });
    }

    const origin = req.headers.origin || 'https://bprintz-app-using-vercel.vercel.app';

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      customer_email: customerEmail || undefined,
      line_items: lineItems,
      metadata: {
        fulfillment: fulfillmentMethod || 'pickup',
      },
      success_url: `${origin}/?payment=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/?payment=cancelled`,
    });

    return res.status(200).json({ url: session.url });
  } catch (err) {
    console.error('Stripe Checkout Error:', err);
    return res.status(500).json({ error: err.message });
  }
};
Use code with caution.
Click Commit changes.

2. Update sw.js on GitHub

Open sw.js, click the pencil icon (Edit), and add this single line right inside self.addEventListener('fetch', ...) so your offline cache doesn't block /api/checkout:
javascript
self.addEventListener('fetch', (event) => {
  if (event.request.url.includes('/api/')) return;
