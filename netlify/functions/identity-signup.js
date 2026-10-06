// Roda quando alguém se cadastra no Netlify Identity (e-mail/senha ou Google).
// Dá o papel "member", que as regras do arquivo _redirects exigem para abrir /app/.
exports.handler = async () => ({
  statusCode: 200,
  body: JSON.stringify({ app_metadata: { roles: ['member'] } }),
});
