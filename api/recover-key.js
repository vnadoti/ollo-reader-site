const { Stripe } = require("stripe");
const { generateDeterministicLicenseKey, sendLicenseEmail } = require("./_license-helper");

/**
 * Permite que qualquer comprador recupere suas chaves de licença a qualquer momento
 * digitando apenas o e-mail usado na compra (e reenvia por e-mail se desejar).
 */
module.exports = async function handler(req, res) {
  const email = (req.query.email || req.body?.email || "").trim().toLowerCase();
  if (!email || !email.includes("@")) {
    return res.status(400).json({ error: "Informe um endereço de e-mail válido." });
  }

  const secretKey = process.env.STRIPE_SECRET_KEY ? process.env.STRIPE_SECRET_KEY.trim() : "";
  if (!secretKey) {
    return res.status(500).json({ error: "STRIPE_SECRET_KEY não configurada." });
  }

  try {
    const stripe = new Stripe(secretKey);
    const sessions = await stripe.checkout.sessions.list({ limit: 50 });

    const matchingSessions = sessions.data.filter((s) => {
      const sEmail = (s.customer_details?.email || s.customer_email || "").trim().toLowerCase();
      const isPaid =
        s.payment_status === "paid" ||
        s.payment_status === "no_payment_required" ||
        s.status === "complete";
      return sEmail === email && isPaid;
    });

    if (matchingSessions.length === 0) {
      return res.status(404).json({
        found: false,
        message: "Nenhuma compra confirmada foi encontrada para este e-mail.",
      });
    }

    const latest = matchingSessions[0];
    const licenseKey = generateDeterministicLicenseKey(latest.id);
    const customerName = latest.customer_details?.name || "";

    let emailResult = { sent: false };
    try {
      emailResult = await sendLicenseEmail({
        toEmail: email,
        customerName,
        licenseKey,
      });
    } catch (err) {
      emailResult = { sent: false, error: err.message };
    }

    return res.status(200).json({
      found: true,
      email,
      license_key: licenseKey,
      email_sent: emailResult.sent,
      email_debug: emailResult,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
