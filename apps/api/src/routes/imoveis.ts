import { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { authenticate } from "../middlewares/auth.js";

export async function imoveisRoutes(app: FastifyInstance) {
  app.addHook("onRequest", authenticate);

  app.get("/", async (req) => {
    const { id } = req.user as { id: string };
    return prisma.imovel.findMany({
      where: { imobiliariaId: id },
      orderBy: { createdAt: "desc" },
    });
  });

  app.get("/:id", async (req, reply) => {
    const { id: imobiliariaId } = req.user as { id: string };
    const { id } = req.params as { id: string };

    const imovel = await prisma.imovel.findFirst({ where: { id, imobiliariaId } });
    if (!imovel) return reply.status(404).send({ error: "Imóvel não encontrado." });
    return imovel;
  });

  app.post("/", async (req, reply) => {
    const { id: imobiliariaId } = req.user as { id: string };
    const schema = z.object({
      endereco: z.string(),
      numero: z.string(),
      complemento: z.string().optional(),
      bairro: z.string(),
      cidade: z.string(),
      estado: z.string().length(2),
      cep: z.string(),
      tipo: z.enum(["APARTAMENTO", "CASA", "KITNET", "SALA_COMERCIAL", "GALPAO", "TERRENO"]),
      areaM2: z.number().optional(),
      quartos: z.number().int().optional(),
      banheiros: z.number().int().optional(),
      vagas: z.number().int().optional(),
      valorAluguel: z.number().positive(),
      descricao: z.string().optional(),
    });
    const data = schema.parse(req.body);
    const imovel = await prisma.imovel.create({ data: { ...data, imobiliariaId } });
    return reply.status(201).send(imovel);
  });

  app.put("/:id", async (req, reply) => {
    const { id: imobiliariaId } = req.user as { id: string };
    const { id } = req.params as { id: string };
    const schema = z.object({
      endereco: z.string().optional(),
      numero: z.string().optional(),
      complemento: z.string().optional(),
      bairro: z.string().optional(),
      cidade: z.string().optional(),
      estado: z.string().length(2).optional(),
      cep: z.string().optional(),
      tipo: z.enum(["APARTAMENTO", "CASA", "KITNET", "SALA_COMERCIAL", "GALPAO", "TERRENO"]).optional(),
      areaM2: z.number().optional(),
      quartos: z.number().int().optional(),
      banheiros: z.number().int().optional(),
      vagas: z.number().int().optional(),
      valorAluguel: z.number().positive().optional(),
      descricao: z.string().optional(),
    });
    const data = schema.parse(req.body);
    const imovel = await prisma.imovel.updateMany({ where: { id, imobiliariaId }, data });
    if (imovel.count === 0) return reply.status(404).send({ error: "Imóvel não encontrado." });
    return prisma.imovel.findUnique({ where: { id } });
  });

  app.delete("/:id", async (req, reply) => {
    const { id: imobiliariaId } = req.user as { id: string };
    const { id } = req.params as { id: string };
    const result = await prisma.imovel.deleteMany({ where: { id, imobiliariaId } });
    if (result.count === 0) return reply.status(404).send({ error: "Imóvel não encontrado." });
    return reply.status(204).send();
  });
}
