import { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { authenticate } from "../middlewares/auth.js";
import { generateVistoriaPDF } from "../services/pdfService.js";
import { uploadFileToDrive } from "../services/driveService.js";

export async function vistoriasRoutes(app: FastifyInstance) {
  app.addHook("onRequest", authenticate);

  app.get("/:contratoId", async (req, reply) => {
    const { id: imobiliariaId } = req.user as { id: string };
    const { contratoId } = req.params as { contratoId: string };
    const vistoria = await prisma.vistoria.findFirst({
      where: { contrato: { id: contratoId, imobiliariaId } },
      include: { comodos: true },
    });
    if (!vistoria) return reply.status(404).send({ error: "Vistoria não encontrada." });
    return vistoria;
  });

  // Criar vistoria com lista de cômodos
  app.post("/", async (req, reply) => {
    const { id: imobiliariaId } = req.user as { id: string };
    const schema = z.object({
      contratoId: z.string(),
      dataVistoria: z.string().optional(),
      observacoes: z.string().optional(),
      comodos: z.array(z.object({ nome: z.string(), descricao: z.string().optional() })).min(1),
    });
    const { contratoId, dataVistoria, observacoes, comodos } = schema.parse(req.body);

    const contrato = await prisma.contrato.findFirst({ where: { id: contratoId, imobiliariaId } });
    if (!contrato) return reply.status(404).send({ error: "Contrato não encontrado." });

    const vistoria = await prisma.vistoria.create({
      data: {
        contratoId,
        dataVistoria: dataVistoria ? new Date(dataVistoria) : new Date(),
        observacoes,
        comodos: { create: comodos },
      },
      include: { comodos: true },
    });

    await prisma.contrato.update({ where: { id: contratoId }, data: { status: "VISTORIA" } });

    return reply.status(201).send(vistoria);
  });

  // Upload de fotos de um cômodo
  app.post("/:vistoriaId/comodos/:comodoId/fotos", async (req, reply) => {
    const { id: imobiliariaId } = req.user as { id: string };
    const { vistoriaId, comodoId } = req.params as { vistoriaId: string; comodoId: string };

    const comodo = await prisma.comodo.findFirst({
      where: { id: comodoId, vistoriaId, vistoria: { contrato: { imobiliariaId } } },
    });
    if (!comodo) return reply.status(404).send({ error: "Cômodo não encontrado." });

    const fotos: string[] = [];
    const parts = req.parts();
    for await (const part of parts) {
      if (part.type === "file") {
        const chunks: Buffer[] = [];
        for await (const chunk of part.file) chunks.push(chunk as Buffer);
        const buffer = Buffer.concat(chunks);
        const vistoria = await prisma.vistoria.findUnique({ where: { id: vistoriaId } });
        const { fileUrl } = await uploadFileToDrive({
          contratoId: vistoria!.contratoId,
          subpasta: `Vistoria/fotos/${comodo.nome}`,
          fileName: part.filename,
          mimeType: part.mimetype,
          buffer,
        });
        fotos.push(fileUrl);
      }
    }

    return prisma.comodo.update({
      where: { id: comodoId },
      data: { fotos: { push: fotos } },
    });
  });

  // Excluir foto de um cômodo
  app.delete("/:vistoriaId/comodos/:comodoId/fotos", async (req, reply) => {
    const { id: imobiliariaId } = req.user as { id: string };
    const { vistoriaId, comodoId } = req.params as { vistoriaId: string; comodoId: string };
    const { fotoUrl } = req.body as { fotoUrl: string };

    const comodo = await prisma.comodo.findFirst({
      where: { id: comodoId, vistoriaId, vistoria: { contrato: { imobiliariaId } } },
    });
    if (!comodo) return reply.status(404).send({ error: "Cômodo não encontrado." });

    // Remove a foto do array
    const novasFotos = comodo.fotos.filter((f) => f !== fotoUrl);
    await prisma.comodo.update({ where: { id: comodoId }, data: { fotos: novasFotos } });

    // Remove o arquivo do disco
    try {
      const { promises: fs } = await import("fs");
      const uploadDir = process.env.UPLOAD_DIR ?? "/var/www/icatto-api/uploads";
      const filePath = fotoUrl.replace(/.*\/api\/uploads\//, `${uploadDir}/`);
      await fs.unlink(filePath);
    } catch {
      // ignora se arquivo não existir
    }

    return reply.status(204).send();
  });

  // Gerar PDF do laudo de vistoria
  app.post("/:vistoriaId/gerar-laudo", async (req, reply) => {
    const { id: imobiliariaId } = req.user as { id: string };
    const { vistoriaId } = req.params as { vistoriaId: string };

    const vistoria = await prisma.vistoria.findFirst({
      where: { id: vistoriaId, contrato: { imobiliariaId } },
      include: { comodos: true, contrato: { include: { imovel: true, imobiliaria: true } } },
    });
    if (!vistoria) return reply.status(404).send({ error: "Vistoria não encontrada." });

    const { driveUrl } = await generateVistoriaPDF(vistoria);
    await prisma.vistoria.update({ where: { id: vistoriaId }, data: { laudoUrl: driveUrl } });

    return { laudoUrl: driveUrl, message: "Laudo de vistoria gerado com sucesso." };
  });
}
