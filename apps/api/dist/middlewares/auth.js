export async function authenticate(req, reply) {
    try {
        await req.jwtVerify();
    }
    catch {
        return reply.status(401).send({ error: "Não autorizado." });
    }
}
//# sourceMappingURL=auth.js.map