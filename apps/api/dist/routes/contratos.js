import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { authenticate } from "../middlewares/auth.js";
import { generateContratoPDF } from "../services/pdfService.js";
import { createContratoFolderStructure } from "../services/driveService.js";
export async function contratosRoutes(app) {
    app.addHook("onRequest", authenticate);
    app.get("/", async (req) => {
        const { id } = req.user;
        return prisma.contrato.findMany({
            where: { imobiliariaId: id },
            include: { imovel: true, proprietario: true, inquilino: true },
            orderBy: { createdAt: "desc" },
        });
    });
    app.get("/:id", async (req, reply) => {
        const { id: imobiliariaId } = req.user;
        const { id } = req.params;
        const contrato = await prisma.contrato.findFirst({
            where: { id, imobiliariaId },
            include: {
                imovel: true,
                proprietario: { include: { documentos: true } },
                inquilino: { include: { documentos: true } },
                vistoria: { include: { comodos: true } },
                assinaturaRequests: true,
            },
        });
        if (!contrato)
            return reply.status(404).send({ error: "Contrato não encontrado." });
        return contrato;
    });
    app.post("/", async (req, reply) => {
        const { id: imobiliariaId } = req.user;
        const schema = z.object({
            imovelId: z.string(),
            proprietarioId: z.string(),
            inquilinoId: z.string(),
            dataInicio: z.string(),
            dataFim: z.string(),
            valorAluguel: z.number().positive(),
            diaVencimento: z.number().int().min(1).max(28).default(10),
            garantia: z.enum(["CAUCAO", "FIADOR", "SEGURO_FIANCA", "TITULO_CAPITALIZACAO"]).optional(),
            observacoes: z.string().optional(),
        });
        const data = schema.parse(req.body);
        const contrato = await prisma.contrato.create({
            data: {
                ...data,
                imobiliariaId,
                dataInicio: new Date(data.dataInicio),
                dataFim: new Date(data.dataFim),
            },
        });
        // Cria estrutura de pastas no Google Drive em background
        createContratoFolderStructure(contrato.id).catch(console.error);
        return reply.status(201).send(contrato);
    });
    app.patch("/:id/status", async (req, reply) => {
        const { id: imobiliariaId } = req.user;
        const { id } = req.params;
        const schema = z.object({
            status: z.enum(["DOCUMENTACAO", "VISTORIA", "CONTRATO_GERADO", "ASSINATURA_PENDENTE", "CONCLUIDO", "CANCELADO"]),
        });
        const { status } = schema.parse(req.body);
        const result = await prisma.contrato.updateMany({ where: { id, imobiliariaId }, data: { status } });
        if (result.count === 0)
            return reply.status(404).send({ error: "Contrato não encontrado." });
        return prisma.contrato.findUnique({ where: { id } });
    });
    // Gerar PDF do contrato
    app.post("/:id/gerar-pdf", async (req, reply) => {
        const { id: imobiliariaId } = req.user;
        const { id } = req.params;
        const contrato = await prisma.contrato.findFirst({
            where: { id, imobiliariaId },
            include: { imovel: true, proprietario: true, inquilino: true, imobiliaria: true },
        });
        if (!contrato)
            return reply.status(404).send({ error: "Contrato não encontrado." });
        const { pdfBytes, driveUrl } = await generateContratoPDF(contrato);
        await prisma.contrato.update({
            where: { id },
            data: { status: "CONTRATO_GERADO", contratoUrl: driveUrl },
        });
        return { contratoUrl: driveUrl, message: "Contrato PDF gerado com sucesso." };
    });
    app.get("/:id/drive-link", async (req, reply) => {
        const { id: imobiliariaId } = req.user;
        const { id } = req.params;
        const contrato = await prisma.contrato.findFirst({ where: { id, imobiliariaId } });
        if (!contrato)
            return reply.status(404).send({ error: "Contrato não encontrado." });
        return { driveFolderUrl: contrato.driveFolderUrl };
    });
}
//# sourceMappingURL=contratos.js.map