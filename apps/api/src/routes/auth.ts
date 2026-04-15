import { FastifyInstance } from "fastify";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { enviarEmailAssinatura } from "../services/emailService.js";

export async function authRoutes(app: FastifyInstance) {
  // Login da imobiliária
  app.post("/login", async (req, reply) => {
    const schema = z.object({
      email: z.string().email(),
      senha: z.string().min(6),
    });
    const { email, senha } = schema.parse(req.body);

    const imobiliaria = await prisma.imobiliaria.findUnique({ where: { email } });
    if (!imobiliaria) {
      return reply.status(401).send({ error: "Credenciais inválidas." });
    }

    const senhaValida = await bcrypt.compare(senha, imobiliaria.senha);
    if (!senhaValida) {
      return reply.status(401).send({ error: "Credenciais inválidas." });
    }

    const token = app.jwt.sign(
      { id: imobiliaria.id, email: imobiliaria.email },
      { expiresIn: "7d" }
    );

    return {
      token,
      imobiliaria: {
        id: imobiliaria.id,
        nome: imobiliaria.nome,
        email: imobiliaria.email,
        logoUrl: imobiliaria.logoUrl,
      },
    };
  });

  // Cadastro (usado na configuração inicial)
  app.post("/cadastro", async (req, reply) => {
    const schema = z.object({
      nome: z.string().min(2),
      cnpj: z.string().length(14),
      email: z.string().email(),
      senha: z.string().min(6),
      telefone: z.string().optional(),
    });
    const data = schema.parse(req.body);

    const existe = await prisma.imobiliaria.findFirst({
      where: { OR: [{ email: data.email }, { cnpj: data.cnpj }] },
    });
    if (existe) {
      return reply.status(409).send({ error: "E-mail ou CNPJ já cadastrado." });
    }

    const senhaCriptografada = await bcrypt.hash(data.senha, 10);
    const imobiliaria = await prisma.imobiliaria.create({
      data: { ...data, senha: senhaCriptografada },
    });

    const token = app.jwt.sign(
      { id: imobiliaria.id, email: imobiliaria.email },
      { expiresIn: "7d" }
    );

    return reply.status(201).send({ token, imobiliaria: { id: imobiliaria.id, nome: imobiliaria.nome } });
  });

  // Gerar token de assinatura para proprietário/inquilino
  app.post("/signature-token", {
    onRequest: [async (req, reply) => {
      try { await req.jwtVerify(); } catch { return reply.status(401).send({ error: "Não autorizado." }); }
    }],
  }, async (req, reply) => {
    const schema = z.object({
      contratoId: z.string(),
      pessoaId: z.string(),
      horasExpiracao: z.number().int().min(1).max(168).default(72),
    });
    const { contratoId, pessoaId, horasExpiracao } = schema.parse(req.body);

    const jwt_payload = req.user as { id: string };

    // Verifica que o contrato pertence à imobiliária
    const contrato = await prisma.contrato.findFirst({
      where: { id: contratoId, imobiliariaId: jwt_payload.id },
    });
    if (!contrato) return reply.status(404).send({ error: "Contrato não encontrado." });

    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + horasExpiracao);

    const request = await prisma.assinaturaRequest.upsert({
      where: { token: `${contratoId}-${pessoaId}` },
      update: { expiresAt, status: "PENDENTE" },
      create: { contratoId, pessoaId, expiresAt },
    });

    const baseUrl = process.env.FRONTEND_URL ?? "http://localhost:5173";
    const link = `${baseUrl}/assinar/${request.token}`;

    // Envia e-mail automaticamente
    const pessoa = await prisma.pessoa.findUnique({ where: { id: pessoaId } });
    const contratoCompleto = await prisma.contrato.findUnique({
      where: { id: contratoId },
      include: { imovel: true, imobiliaria: true },
    });

    if (pessoa && contratoCompleto) {
      enviarEmailAssinatura({
        destinatario: pessoa.email,
        nomeDestinatario: pessoa.nome,
        tipoDestinatario: pessoa.tipo,
        nomeImobiliaria: contratoCompleto.imobiliaria.nome,
        enderecoImovel: `${contratoCompleto.imovel.endereco}, ${contratoCompleto.imovel.numero} — ${contratoCompleto.imovel.cidade}`,
        linkAssinatura: link,
        expiresAt: request.expiresAt,
      }).catch(console.error);
    }

    return { token: request.token, link };
  });
}
