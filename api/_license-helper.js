const crypto = require("crypto");
const nodemailer = require("nodemailer");

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
 * Assim, mesmo que o comprador recarregue a página de sucesso ou que o webhook e a página
 * chamem juntos, a chave gerada para aquela compra é sempre a mesma e 100% válida no app!
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

async function sendLicenseEmail({ toEmail, customerName, licenseKey }) {
  if (!toEmail) return { sent: false, reason: "no_recipient_email" };

  const gmailUser = (process.env.GMAIL_USER || "vnadoti@gmail.com").trim();
  const gmailPass = (process.env.GMAIL_APP_PASSWORD || "").replace(/\s+/g, "");

  if (!gmailPass) {
    return { sent: false, reason: "missing_gmail_app_password" };
  }

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: gmailUser,
      pass: gmailPass,
    },
  });

  const firstName = customerName ? customerName.split(" ")[0] : "Leitor(a)";

  const htmlBody = `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 580px; margin: 0 auto; background: #09090b; color: #fafafa; padding: 36px 28px; border-radius: 16px; border: 1px solid #27272a;">
      <h2 style="margin: 0 0 12px; color: #ffffff; font-size: 22px;">🎉 Olá, ${firstName}! Obrigado por adquirir o Ollo Reader!</h2>
      <p style="color: #a1a1aa; font-size: 15px; line-height: 1.6; margin-bottom: 24px;">
        Seu pagamento da <strong>Licença Vitalícia do Ollo Reader</strong> foi confirmado. Abaixo está a sua chave oficial de ativação permanente:
      </p>

      <div style="background: #141418; border: 2px dashed #f34543; border-radius: 12px; padding: 20px; text-align: center; margin-bottom: 24px;">
        <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #a1a1aa; margin-bottom: 6px;">
          SUA CHAVE DE ATIVAÇÃO VITALÍCIA
        </div>
        <div style="font-family: Consolas, monospace; font-size: 26px; font-weight: bold; color: #ffffff; letter-spacing: 2px;">
          ${licenseKey}
        </div>
      </div>

      <div style="background: #121214; border: 1px solid #27272a; border-radius: 10px; padding: 18px; margin-bottom: 24px;">
        <strong style="color: #ffffff; display: block; margin-bottom: 8px; font-size: 14px;">Como ativar no seu Ollo Reader:</strong>
        <ol style="color: #a1a1aa; font-size: 14px; line-height: 1.7; margin: 0; padding-left: 18px;">
          <li>Abra o aplicativo <strong>Ollo Reader</strong> no seu Windows.</li>
          <li>Clique no banner <strong>"🔑 Avaliação / Ativar Licença Vitalícia"</strong> no canto inferior esquerdo da barra lateral.</li>
          <li>Cole a chave <strong>${licenseKey}</strong> e clique em <strong>"Ativar Chave"</strong>.</li>
        </ol>
      </div>

      <p style="color: #71717a; font-size: 12px; text-align: center; margin-top: 28px;">
        Guarde este e-mail: você poderá usar esta mesma chave sempre que precisar reinstalar o Ollo Reader.<br>
        © 2026 NADOTI • Ollo Reader
      </p>
    </div>
  `;

  await transporter.sendMail({
    from: `"Ollo Reader" <${gmailUser}>`,
    to: toEmail,
    subject: `🔑 Sua Chave de Licença Vitalícia do Ollo Reader (${licenseKey})`,
    html: htmlBody,
  });

  return { sent: true };
}

module.exports = {
  generateDeterministicLicenseKey,
  sendLicenseEmail,
};

