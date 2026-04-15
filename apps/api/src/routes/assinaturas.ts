import { FastifyInstance } from "fastify";
import { prisma } from "../lib/prisma.js";
import { embedSignatureInPDF } from "../services/pdfService.js";
import { uploadFileToDrive } from "../services/driveService.js";

export async function assinaturasRoutes(app: FastifyInstance) {
  // Rota pública — busca dados para a página de assinatura
  app.get("/:token", async (req, reply) => {
    const { token } = req.params as { token: string };
    const request = await prisma.assinaturaRequest.findUnique({
      where: { token },
      include: {
        contrato: { include: { imovel: true, imobiliaria: true } },
        pessoa: true,
      },
    });

    if (!request) return reply.status(404).send({ error: "Link de assinatura inválido." });
    if (request.status === "ASSINADO") return reply.status(410).send({ error: "Documento já assinado." });
    if (new Date() > request.expiresAt) {
      await prisma.assinaturaRequest.update({ where: { token }, data: { status: "EXPIRADO" } });
      return reply.status(410).send({ error: "Link de assinatura expirado." });
    }

    return {
      pessoa: { nome: request.pessoa.nome, tipo: request.pessoa.tipo },
      contrato: {
        imovel: `${request.contrato.imovel.endereco}, ${request.contrato.imovel.numero}`,
        imobiliaria: request.contrato.imobiliaria.nome,
      },
      expiresAt: request.expiresAt,
    };
  });

  // Rota pública — recebe assinatura (PNG base64) e embute no PDF
  app.post("/:token", async (req, reply) => {
    const { token } = req.params as { token: string };
    const { assinaturaBase64 } = req.body as { assinaturaBase64: string };

    if (!assinaturaBase64) {
      return reply.status(400).send({ error: "Assinatura não fornecida." });
    }

    const request = await prisma.assinaturaRequest.findUnique({
      where: { token },
      include: {
        contrato: true,
        pessoa: true,
      },
    });

    if (!request) return reply.status(404).send({ error: "Link inválido." });
    if (request.status === "ASSINADO") return reply.status(410).send({ error: "Já assinado." });
    if (new Date() > request.expiresAt) return reply.status(410).send({ error: "Link expirado." });

    // Converte base64 para buffer
    const signatureBuffer = Buffer.from(
      assinaturaBase64.replace(/^data:image\/\w+;base64,/, ""),
      "base64"
    );

    // Salva assinatura PNG no Drive
    await uploadFileToDrive({
      contratoId: request.contratoId,
      subpasta: `${request.pessoa.tipo === "PROPRIETARIO" ? "Proprietário" : "Inquilino"}`,
      fileName: "assinatura.png",
      mimeType: "image/png",
      buffer: signatureBuffer,
    });

    // Embute assinatura no PDF do contrato
    const { driveUrl } = await embedSignatureInPDF({
      contratoId: request.contratoId,
      pessoaId: request.pessoaId,
      pessoaNome: request.pessoa.nome,
      pessoaTipo: request.pessoa.tipo,
      signatureBuffer,
    });

    // Marca como assinado
    await prisma.assinaturaRequest.update({
      where: { token },
      data: {
        status: "ASSINADO",
        signedAt: new Date(),
        driveUrl,
        ipAddress: req.ip,
      },
    });

    // Verifica se todos assinaram → atualiza contrato
    const pendentes = await prisma.assinaturaRequest.count({
      where: { contratoId: request.contratoId, status: { not: "ASSINADO" } },
    });
    if (pendentes === 0) {
      await prisma.contrato.update({
        where: { id: request.contratoId },
        data: { status: "CONCLUIDO" },
      });
    }

    return { message: "Assinatura registrada com sucesso!", driveUrl };
  });
}
