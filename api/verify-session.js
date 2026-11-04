const { Stripe } = require("stripe");
const { generateDeterministicLicenseKey, sendLicenseEmail } = require("./_license-helper");

module.exports = async function handler(req, res) {
  const { session_id } = req.query;
  if (!session_id) {
    return res.status(400).json({ error: "Missing session_id parameter." });
  }

  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    const session = await stripe.checkout.sessions.retrieve(session_id);

    if (session.payment_status !== "paid") {
      return res.status(402).json({
        paid: false,
        status: session.payment_status,
        message: "O pagamento ainda está sendo processado.",
      });
    }

    const licenseKey = generateDeterministicLicenseKey(session.id);
    const customerEmail = session.customer_details?.email || "";
    const customerName = session.customer_details?.name || "";

    // Dispara também por e-mail caso ainda não tenha sido enviado pelo webhook
    let emailStatus = { sent: false };
    if (customerEmail && !session.metadata?.license_email_sent) {
      try {
        emailStatus = await sendLicenseEmail({
          toEmail: customerEmail,
          customerName,
          licenseKey,
        });
        if (emailStatus.sent) {
          await stripe.checkout.sessions.update(session.id, {
            metadata: {
              ...session.metadata,
              license_key: licenseKey,
              license_email_sent: "true",
            },
          });
        }
      } catch (emailErr) {
        console.error("Email send warning:", emailErr.message);
      }
    }

    return res.status(200).json({
      paid: true,
      customer_email: customerEmail,
      customer_name: customerName,
      license_key: licenseKey,
      email_sent: emailStatus.sent || session.metadata?.license_email_sent === "true",
    });
  } catch (err) {
    console.error("Verify session error:", err);
    return res.status(500).json({ error: "Não foi possível verificar a sessão de pagamento." });
  }
};
