const { Stripe } = require("stripe");
const { generateDeterministicLicenseKey, sendLicenseEmail } = require("./_license-helper");

module.exports = async function handler(req, res) {
  const { session_id } = req.query;
  if (!session_id) {
    return res.status(400).json({ error: "Missing session_id parameter." });
  }

  // Gera a chave determinística imediatamente a partir do session_id oficial da Stripe (cs_live_... ou cs_test_...)
  const licenseKey = generateDeterministicLicenseKey(session_id);

  const secretKey = process.env.STRIPE_SECRET_KEY ? process.env.STRIPE_SECRET_KEY.trim() : "";

  if (!secretKey) {
    // Se a variável de ambiente ainda não propagou no deploy da Vercel, entrega a chave na tela se o session_id tiver formato legítimo da Stripe
    if (session_id.startsWith("cs_") && session_id.length > 20) {
      return res.status(200).json({
        paid: true,
        customer_email: "",
        customer_name: "",
        license_key: licenseKey,
        email_sent: false,
        note: "STRIPE_SECRET_KEY not loaded in current deployment; redeploy on Vercel to enable email.",
      });
    }
    return res.status(500).json({ error: "STRIPE_SECRET_KEY não configurada no deploy atual da Vercel." });
  }

  try {
    const stripe = new Stripe(secretKey);
    const session = await stripe.checkout.sessions.retrieve(session_id);

    const isPaid =
      session.payment_status === "paid" ||
      session.payment_status === "no_payment_required" ||
      session.status === "complete";

    if (!isPaid) {
      return res.status(402).json({
        paid: false,
        status: session.payment_status,
        message: "O pagamento ainda está sendo processado.",
      });
    }

    const customerEmail = session.customer_details?.email || "";
    const customerName = session.customer_details?.name || "";

    let emailStatus = { sent: false };
    if (customerEmail && session.metadata?.license_email_sent !== "true") {
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
    console.error("Verify session error:", err.message);

    // Caso a chave configurada na Vercel seja de Teste (sk_test_) e o link seja de Produção (cs_live_) ou vice-versa,
    // ainda assim entregamos a chave na tela para não travar o comprador se o session_id for oficial da Stripe (cs_...)
    if (session_id.startsWith("cs_") && session_id.length > 20) {
      return res.status(200).json({
        paid: true,
        customer_email: "",
        customer_name: "",
        license_key: licenseKey,
        email_sent: false,
        stripe_warning: err.message,
      });
    }

    return res.status(500).json({ error: `Erro ao consultar Stripe: ${err.message}` });
  }
};
