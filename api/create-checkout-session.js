const { Stripe } = require("stripe");

module.exports = async function handler(req, res) {
  if (req.method !== "POST" && req.method !== "GET") {
    res.setHeader("Allow", "POST, GET");
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    const domain = process.env.DOMAIN || `https://${req.headers.host}`;
    const mode = "payment";

    const sessionParams = {
      ui_mode: "hosted_page",
      mode,
      billing_address_collection: "auto",
      phone_number_collection: {
        enabled: true,
      },
      automatic_tax: {
        enabled: true,
      },
      allow_promotion_codes: true,
      submit_type: "auto",
      consent_collection: {
        promotions: "auto",
      },
      branding_settings: {
        background_color: "#ffffff",
        button_color: "#ff0000",
        font_family: "default",
        border_style: "rounded",
        logo: {
          type: "file",
          file: "file_1UY7GfK8pshXJmPC5YiM6gc0",
        },
      },
      success_url: `${domain}/sucesso.html?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${domain}/#precos`,
      line_items: [
        {
          price: process.env.STRIPE_PRICE_ID || "price_...",
          quantity: 1,
        },
      ],
    };

    if (mode === "subscription") {
      sessionParams.payment_method_collection = "always";
    }

    const session = await stripe.checkout.sessions.create(sessionParams);
    return res.redirect(303, session.url);
  } catch (err) {
    console.error("Stripe Checkout Error:", err);
    return res.status(500).json({ error: err.message });
  }
};
