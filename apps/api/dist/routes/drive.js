import { prisma } from "../lib/prisma.js";
import { authenticate } from "../middlewares/auth.js";
import { createContratoFolderStructure } from "../services/driveService.js";
export async function driveRoutes(app) {
    app.addHook("onRequest", authenticate);
    // (Re)criar estrutura de pastas no Drive para um contrato
    app.post("/criar-estrutura/:contratoId", async (req, reply) => {
        const { id: imobiliariaId } = req.user;
        const { contratoId } = req.params;
        const contrato = await prisma.contrato.findFirst({ where: { id: contratoId, imobiliariaId } });
        if (!contrato)
            return reply.status(404).send({ error: "Contrato não encontrado." });
        await createContratoFolderStructure(contratoId);
        const updated = await prisma.contrato.findUnique({ where: { id: contratoId } });
        return { driveFolderUrl: updated?.driveFolderUrl };
    });
    app.get("/link/:contratoId", async (req, reply) => {
        const { id: imobiliariaId } = req.user;
        const { contratoId } = req.params;
        const contrato = await prisma.contrato.findFirst({ where: { id: contratoId, imobiliariaId } });
        if (!contrato)
            return reply.status(404).send({ error: "Contrato não encontrado." });
        return { driveFolderUrl: contrato.driveFolderUrl, driveFolderId: contrato.driveFolderId };
    });
}
//# sourceMappingURL=drive.js.map