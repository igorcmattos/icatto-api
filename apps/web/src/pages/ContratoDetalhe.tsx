import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { api } from "../services/api.ts";

const STATUS_LABEL: Record<string, string> = {
  DOCUMENTACAO: "Documentação", VISTORIA: "Vistoria",
  CONTRATO_GERADO: "Contrato Gerado", ASSINATURA_PENDENTE: "Aguard. Assinatura",
  CONCLUIDO: "Concluído", CANCELADO: "Cancelado",
};

const DOC_LABEL: Record<string, string> = {
  RG: "RG", CPF: "CPF", CNH: "CNH", COMPROVANTE_RESIDENCIA: "Comp. Residência",
  COMPROVANTE_RENDA: "Comp. Renda", DECLARACAO_IR: "Decl. IR",
  ESCRITURA_IMOVEL: "Escritura do Imóvel", IPTU: "IPTU",
  FICHA_CADASTRAL: "Ficha Cadastral", OUTRO: "Outro",
};

export default function ContratoDetalhe() {
  const { id } = useParams<{ id: string }>();
  const [contrato, setContrato] = useState<any>(null);
  const [checklist, setChecklist] = useState<any>(null);
  const [loadingPDF, setLoadingPDF] = useState(false);
  const [sigLink, setSigLink] = useState<{ prop?: string; inq?: string }>({});

  const reload = () => {
    api.get(`/contratos/${id}`).then((r) => setContrato(r.data));
    api.get(`/documentos/${id}/checklist`).then((r) => setChecklist(r.data));
  };

  useEffect(() => { reload(); }, [id]);

  const gerarPDF = async () => {
    setLoadingPDF(true);
    try {
      await api.post(`/contratos/${id}/gerar-pdf`);
      reload();
    } finally {
      setLoadingPDF(false);
    }
  };

  const gerarLinksAssinatura = async () => {
    const [r1, r2] = await Promise.all([
      api.post("/auth/signature-token", { contratoId: id, pessoaId: contrato.proprietarioId }),
      api.post("/auth/signature-token", { contratoId: id, pessoaId: contrato.inquilinoId }),
    ]);
    setSigLink({ prop: r1.data.link, inq: r2.data.link });
    await api.patch(`/contratos/${id}/status`, { status: "ASSINATURA_PENDENTE" });
    reload();
  };

  const handleDocUpload = async (pessoaId: string, tipo: string, file: File) => {
    const fd = new FormData();
    fd.append("pessoaId", pessoaId);
    fd.append("tipo", tipo);
    fd.append("arquivo", file);
    await api.post(`/documentos/${id}/upload`, fd);
    reload();
  };

  const aprovarDoc = async (docId: string, status: "APROVADO" | "REJEITADO") => {
    await api.patch(`/documentos/${docId}/status`, { status });
    reload();
  };

  if (!contrato) return <div className="p-8 text-gray-400">Carregando...</div>;

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold">{contrato.imovel.endereco}, {contrato.imovel.numero}</h2>
          <p className="text-gray-500 text-sm mt-1">{contrato.imovel.cidade}/{contrato.imovel.estado}</p>
        </div>
        <span className="text-sm bg-blue-100 text-blue-800 px-3 py-1 rounded-full font-medium">
          {STATUS_LABEL[contrato.status]}
        </span>
      </div>

      {/* Partes */}
      <div className="grid grid-cols-2 gap-4">
        {[{ label: "Proprietário", pessoa: contrato.proprietario }, { label: "Inquilino", pessoa: contrato.inquilino }].map(({ label, pessoa }) => (
          <div key={label} className="bg-white border border-gray-200 rounded-xl p-5">
            <p className="text-xs font-semibold text-gray-400 uppercase mb-2">{label}</p>
            <p className="font-semibold">{pessoa.nome}</p>
            <p className="text-sm text-gray-500">CPF: {pessoa.cpf}</p>
            <p className="text-sm text-gray-500">{pessoa.email} · {pessoa.telefone}</p>
          </div>
        ))}
      </div>

      {/* Checklist de documentos */}
      {checklist && (
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <h3 className="font-semibold mb-4">Documentos</h3>
          {["proprietario", "inquilino"].map((key) => (
            <div key={key} className="mb-5">
              <p className="text-sm font-medium text-gray-600 mb-2 capitalize">{key}</p>
              <div className="space-y-2">
                {checklist[key]?.map((doc: any) => (
                  <div key={doc.tipo} className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg">
                    <span className="text-sm">{DOC_LABEL[doc.tipo] ?? doc.tipo}</span>
                    <div className="flex items-center gap-2">
                      {doc.status === "PENDENTE" && (
                        <label className="cursor-pointer text-xs text-primary-600 hover:underline">
                          Upload
                          <input type="file" className="hidden" onChange={(e) => e.target.files && handleDocUpload(doc.pessoaId, doc.tipo, e.target.files[0])} />
                        </label>
                      )}
                      {doc.driveUrl && <a href={doc.driveUrl} target="_blank" rel="noreferrer" className="text-xs text-blue-500 hover:underline">Ver</a>}
                      {doc.documentoId && doc.status === "PENDENTE" && (
                        <>
                          <button onClick={() => aprovarDoc(doc.documentoId, "APROVADO")} className="text-xs text-green-600 hover:underline">Aprovar</button>
                          <button onClick={() => aprovarDoc(doc.documentoId, "REJEITADO")} className="text-xs text-red-500 hover:underline">Rejeitar</button>
                        </>
                      )}
                      <span className={`text-xs px-2 py-0.5 rounded-full ${doc.status === "APROVADO" ? "bg-green-100 text-green-700" : doc.status === "REJEITADO" ? "bg-red-100 text-red-700" : "bg-yellow-100 text-yellow-700"}`}>
                        {doc.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Drive */}
      {contrato.driveFolderUrl && (
        <div className="bg-white border border-gray-200 rounded-xl p-5 flex items-center justify-between">
          <p className="text-sm font-medium">Pasta no Google Drive</p>
          <a href={contrato.driveFolderUrl} target="_blank" rel="noreferrer" className="text-sm text-blue-500 hover:underline">Abrir no Drive</a>
        </div>
      )}

      {/* Ações */}
      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <h3 className="font-semibold mb-4">Ações</h3>
        <div className="flex flex-wrap gap-3">
          {contrato.status === "VISTORIA" || contrato.status === "DOCUMENTACAO" ? (
            <button onClick={gerarPDF} disabled={loadingPDF} className="px-4 py-2 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50">
              {loadingPDF ? "Gerando..." : "Gerar Contrato PDF"}
            </button>
          ) : null}

          {contrato.status === "CONTRATO_GERADO" && (
            <button onClick={gerarLinksAssinatura} className="px-4 py-2 text-sm bg-orange-500 text-white rounded-lg hover:bg-orange-600">
              Enviar para Assinatura
            </button>
          )}

          {contrato.contratoUrl && (
            <a href={contrato.contratoUrl} target="_blank" rel="noreferrer" className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700">
              Ver Contrato PDF
            </a>
          )}
        </div>

        {(sigLink.prop || sigLink.inq) && (
          <div className="mt-4 space-y-2">
            {sigLink.prop && (
              <div className="text-sm">
                <span className="font-medium">Link Proprietário: </span>
                <a href={sigLink.prop} target="_blank" rel="noreferrer" className="text-blue-500 break-all">{sigLink.prop}</a>
              </div>
            )}
            {sigLink.inq && (
              <div className="text-sm">
                <span className="font-medium">Link Inquilino: </span>
                <a href={sigLink.inq} target="_blank" rel="noreferrer" className="text-blue-500 break-all">{sigLink.inq}</a>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
