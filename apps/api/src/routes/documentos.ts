import { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { authenticate } from "../middlewares/auth.js";
import { uploadFileToDrive } from "../services/driveService.js";
import { pipeline } from "stream/promises";
import { Readable } from "stream";

// Documentos obrigatórios por tipo de pessoa
const DOCS_PROPRIETARIO = ["RG", "CPF", "COMPROVANTE_RESIDENCIA", "ESCRITURA_IMOVEL", "IPTU"];
const DOCS_INQUILINO = ["RG", "CPF", "COMPROVANTE_RESIDENCIA", "COMPROVANTE_RENDA", "FICHA_CADASTRAL"];

export async function documentosRoutes(app: FastifyInstance) {
  app.addHook("onRequest", authenticate);

  // Checklist de documentos de um contrato
  app.get("/:contratoId/checklist", async (req, reply) => {
    const { id: imobiliariaId } = req.user as { id: string };
    const { contratoId } = req.params as { contratoId: string };

    const contrato = await prisma.contrato.findFirst({
      where: { id: contratoId, imobiliariaId },
      include: { documentos: true, proprietario: true, inquilino: true },
    });
    if (!contrato) return reply.status(404).send({ error: "Contrato não encontrado." });

    const buildChecklist = (tipos: string[], pessoaId: string, pessoaNome: string) =>
      tipos.map((tipo) => {
        const doc = contrato.documentos.find((d) => d.tipo === tipo && d.pessoaId === pessoaId);
        return {
          tipo,
          pessoaId,
          pessoaNome,
          status: doc?.status ?? "PENDENTE",
          documentoId: doc?.id ?? null,
          driveUrl: doc?.driveUrl ?? null,
          observacao: doc?.observacao ?? null,
        };
      });

    return {
      proprietario: buildChecklist(DOCS_PROPRIETARIO, contrato.proprietarioId, contrato.proprietario.nome),
      inquilino: buildChecklist(DOCS_INQUILINO, contrato.inquilinoId, contrato.inquilino.nome),
    };
  });

  // Upload de documento
  app.post("/:contratoId/upload", async (req, reply) => {
    const { id: imobiliariaId } = req.user as { id: string };
    const { contratoId } = req.params as { contratoId: string };

    const contrato = await prisma.contrato.findFirst({ where: { id: contratoId, imobiliariaId } });
    if (!contrato) return reply.status(404).send({ error: "Contrato não encontrado." });

    const parts = req.parts();
    let pessoaId = "";
    let tipo = "";
    let fileBuffer: Buffer | null = null;
    let fileName = "";
    let mimeType = "";

    for await (const part of parts) {
      if (part.type === "field") {
        if (part.fieldname === "pessoaId") pessoaId = part.value as string;
        if (part.fieldname === "tipo") tipo = part.value as string;
      } else if (part.type === "file") {
        fileName = part.filename;
        mimeType = part.mimetype;
        const chunks: Buffer[] = [];
        for await (const chunk of part.file) {
          chunks.push(chunk as Buffer);
        }
        fileBuffer = Buffer.concat(chunks);
      }
    }

    if (!pessoaId || !tipo || !fileBuffer) {
      return reply.status(400).send({ error: "Campos pessoaId, tipo e arquivo são obrigatórios." });
    }

    // Define pasta no Drive: Proprietário/documentos ou Inquilino/documentos
    const pessoa = await prisma.pessoa.findUnique({ where: { id: pessoaId } });
    if (!pessoa) return reply.status(404).send({ error: "Pessoa não encontrada." });

    const subpasta = pessoa.tipo === "PROPRIETARIO" ? "Proprietário/documentos" : "Inquilino/documentos";
    const { fileId, fileUrl } = await uploadFileToDrive({
      contratoId,
      subpasta,
      fileName,
      mimeType,
      buffer: fileBuffer,
    });

    const documento = await prisma.documento.upsert({
      where: { id: `${contratoId}-${pessoaId}-${tipo}` },
      update: { driveFileId: fileId, driveUrl: fileUrl, status: "PENDENTE", nome: fileName },
      create: {
        contratoId,
        pessoaId,
        tipo: tipo as any,
        nome: fileName,
        driveFileId: fileId,
        driveUrl: fileUrl,
      },
    });

    return reply.status(201).send(documento);
  });

  // Aprovar ou rejeitar documento
  app.patch("/:id/status", async (req, reply) => {
    const { id: imobiliariaId } = req.user as { id: string };
    const { id } = req.params as { id: string };
    const schema = z.object({
      status: z.enum(["APROVADO", "REJEITADO"]),
      observacao: z.string().optional(),
    });
    const { status, observacao } = schema.parse(req.body);

    // Verifica que o documento pertence à imobiliária via contrato
    const doc = await prisma.documento.findFirst({
      where: { id, contrato: { imobiliariaId } },
    });
    if (!doc) return reply.status(404).send({ error: "Documento não encontrado." });

    return prisma.documento.update({ where: { id }, data: { status, observacao } });
  });
}
