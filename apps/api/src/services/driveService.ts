import { uploadFile, createContratoFolderStructure as createLocalFolders } from "./storageService.js";
import { prisma } from "../lib/prisma.js";

export async function createContratoFolderStructure(contratoId: string) {
  const { folderId, folderUrl } = await createLocalFolders(contratoId);

  await prisma.contrato.update({
    where: { id: contratoId },
    data: {
      driveFolderId: folderId,
      driveFolderUrl: folderUrl,
    },
  });

  return { folderId, folderUrl };
}

export async function uploadFileToDrive(options: {
  contratoId: string;
  subpasta: string;
  fileName: string;
  mimeType: string;
  buffer: Buffer;
}) {
  return uploadFile(options);
}
