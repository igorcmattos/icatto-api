import { PDFDocument, StandardFonts, rgb, PageSizes } from "pdf-lib";
import { uploadFileToDrive } from "./driveService.js";

type ContratoComRelacoes = any; // tipagem simplificada para evitar import circular
type VistoriaComRelacoes = any;

function formatarData(date: Date | null | undefined): string {
  if (!date) return "—";
  return new Intl.DateTimeFormat("pt-BR").format(new Date(date));
}

function formatarMoeda(valor: any): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(valor));
}

// ─────────────────────────────────────────────
// GERAR CONTRATO DE LOCAÇÃO
// ─────────────────────────────────────────────
export async function generateContratoPDF(contrato: ContratoComRelacoes) {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);

  const page = doc.addPage(PageSizes.A4);
  const { width, height } = page.getSize();
  const margin = 50;
  let y = height - margin;

  const drawText = (text: string, x: number, yPos: number, size = 10, bold = false, color = rgb(0, 0, 0)) => {
    page.drawText(text, { x, y: yPos, size, font: bold ? fontBold : font, color });
  };

  const drawLine = (yPos: number) => {
    page.drawLine({ start: { x: margin, y: yPos }, end: { x: width - margin, y: yPos }, thickness: 0.5, color: rgb(0.7, 0.7, 0.7) });
  };

  // Cabeçalho
  drawText(contrato.imobiliaria.nome.toUpperCase(), margin, y, 16, true);
  y -= 20;
  drawText("CONTRATO DE LOCAÇÃO RESIDENCIAL", margin, y, 13, true);
  y -= 8;
  drawLine(y);
  y -= 20;

  // Dados do imóvel
  drawText("DO IMÓVEL", margin, y, 11, true);
  y -= 16;
  const imovel = contrato.imovel;
  drawText(`Endereço: ${imovel.endereco}, ${imovel.numero}${imovel.complemento ? `, ${imovel.complemento}` : ""}`, margin, y, 10);
  y -= 14;
  drawText(`Bairro: ${imovel.bairro} — Cidade: ${imovel.cidade}/${imovel.estado} — CEP: ${imovel.cep}`, margin, y, 10);
  y -= 14;
  drawText(`Tipo: ${imovel.tipo}  |  Área: ${imovel.areaM2 ?? "—"} m²  |  Quartos: ${imovel.quartos ?? "—"}  |  Banheiros: ${imovel.banheiros ?? "—"}`, margin, y, 10);
  y -= 20;

  // Proprietário
  drawText("DO LOCADOR (PROPRIETÁRIO)", margin, y, 11, true);
  y -= 16;
  const prop = contrato.proprietario;
  drawText(`Nome: ${prop.nome}  |  CPF: ${prop.cpf}  |  RG: ${prop.rg ?? "—"}`, margin, y, 10);
  y -= 14;
  drawText(`E-mail: ${prop.email}  |  Telefone: ${prop.telefone}`, margin, y, 10);
  y -= 20;

  // Inquilino
  drawText("DO LOCATÁRIO (INQUILINO)", margin, y, 11, true);
  y -= 16;
  const inq = contrato.inquilino;
  drawText(`Nome: ${inq.nome}  |  CPF: ${inq.cpf}  |  RG: ${inq.rg ?? "—"}`, margin, y, 10);
  y -= 14;
  drawText(`E-mail: ${inq.email}  |  Telefone: ${inq.telefone}`, margin, y, 10);
  y -= 14;
  drawText(`Profissão: ${inq.profissao ?? "—"}  |  Renda: ${inq.rendaMensal ? formatarMoeda(inq.rendaMensal) : "—"}`, margin, y, 10);
  y -= 20;

  // Condições
  drawText("DAS CONDIÇÕES", margin, y, 11, true);
  y -= 16;
  drawText(`Início: ${formatarData(contrato.dataInicio)}  |  Término: ${formatarData(contrato.dataFim)}`, margin, y, 10);
  y -= 14;
  drawText(`Valor do Aluguel: ${formatarMoeda(contrato.valorAluguel)}  |  Vencimento: Todo dia ${contrato.diaVencimento}`, margin, y, 10);
  y -= 14;
  drawText(`Garantia: ${contrato.garantia ?? "Não informada"}`, margin, y, 10);
  y -= 20;

  if (contrato.observacoes) {
    drawText("OBSERVAÇÕES", margin, y, 11, true);
    y -= 16;
    drawText(contrato.observacoes, margin, y, 10);
    y -= 20;
  }

  // Assinaturas
  y -= 40;
  drawLine(y);
  y -= 20;
  drawText(`${prop.nome} — CPF: ${prop.cpf}`, margin, y, 10);
  drawText(`${inq.nome} — CPF: ${inq.cpf}`, width / 2, y, 10);
  y -= 12;
  drawText("Locador (Proprietário)", margin, y, 9, false, rgb(0.4, 0.4, 0.4));
  drawText("Locatário (Inquilino)", width / 2, y, 9, false, rgb(0.4, 0.4, 0.4));

  const pdfBytes = await doc.save();
  const buffer = Buffer.from(pdfBytes);

  const { fileUrl: driveUrl } = await uploadFileToDrive({
    contratoId: contrato.id,
    subpasta: ".",
    fileName: "contrato_locacao.pdf",
    mimeType: "application/pdf",
    buffer,
  });

  return { pdfBytes, driveUrl };
}

