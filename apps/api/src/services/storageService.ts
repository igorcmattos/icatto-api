import { promises as fs } from "fs";
import path from "path";

const UPLOAD_DIR = process.env.UPLOAD_DIR ?? "/var/www/icatto-api/uploads";
const BASE_URL = process.env.FRONTEND_URL ?? "https://mobi.icatto.com.br";

export async function uploadFile({
  contratoId,
  subpasta,
  fileName,
  buffer,
}: {
  contratoId: string;
  subpasta: string;
  fileName: string;
  mimeType: string;
  buffer: Buffer;
}) {
  const dir = path.join(UPLOAD_DIR, contratoId, subpasta);
  await fs.mkdir(dir, { recursive: true });

  // Evita sobrescrever arquivos com mesmo nome
  const safeName = `${Date.now()}-${fileName.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
  const filePath = path.join(dir, safeName);
  await fs.writeFile(filePath, buffer);

  const fileUrl = `${BASE_URL}/api/uploads/${contratoId}/${subpasta}/${safeName}`;

  return {
    fileId: filePath,
    fileUrl,
  };
}

export async function createContratoFolderStructure(contratoId: string) {
  const dirs = [
    path.join(UPLOAD_DIR, contratoId, "Proprietario", "documentos"),
    path.join(UPLOAD_DIR, contratoId, "Inquilino", "documentos"),
    path.join(UPLOAD_DIR, contratoId, "Vistoria", "fotos"),
  ];
  for (const dir of dirs) {
    await fs.mkdir(dir, { recursive: true });
  }
  return { folderId: contratoId, folderUrl: null };
}
