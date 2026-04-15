export declare function uploadFile({ contratoId, subpasta, fileName, buffer, }: {
    contratoId: string;
    subpasta: string;
    fileName: string;
    mimeType: string;
    buffer: Buffer;
}): Promise<{
    fileId: string;
    fileUrl: string;
}>;
export declare function createContratoFolderStructure(contratoId: string): Promise<{
    folderId: string;
    folderUrl: null;
}>;
//# sourceMappingURL=storageService.d.ts.map