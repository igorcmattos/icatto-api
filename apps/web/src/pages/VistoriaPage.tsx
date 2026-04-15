import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { api } from "../services/api.ts";

export default function VistoriaPage() {
  const { contratoId } = useParams<{ contratoId: string }>();
  const [vistoria, setVistoria] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [gerandoPDF, setGerandoPDF] = useState(false);

  // Formulário de nova vistoria
  const [dataVistoria, setDataVistoria] = useState(new Date().toISOString().split("T")[0]);
  const [observacoes, setObservacoes] = useState("");
  const [comodos, setComodos] = useState([{ nome: "", descricao: "" }]);

  const reload = async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/vistorias/${contratoId}`);
      setVistoria(data);
    } catch {
      setVistoria(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { reload(); }, [contratoId]);

  const addComodo = () => setComodos((c) => [...c, { nome: "", descricao: "" }]);
  const removeComodo = (i: number) => setComodos((c) => c.filter((_, idx) => idx !== i));
  const updateComodo = (i: number, key: "nome" | "descricao", val: string) =>
    setComodos((c) => c.map((c2, idx) => idx === i ? { ...c2, [key]: val } : c2));

  const handleCriarVistoria = async (e: React.FormEvent) => {
    e.preventDefault();
    await api.post("/vistorias", {
      contratoId,
      dataVistoria,
      observacoes,
      comodos: comodos.filter((c) => c.nome.trim() !== ""),
    });
    setShowForm(false);
    reload();
  };

  const handleUploadFoto = async (vistoriaId: string, comodoId: string, files: FileList) => {
    const fd = new FormData();
    for (const file of Array.from(files)) {
      fd.append("fotos", file);
    }
    await api.post(`/vistorias/${vistoriaId}/comodos/${comodoId}/fotos`, fd);
    reload();
  };

  const handleExcluirFoto = async (vistoriaId: string, comodoId: string, fotoUrl: string) => {
    if (!confirm("Excluir esta foto?")) return;
    await api.delete(`/vistorias/${vistoriaId}/comodos/${comodoId}/fotos`, { data: { fotoUrl } });
    reload();
  };

  const handleGerarLaudo = async () => {
    setGerandoPDF(true);
    try {
      await api.post(`/vistorias/${vistoria.id}/gerar-laudo`);
      reload();
    } finally {
      setGerandoPDF(false);
    }
  };

  const inputClass = "w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500";

  if (loading) return <div className="p-8 text-gray-400">Carregando...</div>;

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Vistoria</h2>
        {!vistoria && (
          <button
            onClick={() => setShowForm(true)}
            className="bg-primary-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-primary-700"
          >
            + Nova Vistoria
          </button>
        )}
        {vistoria && !vistoria.laudoUrl && (
          <button
            onClick={handleGerarLaudo}
            disabled={gerandoPDF}
            className="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-purple-700 disabled:opacity-50"
          >
            {gerandoPDF ? "Gerando..." : "Gerar Laudo PDF"}
          </button>
        )}
        {vistoria?.laudoUrl && (
          <a
            href={vistoria.laudoUrl}
            target="_blank"
            rel="noreferrer"
            className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-700"
          >
            Ver Laudo PDF
          </a>
        )}
      </div>

      {/* Formulário nova vistoria */}
      {showForm && (
        <form onSubmit={handleCriarVistoria} className="bg-white border border-gray-200 rounded-xl p-6 mb-6 space-y-4">
          <h3 className="font-semibold">Nova Vistoria</h3>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Data da Vistoria</label>
              <input type="date" value={dataVistoria} onChange={(e) => setDataVistoria(e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Observações Gerais</label>
              <input type="text" value={observacoes} onChange={(e) => setObservacoes(e.target.value)} className={inputClass} placeholder="Ex: Imóvel em bom estado geral" />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-xs font-medium text-gray-600">Cômodos</label>
              <button type="button" onClick={addComodo} className="text-xs text-primary-600 hover:underline">+ Adicionar cômodo</button>
            </div>
            <div className="space-y-2">
              {comodos.map((c, i) => (
                <div key={i} className="flex gap-2 items-start">
                  <input
                    type="text"
                    placeholder="Nome (ex: Sala, Quarto 1)"
                    value={c.nome}
                    onChange={(e) => updateComodo(i, "nome", e.target.value)}
                    required
                    className={inputClass}
                  />
                  <input
                    type="text"
                    placeholder="Estado (ex: Bom estado, pintura nova)"
                    value={c.descricao}
                    onChange={(e) => updateComodo(i, "descricao", e.target.value)}
                    className={inputClass}
                  />
                  {comodos.length > 1 && (
                    <button type="button" onClick={() => removeComodo(i)} className="text-red-400 hover:text-red-600 text-sm px-2">✕</button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-3 justify-end">
            <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-sm border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50">Cancelar</button>
            <button type="submit" className="px-4 py-2 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700">Criar Vistoria</button>
          </div>
        </form>
      )}

      {/* Vistoria existente */}
      {vistoria && (
        <div className="space-y-4">
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <p className="text-sm text-gray-500">Data da vistoria: <span className="font-medium text-gray-700">{new Date(vistoria.dataVistoria).toLocaleDateString("pt-BR")}</span></p>
            {vistoria.observacoes && <p className="text-sm text-gray-500 mt-1">Observações: <span className="text-gray-700">{vistoria.observacoes}</span></p>}
          </div>

          {/* Cômodos */}
          {vistoria.comodos?.map((comodo: any) => (
            <div key={comodo.id} className="bg-white border border-gray-200 rounded-xl p-5">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <p className="font-semibold">{comodo.nome}</p>
                  {comodo.descricao && <p className="text-sm text-gray-500 mt-0.5">{comodo.descricao}</p>}
                </div>
                <label className="cursor-pointer text-xs text-primary-600 hover:underline">
                  + Adicionar fotos
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => e.target.files && handleUploadFoto(vistoria.id, comodo.id, e.target.files)}
                  />
                </label>
              </div>

              {/* Fotos */}
              {comodo.fotos?.length > 0 && (
                <div className="grid grid-cols-4 gap-2 mt-3">
                  {comodo.fotos.map((url: string, i: number) => (
                    <div key={i} className="relative group">
                      <a href={url} target="_blank" rel="noreferrer">
                        <div className="bg-gray-100 rounded-lg h-20 overflow-hidden">
                          <img src={url} alt={`foto ${i + 1}`} className="w-full h-full object-cover rounded-lg" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                        </div>
                      </a>
                      <button
                        onClick={() => handleExcluirFoto(vistoria.id, comodo.id, url)}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 text-xs items-center justify-center hidden group-hover:flex"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
              {(!comodo.fotos || comodo.fotos.length === 0) && (
                <p className="text-xs text-gray-400 mt-2">Nenhuma foto adicionada.</p>
              )}
            </div>
          ))}
        </div>
      )}

      {!vistoria && !showForm && (
        <div className="bg-white border border-gray-200 rounded-xl p-10 text-center text-gray-400">
          <p className="text-4xl mb-3">📋</p>
          <p>Nenhuma vistoria registrada para este contrato.</p>
          <button onClick={() => setShowForm(true)} className="mt-4 text-sm text-primary-600 hover:underline">
            Criar vistoria agora
          </button>
        </div>
      )}
    </div>
  );
}
