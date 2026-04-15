export declare function enviarEmailAssinatura({ destinatario, nomeDestinatario, tipoDestinatario, nomeImobiliaria, enderecoImovel, linkAssinatura, expiresAt, }: {
    destinatario: string;
    nomeDestinatario: string;
    tipoDestinatario: "PROPRIETARIO" | "INQUILINO";
    nomeImobiliaria: string;
    enderecoImovel: string;
    linkAssinatura: string;
    expiresAt: Date;
}): Promise<void>;
//# sourceMappingURL=emailService.d.ts.map