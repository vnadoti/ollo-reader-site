const { Stripe } = require("stripe");
const { generateDeterministicLicenseKey, sendLicenseEmail } = require("./_license-helper");

module.exports.config = {
  api: {
    bodyParser: false,
  },
};

function getRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (chunk) => chunks.push(chunk));
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).send("Method Not Allowed");
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;
  try {
    const rawBody = await getRawBody(req);
    if (endpointSecret) {
      const signature = req.headers["stripe-signature"];
      event = stripe.webhooks.constructEvent(rawBody, signature, endpointSecret);
    } else {
      event = JSON.parse(rawBody.toString("utf8"));
    }
  } catch (err) {
    console.error("Webhook signature verification failed:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (
    event.type === "checkout.session.completed" ||
    event.type === "checkout.session.async_payment_succeeded"
  ) {
    const session = event.data.object;

    if (session.payment_status === "paid") {
      const licenseKey = generateDeterministicLicenseKey(session.id);
      const customerEmail = session.customer_details?.email || "";
      const customerName = session.customer_details?.name || "";

      if (customerEmail && session.metadata?.license_email_sent !== "true") {
        try {
          const emailRes = await sendLicenseEmail({
            toEmail: customerEmail,
            customerName,
            licenseKey,
          });

          if (emailRes.sent) {
            await stripe.checkout.sessions.update(session.id, {
              metadata: {
                ...session.metadata,
                license_key: licenseKey,
                license_email_sent: "true",
              },
            });
          }
        } catch (err) {
          console.error("Failed to send license email via webhook:", err.message);
        }
      }
    }
  }

  return res.status(200).json({ received: true });
};
