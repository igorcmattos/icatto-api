type ContratoComRelacoes = any;
type VistoriaComRelacoes = any;
export declare function generateContratoPDF(contrato: ContratoComRelacoes): Promise<{
    pdfBytes: Uint8Array<ArrayBufferLike>;
    driveUrl: string;
}>;
export declare function generateVistoriaPDF(vistoria: VistoriaComRelacoes): Promise<{
    pdfBytes: Uint8Array<ArrayBufferLike>;
    driveUrl: string;
}>;
export declare function embedSignatureInPDF({ contratoId, pessoaId, pessoaNome, pessoaTipo, signatureBuffer, }: {
    contratoId: string;
    pessoaId: string;
    pessoaNome: string;
    pessoaTipo: string;
    signatureBuffer: Buffer;
}): Promise<{
    driveUrl: null;
} | {
    driveUrl: string;
}>;
export {};
//# sourceMappingURL=pdfService.d.ts.map