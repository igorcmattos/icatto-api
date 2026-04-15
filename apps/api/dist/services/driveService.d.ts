export declare function createContratoFolderStructure(contratoId: string): Promise<{
    folderId: string;
    folderUrl: null;
}>;
export declare function uploadFileToDrive(options: {
    contratoId: string;
    subpasta: string;
    fileName: string;
    mimeType: string;
    buffer: Buffer;
}): Promise<{
    fileId: string;
    fileUrl: string;
}>;
//# sourceMappingURL=driveService.d.ts.map