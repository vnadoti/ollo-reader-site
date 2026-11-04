# Stripe Integration Setup & TODO (`OlloReader-Site`)

Este arquivo reúne os passos finais para ativar o checkout da **Stripe** (Licença Vitalícia de **R$ 29,90**) com entrega automática de chave (`OLLO-XXXX-XXXX-XXXX`) no seu site hospedado na **Vercel**.

---

## Values to Replace

The following values are placeholders and must be updated before going live.

**Files containing placeholders:**
- [api/create-checkout-session.js](api/create-checkout-session.js)
- [.env.example](.env.example)

| Field | Current Value | What to Set |
|-------|--------------|-------------|
| `mode` | `payment` | Set to `"payment"` for one-time charges (Licença Vitalícia R$ 29,90) or `"subscription"` for recurring billing. |
| `success_url` | `${domain}/sucesso.html?session_id={CHECKOUT_SESSION_ID}` | Your actual post-payment success page URL. Keep the `{CHECKOUT_SESSION_ID}` template so `sucesso.html` can generate the license key. |
| `cancel_url` | `${domain}/#precos` | Your actual cancel/return page URL. |
| `line_items[].price` | `process.env.STRIPE_PRICE_ID` (`price_...`) | Your actual Stripe Price ID for the R$ 29,90 product from the Stripe Dashboard (https://dashboard.stripe.com/prices). |

---

## Configured Parameters

These parameters were configured in Checkout Studio and are already set correctly.

**Files containing these parameters:**
- [api/create-checkout-session.js](api/create-checkout-session.js)

| Parameter | Value |
|-----------|-------|
| `ui_mode` | `"hosted_page"` (uses Stripe Node SDK `^21.0.0`) |
| `billing_address_collection` | `"auto"` |
| `phone_number_collection.enabled` | `true` |
| `automatic_tax.enabled` | `true` |
| `allow_promotion_codes` | `true` |
| `submit_type` | `"auto"` |
| `consent_collection.promotions` | `"auto"` |
| `branding_settings.background_color` | `"#ffffff"` |
| `branding_settings.button_color` | `"#ff0000"` |
| `branding_settings.font_family` | `"default"` |
| `branding_settings.border_style` | `"rounded"` |
| `branding_settings.logo` | `{ type: "file", file: "file_1UY7GfK8pshXJmPC5YiM6gc0" }` |

*(Note: `payment_method_collection: "always"` is conditionally included when `mode === "subscription"` per Stripe API rules).*

---

## Setup and Next Steps (Como Configurar na Vercel em 2 Minutos)

### 1. Estrutura de Arquivos Criada
- [`package.json`](package.json) — Declara a dependência oficial `"stripe": "^21.0.0"`.
- [`api/create-checkout-session.js`](api/create-checkout-session.js) — Endpoint Serverless da Vercel que cria a sessão do Stripe Checkout com o seu visual customizado (logo e botão `#ff0000`) e redireciona o cliente.
- [`api/verify-session.js`](api/verify-session.js) — Endpoint Serverless que confere se o pagamento foi aprovado (`payment_status === "paid"`) e gera automaticamente uma chave oficial `OLLO-XXXX-XXXX-XXXX`.
- [`sucesso.html`](sucesso.html) — Página exibida logo após o pagamento com a chave pronta na tela e botão de copiar com 1 clique.

### 2. Variáveis de Ambiente na Vercel
No painel do seu projeto na **Vercel** (`Settings` → `Environment Variables`), adicione estas 3 variáveis:

1. **`STRIPE_SECRET_KEY`**: Sua chave secreta da Stripe (`sk_test_...` para testes ou `sk_live_...` para produção), obtida em https://dashboard.stripe.com/apikeys
2. **`STRIPE_PRICE_ID`**: O ID do preço de **R$ 29,90** do produto criado no catálogo da Stripe (começa com `price_...`), obtido em https://dashboard.stripe.com/prices
3. **`DOMAIN`**: A URL do seu site na Vercel (ex: `https://olloreader.vercel.app`)

### 3. Como Funciona o Fluxo Completo
1. O visitante clica em **"Comprar Licença Vitalícia (R$ 29,90)"** no site (ou dentro do aplicativo Ollo Reader).
2. Ele é levado para `/api/create-checkout-session`, que abre a página segura do **Stripe Checkout** já com a logo do Ollo Reader e o botão vermelho.
3. Após pagar, a Stripe envia o cliente para `/sucesso.html?session_id=cs_...`.
4. A página valida a compra em `/api/verify-session` e exibe imediatamente a chave `OLLO-XXXX-XXXX-XXXX` para o cliente ativar no aplicativo!

### 4. Recursos Úteis da Stripe
- Documentação e MCP da Stripe: https://docs.stripe.com/mcp
- Suporte da Stripe: https://support.stripe.com
