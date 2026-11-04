const { Stripe } = require("stripe");
const { generateDeterministicLicenseKey, validateLicenseKeyFormat } = require("./_license-helper");

/**
 * Endpoint oficial de ativação única (1 computador por chave) e verificação de reembolso/revogação.
 * Verifica se a chave existe, se não foi reembolsada/revogada e vincula o MachineId na Stripe.
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
    return res.status(200).json({
      valid: true,
      activated: true,
      key: rawKey,
    });
  }

  try {
    const stripe = new Stripe(secretKey);

    // 1. Verifica nas sessões de checkout da Stripe se a chave corresponde a uma compra
    const sessions = await stripe.checkout.sessions.list({
      limit: 100,
      expand: ["data.payment_intent.latest_charge"],
    });

    const matchedSession = sessions.data.find((s) => {
      const expectedKey = s.metadata?.license_key || generateDeterministicLicenseKey(s.id);
      return expectedKey.toUpperCase() === rawKey;
    });

    if (matchedSession) {
      // Verifica se foi revogada manualmente ou se houve reembolso/estorno na Stripe
      const pi = matchedSession.payment_intent;
      const charge = pi && typeof pi === "object" ? pi.latest_charge : null;
      const isRefunded =
        matchedSession.metadata?.revoked === "true" ||
        matchedSession.metadata?.activated_machine_id === "REVOKED" ||
        (charge && typeof charge === "object" && (charge.refunded === true || charge.amount_refunded > 0));

      if (isRefunded) {
        return res.status(403).json({
          valid: false,
          reason: "revoked_or_refunded",
          message: "Esta chave de licença foi cancelada devido a reembolso ou estorno do pagamento.",
        });
      }

      const isPaid =
        matchedSession.payment_status === "paid" ||
        matchedSession.payment_status === "no_payment_required" ||
        matchedSession.status === "complete";

      if (!isPaid) {
        return res.status(403).json({
          valid: false,
          reason: "unpaid",
          message: "O pagamento referente a esta chave não consta como concluído.",
        });
      }

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

    // 2. Caso seja uma chave gerada manualmente pelo script gerar-chave.ps1
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
    if (boundMachine === "REVOKED") {
      return res.status(403).json({
        valid: false,
        reason: "revoked_or_refunded",
        message: "Esta chave de licença foi cancelada.",
      });
    }

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
