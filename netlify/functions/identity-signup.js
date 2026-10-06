// Roda quando alguém se cadastra no Netlify Identity (e-mail/senha ou Google).
// O cadastro sozinho NÃO dá acesso ao app: o papel "member", exigido pelo
// arquivo _redirects para abrir /app/, é dado pela função kiwify-webhook quando
// o pagamento é confirmado. A única exceção são as contas de acesso vitalício.

// Mantenha esta lista igual à de kiwify-webhook.js
const VITALICIO = ['joaokleberpereira100@gmail.com'];

exports.handler = async (event) => {
  let email = '';
  try {
    const dados = JSON.parse(event.body || '{}');
    email = String((dados.user && dados.user.email) || '').trim().toLowerCase();
  } catch (e) { /* sem corpo legível: segue sem papel */ }

  const corpo = VITALICIO.includes(email) ? { app_metadata: { roles: ['member'] } } : {};
  return { statusCode: 200, body: JSON.stringify(corpo) };
};
