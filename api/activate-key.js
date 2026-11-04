const { Stripe } = require("stripe");
const { generateDeterministicLicenseKey, validateLicenseKeyFormat } = require("./_license-helper");

/**
 * Endpoint oficial de ativação única (1 computador por chave).
 * Verifica se a chave existe, se é legítima e vincula o MachineId na Stripe.
 */
module.exports = async function handler(req, res) {
  if (req.method !== "POST" && req.method !== "GET") {
    res.setHeader("Allow", "POST, GET");
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const rawKey = (req.body?.key || req.query?.key || "").trim().toUpperCase().replace(/\s+/g, "");
  const machineId = (req.body?.machine_id || req.query?.machine_id || "").trim();

  if (!rawKey || !validateLicenseKeyFormat(rawKey)) {
    return res.status(400).json({
      valid: false,
      reason: "invalid_format",
      message: "Chave de licença inválida.",
    });
  }

  if (!machineId) {
    return res.status(400).json({
      valid: false,
      reason: "missing_machine_id",
      message: "Identificador do dispositivo não informado.",
    });
  }

  const secretKey = process.env.STRIPE_SECRET_KEY ? process.env.STRIPE_SECRET_KEY.trim() : "";
  if (!secretKey) {
    // Se a variável ainda não estiver ativa, permite ativar pelo formato criptográfico
    return res.status(200).json({
      valid: true,
      activated: true,
      key: rawKey,
    });
  }

  try {
    const stripe = new Stripe(secretKey);

    // 1. Verifica nas sessões de checkout da Stripe se a chave corresponde a uma compra
    const sessions = await stripe.checkout.sessions.list({ limit: 100 });
    const matchedSession = sessions.data.find((s) => {
      const isPaid =
        s.payment_status === "paid" ||
        s.payment_status === "no_payment_required" ||
        s.status === "complete";
      if (!isPaid) return false;
      const expectedKey = s.metadata?.license_key || generateDeterministicLicenseKey(s.id);
      return expectedKey.toUpperCase() === rawKey;
    });

    if (matchedSession) {
      const existingMachine = matchedSession.metadata?.activated_machine_id;

      // Se já foi ativada em OUTRO computador diferente, bloqueia!
      if (existingMachine && existingMachine !== machineId) {
        return res.status(403).json({
          valid: false,
          reason: "already_used",
          message: "Esta chave de licença já foi ativada em outro computador.",
        });
      }

      // Vincula ao computador atual na Stripe
      if (!existingMachine) {
        await stripe.checkout.sessions.update(matchedSession.id, {
          metadata: {
            ...matchedSession.metadata,
            license_key: rawKey,
            activated_machine_id: machineId,
            activated_at: new Date().toISOString(),
          },
        });
      }

      return res.status(200).json({
        valid: true,
        activated: true,
        key: rawKey,
      });
    }

    // 2. Caso seja uma chave gerada manualmente pelo script gerar-chave.ps1 (não vinda de Checkout Session),
    // registramos o vínculo de uso único nos metadados de um Customer de controle na Stripe
    const customers = await stripe.customers.list({
      email: "licenses-registry@olloreader.app",
      limit: 1,
    });

    let registryCustomer = customers.data[0];
    if (!registryCustomer) {
      registryCustomer = await stripe.customers.create({
        email: "licenses-registry@olloreader.app",
        name: "Ollo Reader Manual Keys Registry",
        metadata: {},
      });
    }

    const boundMachine = registryCustomer.metadata?.[rawKey];
    if (boundMachine && boundMachine !== machineId) {
      return res.status(403).json({
        valid: false,
        reason: "already_used",
        message: "Esta chave de licença já foi ativada em outro computador.",
      });
    }

    if (!boundMachine) {
      await stripe.customers.update(registryCustomer.id, {
        metadata: {
          ...registryCustomer.metadata,
          [rawKey]: machineId,
        },
      });
    }

    return res.status(200).json({
      valid: true,
      activated: true,
      key: rawKey,
    });
  } catch (err) {
    console.error("Activate key error:", err.message);
    return res.status(500).json({
      valid: false,
      reason: "server_error",
      message: "Não foi possível conectar ao servidor de ativação. Verifique sua conexão com a internet.",
    });
  }
};
