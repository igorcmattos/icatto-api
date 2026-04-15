import { useEffect, useState } from "react";
import { api } from "../services/api.ts";

const TIPO_LABEL: Record<string, string> = {
  APARTAMENTO: "Apartamento", CASA: "Casa", KITNET: "Kitnet",
  SALA_COMERCIAL: "Sala Comercial", GALPAO: "Galpão", TERRENO: "Terreno",
};

const TIPOS = Object.keys(TIPO_LABEL);

const emptyForm = {
  endereco: "", numero: "", complemento: "", bairro: "",
  cidade: "", estado: "", cep: "", tipo: "APARTAMENTO",
  quartos: "", banheiros: "", vagas: "", areaM2: "", valorAluguel: "", descricao: "",
};

export default function ImoveisPage() {
  const [imoveis, setImoveis] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editando, setEditando] = useState<any>(null);
  const [form, setForm] = useState({ ...emptyForm });

  const reload = () => api.get("/imoveis").then((r) => setImoveis(r.data));
  useEffect(() => { reload(); }, []);

  const abrirNovo = () => {
    setEditando(null);
    setForm({ ...emptyForm });
    setShowForm(true);
  };

  const abrirEditar = (im: any) => {
    setEditando(im);
    setForm({
      endereco: im.endereco ?? "", numero: im.numero ?? "",
      complemento: im.complemento ?? "", bairro: im.bairro ?? "",
      cidade: im.cidade ?? "", estado: im.estado ?? "", cep: im.cep ?? "",
      tipo: im.tipo ?? "APARTAMENTO",
      quartos: im.quartos ? String(im.quartos) : "",
      banheiros: im.banheiros ? String(im.banheiros) : "",
      vagas: im.vagas ? String(im.vagas) : "",
      areaM2: im.areaM2 ? String(im.areaM2) : "",
      valorAluguel: im.valorAluguel ? String(im.valorAluguel) : "",
      descricao: im.descricao ?? "",
    });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      ...form,
      quartos: form.quartos ? Number(form.quartos) : undefined,
      banheiros: form.banheiros ? Number(form.banheiros) : undefined,
      vagas: form.vagas ? Number(form.vagas) : undefined,
      areaM2: form.areaM2 ? Number(form.areaM2) : undefined,
      valorAluguel: Number(form.valorAluguel),
    };
    if (editando) {
      await api.put(`/imoveis/${editando.id}`, payload);
    } else {
      await api.post("/imoveis", payload);
    }
    await reload();
    setShowForm(false);
  };

  const field = (key: keyof typeof form, label: string, type = "text", required = false) => (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
      <input
        type={type}
        value={form[key]}
        onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
        required={required}
        className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
      />
    </div>
  );

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Imóveis</h2>
        <button onClick={abrirNovo} className="bg-primary-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-primary-700">
          + Cadastrar Imóvel
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-xl p-6 mb-6 grid grid-cols-3 gap-4">
          <h3 className="col-span-3 font-semibold text-gray-700">{editando ? "Editar Imóvel" : "Novo Imóvel"}</h3>
          {field("endereco", "Endereço", "text", true)}
          {field("numero", "Número", "text", true)}
          {field("complemento", "Complemento")}
          {field("bairro", "Bairro", "text", true)}
          {field("cidade", "Cidade", "text", true)}
          {field("estado", "Estado (UF)", "text", true)}
          {field("cep", "CEP", "text", true)}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Tipo</label>
            <select value={form.tipo} onChange={(e) => setForm((f) => ({ ...f, tipo: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none">
              {TIPOS.map((t) => <option key={t} value={t}>{TIPO_LABEL[t]}</option>)}
            </select>
          </div>
          {field("valorAluguel", "Valor Aluguel (R$)", "number", true)}
          {field("areaM2", "Área (m²)", "number")}
          {field("quartos", "Quartos", "number")}
          {field("banheiros", "Banheiros", "number")}
          {field("vagas", "Vagas", "number")}
          <div className="col-span-3">
            <label className="block text-xs font-medium text-gray-600 mb-1">Descrição</label>
            <textarea value={form.descricao} onChange={(e) => setForm((f) => ({ ...f, descricao: e.target.value }))} rows={2} className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none" />
          </div>
          <div className="col-span-3 flex gap-3 justify-end">
            <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50">Cancelar</button>
            <button type="submit" className="px-4 py-2 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700">{editando ? "Salvar Alterações" : "Cadastrar"}</button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-2 gap-4">
        {imoveis.map((im) => (
          <div key={im.id} className="bg-white border border-gray-200 rounded-xl p-5">
            <div className="flex justify-between items-start">
              <div>
                <p className="font-semibold">{im.endereco}, {im.numero}</p>
                <p className="text-sm text-gray-500">{im.bairro} — {im.cidade}/{im.estado}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">{TIPO_LABEL[im.tipo]}</span>
                <button onClick={() => abrirEditar(im)} className="text-xs text-primary-600 hover:underline">Editar</button>
              </div>
            </div>
            <div className="flex gap-4 mt-3 text-xs text-gray-500">
              {im.quartos && <span>{im.quartos} quartos</span>}
              {im.banheiros && <span>{im.banheiros} banheiros</span>}
              {im.vagas && <span>{im.vagas} vagas</span>}
              {im.areaM2 && <span>{im.areaM2} m²</span>}
            </div>
            <p className="mt-2 font-bold text-primary-600">
              {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(im.valorAluguel))}/mês
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
