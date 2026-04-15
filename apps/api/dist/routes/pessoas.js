import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { authenticate } from "../middlewares/auth.js";
export async function pessoasRoutes(app) {
    app.addHook("onRequest", authenticate);
    app.get("/", async (req) => {
        const { id } = req.user;
        const { tipo } = req.query;
        return prisma.pessoa.findMany({
            where: { imobiliariaId: id, ...(tipo ? { tipo: tipo } : {}) },
            orderBy: { nome: "asc" },
        });
    });
    app.get("/:id", async (req, reply) => {
        const { id: imobiliariaId } = req.user;
        const { id } = req.params;
        const pessoa = await prisma.pessoa.findFirst({
            where: { id, imobiliariaId },
            include: { documentos: true },
        });
        if (!pessoa)
            return reply.status(404).send({ error: "Pessoa não encontrada." });
        return pessoa;
    });
    app.post("/", async (req, reply) => {
        const { id: imobiliariaId } = req.user;
        const schema = z.object({
            nome: z.string(),
            cpf: z.string().length(11),
            rg: z.string().optional(),
            dataNasc: z.string().optional(),
            email: z.string().email(),
            telefone: z.string(),
            profissao: z.string().optional(),
            rendaMensal: z.number().optional(),
            estadoCivil: z.string().optional(),
            nacionalidade: z.string().optional(),
            tipo: z.enum(["PROPRIETARIO", "INQUILINO"]),
        });
        const data = schema.parse(req.body);
        const pessoa = await prisma.pessoa.create({
            data: {
                ...data,
                imobiliariaId,
                dataNasc: data.dataNasc ? new Date(data.dataNasc) : undefined,
            },
        });
        return reply.status(201).send(pessoa);
    });
    app.put("/:id", async (req, reply) => {
        const { id: imobiliariaId } = req.user;
        const { id } = req.params;
        const schema = z.object({
            nome: z.string().optional(),
            rg: z.string().optional(),
            dataNasc: z.string().optional(),
            email: z.string().email().optional(),
            telefone: z.string().optional(),
            profissao: z.string().optional(),
            rendaMensal: z.number().optional(),
            estadoCivil: z.string().optional(),
            nacionalidade: z.string().optional(),
        });
        const data = schema.parse(req.body);
        const result = await prisma.pessoa.updateMany({
            where: { id, imobiliariaId },
            data: { ...data, dataNasc: data.dataNasc ? new Date(data.dataNasc) : undefined },
        });
        if (result.count === 0)
            return reply.status(404).send({ error: "Pessoa não encontrada." });
        return prisma.pessoa.findUnique({ where: { id } });
    });
}
//# sourceMappingURL=pessoas.js.map