// ─────────────────────────────────────────────
// GERAR LAUDO DE VISTORIA
// ─────────────────────────────────────────────
export async function generateVistoriaPDF(vistoria: VistoriaComRelacoes) {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);

  let page = doc.addPage(PageSizes.A4);
  const { width, height } = page.getSize();
  const margin = 50;
  let y = height - margin;

  const drawText = (text: string, x: number, yPos: number, size = 10, bold = false) => {
    page.drawText(text, { x, y: yPos, size, font: bold ? fontBold : font, color: rgb(0, 0, 0) });
  };

  const checkNewPage = () => {
    if (y < 80) {
      page = doc.addPage(PageSizes.A4);
      y = height - margin;
    }
  };

  drawText(vistoria.contrato.imobiliaria.nome.toUpperCase(), margin, y, 14, true);
  y -= 20;
  drawText("LAUDO DE VISTORIA", margin, y, 13, true);
  y -= 8;
  page.drawLine({ start: { x: margin, y }, end: { x: width - margin, y }, thickness: 0.5, color: rgb(0.7, 0.7, 0.7) });
  y -= 20;

  drawText(`Imóvel: ${vistoria.contrato.imovel.endereco}, ${vistoria.contrato.imovel.numero} — ${vistoria.contrato.imovel.cidade}`, margin, y, 10);
  y -= 14;
  drawText(`Data da Vistoria: ${formatarData(vistoria.dataVistoria)}`, margin, y, 10);
  if (vistoria.observacoes) {
    y -= 14;
    drawText(`Observações gerais: ${vistoria.observacoes}`, margin, y, 10);
  }
  y -= 24;

  for (const comodo of vistoria.comodos) {
    checkNewPage();
    drawText(comodo.nome.toUpperCase(), margin, y, 11, true);
    y -= 14;
    drawText(comodo.descricao ?? "Sem descrição registrada.", margin, y, 10);
    y -= 14;
    if (comodo.fotos.length > 0) {
      drawText(`Fotos registradas: ${comodo.fotos.length}`, margin, y, 9, false);
      y -= 12;
      for (const url of comodo.fotos) {
        drawText(`• ${url}`, margin + 10, y, 8);
        y -= 11;
        checkNewPage();
      }
    }
    y -= 10;
  }

  const pdfBytes = await doc.save();
  const buffer = Buffer.from(pdfBytes);

  const { fileUrl: driveUrl } = await uploadFileToDrive({
    contratoId: vistoria.contratoId,
    subpasta: "Vistoria",
    fileName: "laudo_vistoria.pdf",
    mimeType: "application/pdf",
    buffer,
  });

  return { pdfBytes, driveUrl };
}

// ─────────────────────────────────────────────
// EMBUTE ASSINATURA NO PDF
// ─────────────────────────────────────────────
export async function embedSignatureInPDF({
  contratoId,
  pessoaId,
  pessoaNome,
  pessoaTipo,
  signatureBuffer,
}: {
  contratoId: string;
  pessoaId: string;
  pessoaNome: string;
  pessoaTipo: string;
  signatureBuffer: Buffer;
}) {
  const { prisma: db } = await import("../lib/prisma.js");
  const contrato = await db.contrato.findUnique({ where: { id: contratoId } });
  if (!contrato?.contratoUrl) {
    return { driveUrl: null };
  }

  // Baixa o PDF existente do Drive e embute a assinatura
  const drive = (await import("googleapis")).google.drive;
  const { google } = await import("googleapis");
  const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON ?? "{}");
  const auth = new google.auth.GoogleAuth({ credentials, scopes: ["https://www.googleapis.com/auth/drive"] });
  const driveClient = google.drive({ version: "v3", auth });

  // Obtém o PDF pelo fileId salvo no contrato
  const fileListRes = await driveClient.files.list({
    q: `'${contrato.driveFolderId}' in parents and name='contrato_locacao.pdf' and trashed=false`,
    fields: "files(id)",
  });
  const pdfFileId = fileListRes.data.files?.[0]?.id;
  if (!pdfFileId) return { driveUrl: contrato.contratoUrl };

  const pdfStream = await driveClient.files.get({ fileId: pdfFileId, alt: "media" }, { responseType: "arraybuffer" });
  const existingPdfBytes = pdfStream.data as ArrayBuffer;

  const pdfDoc = await PDFDocument.load(existingPdfBytes);
  const sigImage = await pdfDoc.embedPng(signatureBuffer);

  const pages = pdfDoc.getPages();
  const lastPage = pages[pages.length - 1];
  const { width } = lastPage.getSize();

  // Posição da assinatura: proprietário à esquerda, inquilino à direita
  const xPos = pessoaTipo === "PROPRIETARIO" ? 60 : width / 2 + 10;
  const sigDims = sigImage.scaleToFit(160, 50);
  lastPage.drawImage(sigImage, { x: xPos, y: 30, width: sigDims.width, height: sigDims.height });

  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  lastPage.drawText(pessoaNome, { x: xPos, y: 25, size: 7, font, color: rgb(0.3, 0.3, 0.3) });

  const signedPdfBytes = await pdfDoc.save();
  const signedBuffer = Buffer.from(signedPdfBytes);

  // Substitui o arquivo no Drive
  const { Readable } = await import("stream");
  await driveClient.files.update({
    fileId: pdfFileId,
    media: { mimeType: "application/pdf", body: Readable.from(signedBuffer) },
  });

  return { driveUrl: contrato.contratoUrl };
}
