const crypto = require("crypto");
const { Stripe } = require("stripe");

const SECRET_SALT = "OLLO_READER_NADOTI_2026_V1_SALT_#99182";
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function computeChecksumBlock(block1, block2) {
  const payload = `OLLO|${block1.toUpperCase()}|${block2.toUpperCase()}|${SECRET_SALT}`;
  const hash = crypto.createHash("sha256").update(payload, "utf8").digest();
  let result = "";
  for (let i = 0; i < 4; i++) {
    result += ALPHABET[hash[i] % ALPHABET.length];
  }
  return result;
}

/**
 * Gera uma chave determinística e única vinculada ao ID da sessão paga da Stripe.
 * Assim, mesmo que o comprador recarregue a página de sucesso, ele sempre verá a mesma chave válida.
 */
function generateDeterministicLicenseKey(sessionId) {
  const seedHash = crypto
    .createHash("sha256")
    .update(`STRIPE_SESSION|${sessionId}|${SECRET_SALT}`, "utf8")
    .digest();

  let b1 = "";
  let b2 = "";
  for (let i = 0; i < 4; i++) {
    b1 += ALPHABET[seedHash[i] % ALPHABET.length];
    b2 += ALPHABET[seedHash[i + 4] % ALPHABET.length];
  }
  const b3 = computeChecksumBlock(b1, b2);
  return `OLLO-${b1}-${b2}-${b3}`;
}

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

    return res.status(200).json({
      paid: true,
      customer_email: session.customer_details?.email || "",
      customer_name: session.customer_details?.name || "",
      license_key: licenseKey,
    });
  } catch (err) {
    console.error("Verify session error:", err);
    return res.status(500).json({ error: "Não foi possível verificar a sessão de pagamento." });
  }
};
