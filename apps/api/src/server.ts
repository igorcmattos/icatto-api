import Fastify from "fastify";
import cors from "@fastify/cors";
import jwt from "@fastify/jwt";
import multipart from "@fastify/multipart";
import { authRoutes } from "./routes/auth.js";
import { imoveisRoutes } from "./routes/imoveis.js";
import { pessoasRoutes } from "./routes/pessoas.js";
import { contratosRoutes } from "./routes/contratos.js";
import { documentosRoutes } from "./routes/documentos.js";
import { vistoriasRoutes } from "./routes/vistorias.js";
import { assinaturasRoutes } from "./routes/assinaturas.js";
import { driveRoutes } from "./routes/drive.js";

const app = Fastify({ logger: true });

// Plugins
await app.register(cors, {
  origin: process.env.FRONTEND_URL ?? "http://localhost:5173",
  credentials: true,
});

await app.register(jwt, {
  secret: process.env.JWT_SECRET ?? "icatto-dev-secret-change-in-prod",
});

await app.register(multipart, {
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB
});

// Routes
await app.register(authRoutes, { prefix: "/auth" });
await app.register(imoveisRoutes, { prefix: "/imoveis" });
await app.register(pessoasRoutes, { prefix: "/pessoas" });
await app.register(contratosRoutes, { prefix: "/contratos" });
await app.register(documentosRoutes, { prefix: "/documentos" });
await app.register(vistoriasRoutes, { prefix: "/vistorias" });
await app.register(assinaturasRoutes, { prefix: "/assinaturas" });
await app.register(driveRoutes, { prefix: "/drive" });

app.get("/health", async () => ({ status: "ok", version: "1.0.0" }));

const port = Number(process.env.PORT ?? 3333);
await app.listen({ port, host: "0.0.0.0" });
console.log(`🚀 API rodando em http://localhost:${port}`);
