import { useEffect, useState } from "react";
import { api } from "../services/api.ts";

const ESTADO_CIVIL = ["Solteiro(a)", "Casado(a)", "Divorciado(a)", "Viúvo(a)", "União Estável"];

const emptyForm = {
  nome: "", cpf: "", rg: "", dataNasc: "", email: "", telefone: "",
  profissao: "", rendaMensal: "", estadoCivil: "", nacionalidade: "Brasileira",
  tipo: "INQUILINO",
};

export default function PessoasPage() {
  const [pessoas, setPessoas] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editando, setEditando] = useState<any>(null);
  const [filtro, setFiltro] = useState<"TODOS" | "PROPRIETARIO" | "INQUILINO">("TODOS");
  const [form, setForm] = useState({ ...emptyForm });

  const reload = () =>
    api.get("/pessoas").then((r) => setPessoas(r.data));

  useEffect(() => { reload(); }, []);

  const update = (k: keyof typeof emptyForm, v: string) =>
    setForm((f) => ({ ...f, [k]: v }));

  const abrirNovo = () => {
    setEditando(null);
    setForm({ ...emptyForm });
    setShowForm(true);
  };

  const abrirEditar = (p: any) => {
    setEditando(p);
    setForm({
      nome: p.nome ?? "", cpf: p.cpf ?? "", rg: p.rg ?? "",
      dataNasc: p.dataNasc ? p.dataNasc.split("T")[0] : "",
      email: p.email ?? "", telefone: p.telefone ?? "",
      profissao: p.profissao ?? "",
      rendaMensal: p.rendaMensal ? String(p.rendaMensal) : "",
      estadoCivil: p.estadoCivil ?? "", nacionalidade: p.nacionalidade ?? "Brasileira",
      tipo: p.tipo ?? "INQUILINO",
    });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      ...form,
      rendaMensal: form.rendaMensal ? Number(form.rendaMensal) : undefined,
      dataNasc: form.dataNasc || undefined,
    };
    if (editando) {
      await api.put(`/pessoas/${editando.id}`, payload);
    } else {
      await api.post("/pessoas", payload);
    }
    await reload();
    setShowForm(false);
  };

  const pessoasFiltradas = filtro === "TODOS"
    ? pessoas
    : pessoas.filter((p) => p.tipo === filtro);

  const inputClass = "w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500";

  const field = (key: keyof typeof emptyForm, label: string, type = "text", required = false) => (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
      <input
        type={type}
        value={form[key]}
        onChange={(e) => update(key, e.target.value)}
        required={required}
        className={inputClass}
      />
    </div>
  );

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Pessoas</h2>
        <button onClick={abrirNovo} className="bg-primary-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-primary-700">
          + Cadastrar Pessoa
        </button>
      </div>

      {/* Filtro */}
      <div className="flex gap-2 mb-5">
        {(["TODOS", "PROPRIETARIO", "INQUILINO"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFiltro(f)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${filtro === f ? "bg-primary-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
          >
            {f === "TODOS" ? "Todos" : f === "PROPRIETARIO" ? "Proprietários" : "Inquilinos"}
          </button>
        ))}
      </div>

      {/* Formulário */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-xl p-6 mb-6 grid grid-cols-3 gap-4">
          <h3 className="col-span-3 font-semibold text-gray-700">
            {editando ? "Editar Pessoa" : "Nova Pessoa"}
          </h3>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Tipo</label>
            <select value={form.tipo} onChange={(e) => update("tipo", e.target.value)} className={inputClass} disabled={!!editando}>
              <option value="PROPRIETARIO">Proprietário</option>
              <option value="INQUILINO">Inquilino</option>
            </select>
          </div>

          {field("nome", "Nome completo", "text", true)}
          {field("cpf", "CPF (só números)", "text", true)}
          {field("rg", "RG")}
          {field("dataNasc", "Data de Nascimento", "date")}
          {field("email", "E-mail", "email", true)}
          {field("telefone", "Telefone", "text", true)}
          {field("profissao", "Profissão")}
          {field("rendaMensal", "Renda Mensal (R$)", "number")}
          {field("nacionalidade", "Nacionalidade")}

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Estado Civil</label>
            <select value={form.estadoCivil} onChange={(e) => update("estadoCivil", e.target.value)} className={inputClass}>
              <option value="">Selecione</option>
              {ESTADO_CIVIL.map((ec) => <option key={ec} value={ec}>{ec}</option>)}
            </select>
          </div>

          <div className="col-span-3 flex gap-3 justify-end">
            <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50">
              Cancelar
            </button>
            <button type="submit" className="px-4 py-2 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700">
              {editando ? "Salvar Alterações" : "Cadastrar"}
            </button>
          </div>
        </form>
      )}

      {/* Lista */}
      <div className="bg-white border border-gray-200 rounded-xl divide-y divide-gray-100">
        {pessoasFiltradas.length === 0 && (
          <p className="p-5 text-gray-500 text-sm">Nenhuma pessoa cadastrada.</p>
        )}
        {pessoasFiltradas.map((p) => (
          <div key={p.id} className="flex items-center justify-between px-5 py-4">
            <div>
              <p className="font-medium text-sm">{p.nome}</p>
              <p className="text-xs text-gray-500 mt-0.5">
                CPF: {p.cpf} · {p.email} · {p.telefone}
              </p>
              {p.profissao && (
                <p className="text-xs text-gray-400">{p.profissao}{p.rendaMensal ? ` · Renda: ${new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(p.rendaMensal))}` : ""}</p>
              )}
            </div>
            <div className="flex items-center gap-3">
              <span className={`text-xs px-2 py-1 rounded-full font-medium ${p.tipo === "PROPRIETARIO" ? "bg-blue-100 text-blue-800" : "bg-green-100 text-green-800"}`}>
                {p.tipo === "PROPRIETARIO" ? "Proprietário" : "Inquilino"}
              </span>
              <button onClick={() => abrirEditar(p)} className="text-xs text-primary-600 hover:underline">
                Editar
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
