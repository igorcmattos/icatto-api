import nodemailer from "nodemailer";
const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});
export async function enviarEmailAssinatura({ destinatario, nomeDestinatario, tipoDestinatario, nomeImobiliaria, enderecoImovel, linkAssinatura, expiresAt, }) {
    const tipo = tipoDestinatario === "PROPRIETARIO" ? "Locador (Proprietário)" : "Locatário (Inquilino)";
    const validade = new Date(expiresAt).toLocaleString("pt-BR");
    await transporter.sendMail({
        from: `"${nomeImobiliaria}" <${process.env.EMAIL_USER}>`,
        to: destinatario,
        subject: `${nomeImobiliaria} — Contrato aguardando sua assinatura`,
        html: `
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head><meta charset="UTF-8"></head>
      <body style="font-family: Arial, sans-serif; background: #f5f5f5; margin: 0; padding: 20px;">
        <div style="max-width: 560px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.08);">

          <div style="background: #2563eb; padding: 32px 40px;">
            <h1 style="color: white; margin: 0; font-size: 24px;">${nomeImobiliaria}</h1>
            <p style="color: #bfdbfe; margin: 4px 0 0; font-size: 14px;">Sistema de Gestão Imobiliária</p>
          </div>

          <div style="padding: 40px;">
            <p style="color: #374151; font-size: 16px; margin: 0 0 8px;">Olá, <strong>${nomeDestinatario}</strong>!</p>
            <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 0 0 24px;">
              Você está recebendo este e-mail como <strong>${tipo}</strong> do contrato referente ao imóvel:
            </p>

            <div style="background: #f3f4f6; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
              <p style="margin: 0; color: #111827; font-weight: 600;">📍 ${enderecoImovel}</p>
            </div>

            <p style="color: #6b7280; font-size: 14px; margin: 0 0 24px; line-height: 1.6;">
              Clique no botão abaixo para visualizar e assinar o contrato digitalmente.
              O link é válido até <strong>${validade}</strong>.
            </p>

            <div style="text-align: center; margin-bottom: 32px;">
              <a href="${linkAssinatura}"
                 style="background: #2563eb; color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px; display: inline-block;">
                Assinar Contrato
              </a>
            </div>

            <p style="color: #9ca3af; font-size: 12px; line-height: 1.6; margin: 0;">
              Se você não reconhece este e-mail, por favor ignore.
              Esta assinatura eletrônica tem validade legal conforme a MP 2.200-2/2001.
            </p>
          </div>

          <div style="background: #f9fafb; padding: 20px 40px; border-top: 1px solid #e5e7eb;">
            <p style="color: #9ca3af; font-size: 12px; margin: 0; text-align: center;">
              ${nomeImobiliaria} · Powered by Icatto
            </p>
          </div>
        </div>
      </body>
      </html>
    `,
    });
}
//# sourceMappingURL=emailService.js.map