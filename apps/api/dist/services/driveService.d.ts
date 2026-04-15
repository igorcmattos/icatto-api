/**
 * Cria a estrutura de pastas no Drive para um contrato:
 * Root/Contratos/[ID] Endereço/
 *   ├── Proprietário/documentos/
 *   ├── Inquilino/documentos/
 *   └── Vistoria/fotos/
 */
export declare function createContratoFolderStructure(contratoId: string): Promise<{
    folderId: string;
    folderUrl: string;
}>;
interface UploadOptions {
    contratoId: string;
    subpasta: string;
    fileName: string;
    mimeType: string;
    buffer: Buffer;
}
/**
 * Faz upload de um arquivo para a subpasta correta dentro da pasta do contrato.
 * Navega pela hierarquia por nome para encontrar a pasta correta.
 */
export declare function uploadFileToDrive({ contratoId, subpasta, fileName, mimeType, buffer }: UploadOptions): Promise<{
    fileId: string;
    fileUrl: string;
}>;
export {};
//# sourceMappingURL=driveService.d.ts.map