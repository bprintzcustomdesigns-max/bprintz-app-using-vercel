export const config = {
  runtime: 'edge',
};

export default async function handler(req) {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const secretKey = (process.env.STRIPE_SECRET_KEY || '').trim();
    if (!secretKey) {
      return new Response(JSON.stringify({ error: 'Missing STRIPE_SECRET_KEY in Vercel' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const body = await req.json();
    const items = body.items || [];
    const customerEmail = body.customerEmail || '';
    const origin = req.headers.get('origin') || 'https://vercel.app';

    if (!items.length) {
      return new Response(JSON.stringify({ error: 'Your cart is empty' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const params = new URLSearchParams();
    params.append('mode', 'payment');
    params.append('payment_method_types[]', 'card');
    params.append('success_url', `${origin}/?payment=success`);
    params.append('cancel_url', `${origin}/?payment=cancelled`);

    if (customerEmail.includes('@')) {
      params.append('customer_email', customerEmail.trim());
    }

    items.forEach((item, index) => {
      const unitAmount = Math.max(50, Math.round(Number(item.price || 35) * 100));
      params.append(`line_items[${index}][price_data][currency]`, 'aud');
      params.append(`line_items[${index}][price_data][product_data][name]`, item.name || 'Custom Garment');
      params.append(`line_items[${index}][price_data][unit_amount]`, String(unitAmount));
      params.append(`line_items[${index}][quantity]`, String(item.quantity || 1));
    });

    const stripeRes = await fetch('https://stripe.com', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${secretKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    const session = await stripeRes.json();

    if (!stripeRes.ok) {
      return new Response(JSON.stringify({ error: session.error?.message || 'Stripe error' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ url: session.url }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message || 'Server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
