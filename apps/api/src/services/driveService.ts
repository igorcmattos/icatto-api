import { google } from "googleapis";
import { prisma } from "../lib/prisma.js";
import { Readable } from "stream";

function getDriveClient() {
  const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON ?? "{}");
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ["https://www.googleapis.com/auth/drive"],
  });
  return google.drive({ version: "v3", auth });
}

async function createFolder(name: string, parentId: string): Promise<string> {
  const drive = getDriveClient();
  const res = await drive.files.create({
    requestBody: {
      name,
      mimeType: "application/vnd.google-apps.folder",
      parents: [parentId],
    },
    fields: "id",
  });
  return res.data.id!;
}

async function setPublicRead(fileId: string) {
  const drive = getDriveClient();
  await drive.permissions.create({
    fileId,
    requestBody: { role: "reader", type: "anyone" },
  });
}

/**
 * Cria a estrutura de pastas no Drive para um contrato:
 * Root/Contratos/[ID] Endereço/
 *   ├── Proprietário/documentos/
 *   ├── Inquilino/documentos/
 *   └── Vistoria/fotos/
 */
export async function createContratoFolderStructure(contratoId: string) {
  const contrato = await prisma.contrato.findUnique({
    where: { id: contratoId },
    include: { imovel: true },
  });
  if (!contrato) throw new Error("Contrato não encontrado.");

  const rootFolderId = process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID;
  if (!rootFolderId) throw new Error("GOOGLE_DRIVE_ROOT_FOLDER_ID não configurado.");

  // Pasta raiz do contrato
  const contratoNome = `[${contratoId.slice(0, 8)}] ${contrato.imovel.endereco}, ${contrato.imovel.numero} - ${contrato.imovel.cidade}`;
  const contratoFolderId = await createFolder(contratoNome, rootFolderId);
  await setPublicRead(contratoFolderId);

  // Subpastas
  const proprietarioId = await createFolder("Proprietário", contratoFolderId);
  await createFolder("documentos", proprietarioId);

  const inquilinoId = await createFolder("Inquilino", contratoFolderId);
  await createFolder("documentos", inquilinoId);

  const vistoriaId = await createFolder("Vistoria", contratoFolderId);
  await createFolder("fotos", vistoriaId);

  const folderUrl = `https://drive.google.com/drive/folders/${contratoFolderId}`;
  await prisma.contrato.update({
    where: { id: contratoId },
    data: { driveFolderId: contratoFolderId, driveFolderUrl: folderUrl },
  });

  return { folderId: contratoFolderId, folderUrl };
}

interface UploadOptions {
  contratoId: string;
  subpasta: string; // ex: "Proprietário/documentos", "Vistoria/fotos"
  fileName: string;
  mimeType: string;
  buffer: Buffer;
}

/**
 * Faz upload de um arquivo para a subpasta correta dentro da pasta do contrato.
 * Navega pela hierarquia por nome para encontrar a pasta correta.
 */
export async function uploadFileToDrive({ contratoId, subpasta, fileName, mimeType, buffer }: UploadOptions) {
  const contrato = await prisma.contrato.findUnique({ where: { id: contratoId } });
  if (!contrato?.driveFolderId) {
    // Cria estrutura se não existir
    await createContratoFolderStructure(contratoId);
    const updated = await prisma.contrato.findUnique({ where: { id: contratoId } });
    if (!updated?.driveFolderId) throw new Error("Não foi possível criar pasta no Drive.");
    contrato!.driveFolderId = updated.driveFolderId;
  }

  const drive = getDriveClient();
  let parentId = contrato!.driveFolderId!;

  // Navega pelas subpastas
  const partes = subpasta.split("/");
  for (const parte of partes) {
    const res = await drive.files.list({
      q: `'${parentId}' in parents and name='${parte}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
      fields: "files(id)",
    });
    if (res.data.files && res.data.files.length > 0) {
      parentId = res.data.files[0].id!;
    } else {
      parentId = await createFolder(parte, parentId);
    }
  }

  // Upload do arquivo
  const readable = Readable.from(buffer);
  const uploadRes = await drive.files.create({
    requestBody: { name: fileName, parents: [parentId] },
    media: { mimeType, body: readable },
    fields: "id, webViewLink",
  });

  await setPublicRead(uploadRes.data.id!);

  return {
    fileId: uploadRes.data.id!,
    fileUrl: uploadRes.data.webViewLink!,
  };
}
