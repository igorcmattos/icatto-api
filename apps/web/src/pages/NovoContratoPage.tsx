import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../services/api.ts";

const STEPS = ["Imóvel", "Proprietário", "Inquilino", "Condições", "Confirmar"];

export default function NovoContratoPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [imoveis, setImoveis] = useState<any[]>([]);
  const [proprietarios, setProprietarios] = useState<any[]>([]);
  const [inquilinos, setInquilinos] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    imovelId: "", proprietarioId: "", inquilinoId: "",
    dataInicio: "", dataFim: "", valorAluguel: "",
    diaVencimento: "10", garantia: "", observacoes: "",
  });

  useEffect(() => {
    api.get("/imoveis").then((r) => setImoveis(r.data));
    api.get("/pessoas?tipo=PROPRIETARIO").then((r) => setProprietarios(r.data));
    api.get("/pessoas?tipo=INQUILINO").then((r) => setInquilinos(r.data));
  }, []);

  const update = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const canNext = () => {
    if (step === 0) return !!form.imovelId;
    if (step === 1) return !!form.proprietarioId;
    if (step === 2) return !!form.inquilinoId;
    if (step === 3) return !!(form.dataInicio && form.dataFim && form.valorAluguel);
    return true;
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const { data } = await api.post("/contratos", {
        ...form,
        valorAluguel: Number(form.valorAluguel),
        diaVencimento: Number(form.diaVencimento),
        garantia: form.garantia || undefined,
      });
      navigate(`/contratos/${data.id}`);
    } finally {
      setLoading(false);
    }
  };

  const imovelSel = imoveis.find((i) => i.id === form.imovelId);
  const propSel = proprietarios.find((p) => p.id === form.proprietarioId);
  const inqSel = inquilinos.find((i) => i.id === form.inquilinoId);

  const selectClass = "w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500";
  const inputClass = selectClass;

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">Novo Contrato</h2>

      {/* Steps indicator */}
      <div className="flex items-center mb-8">
        {STEPS.map((s, i) => (
          <div key={i} className="flex items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${i <= step ? "bg-primary-600 text-white" : "bg-gray-200 text-gray-500"}`}>
              {i + 1}
            </div>
            <span className={`ml-2 text-sm ${i === step ? "font-semibold" : "text-gray-400"}`}>{s}</span>
            {i < STEPS.length - 1 && <div className={`h-px w-8 mx-3 ${i < step ? "bg-primary-600" : "bg-gray-200"}`} />}
          </div>
        ))}
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-6">
        {/* Etapa 0: Imóvel */}
        {step === 0 && (
          <div className="space-y-3">
            <h3 className="font-semibold mb-4">Selecione o Imóvel</h3>
            {imoveis.map((im) => (
              <label key={im.id} className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer ${form.imovelId === im.id ? "border-primary-500 bg-primary-50" : "border-gray-200 hover:border-gray-300"}`}>
                <input type="radio" name="imovel" value={im.id} checked={form.imovelId === im.id} onChange={() => update("imovelId", im.id)} className="accent-primary-600" />
                <div>
                  <p className="text-sm font-medium">{im.endereco}, {im.numero} — {im.cidade}</p>
                  <p className="text-xs text-gray-500">{im.tipo} · {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(im.valorAluguel))}/mês</p>
                </div>
              </label>
            ))}
          </div>
        )}

        {/* Etapa 1: Proprietário */}
        {step === 1 && (
          <div className="space-y-3">
            <h3 className="font-semibold mb-4">Selecione o Proprietário</h3>
            {proprietarios.map((p) => (
              <label key={p.id} className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer ${form.proprietarioId === p.id ? "border-primary-500 bg-primary-50" : "border-gray-200 hover:border-gray-300"}`}>
                <input type="radio" name="prop" value={p.id} checked={form.proprietarioId === p.id} onChange={() => update("proprietarioId", p.id)} className="accent-primary-600" />
                <div>
                  <p className="text-sm font-medium">{p.nome}</p>
                  <p className="text-xs text-gray-500">CPF: {p.cpf} · {p.email}</p>
                </div>
              </label>
            ))}
          </div>
        )}

        {/* Etapa 2: Inquilino */}
        {step === 2 && (
          <div className="space-y-3">
            <h3 className="font-semibold mb-4">Selecione o Inquilino</h3>
            {inquilinos.map((i) => (
              <label key={i.id} className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer ${form.inquilinoId === i.id ? "border-primary-500 bg-primary-50" : "border-gray-200 hover:border-gray-300"}`}>
                <input type="radio" name="inq" value={i.id} checked={form.inquilinoId === i.id} onChange={() => update("inquilinoId", i.id)} className="accent-primary-600" />
                <div>
                  <p className="text-sm font-medium">{i.nome}</p>
                  <p className="text-xs text-gray-500">CPF: {i.cpf} · {i.email}</p>
                </div>
              </label>
            ))}
          </div>
        )}

        {/* Etapa 3: Condições */}
        {step === 3 && (
          <div className="space-y-4">
            <h3 className="font-semibold mb-4">Condições do Contrato</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Data de Início</label>
                <input type="date" value={form.dataInicio} onChange={(e) => update("dataInicio", e.target.value)} required className={inputClass} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Data de Término</label>
                <input type="date" value={form.dataFim} onChange={(e) => update("dataFim", e.target.value)} required className={inputClass} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Valor do Aluguel (R$)</label>
                <input type="number" value={form.valorAluguel} onChange={(e) => update("valorAluguel", e.target.value)} required className={inputClass} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Dia de Vencimento</label>
                <input type="number" min={1} max={28} value={form.diaVencimento} onChange={(e) => update("diaVencimento", e.target.value)} className={inputClass} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Garantia</label>
                <select value={form.garantia} onChange={(e) => update("garantia", e.target.value)} className={selectClass}>
                  <option value="">Sem garantia</option>
                  <option value="CAUCAO">Caução</option>
                  <option value="FIADOR">Fiador</option>
                  <option value="SEGURO_FIANCA">Seguro Fiança</option>
                  <option value="TITULO_CAPITALIZACAO">Título de Capitalização</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Observações</label>
              <textarea value={form.observacoes} onChange={(e) => update("observacoes", e.target.value)} rows={3} className={inputClass} />
            </div>
          </div>
        )}

        {/* Etapa 4: Confirmação */}
        {step === 4 && (
          <div className="space-y-3">
            <h3 className="font-semibold mb-4">Confirme os Dados</h3>
            <div className="bg-gray-50 rounded-lg p-4 text-sm space-y-2">
              <p><span className="font-medium">Imóvel:</span> {imovelSel?.endereco}, {imovelSel?.numero} — {imovelSel?.cidade}</p>
              <p><span className="font-medium">Proprietário:</span> {propSel?.nome}</p>
              <p><span className="font-medium">Inquilino:</span> {inqSel?.nome}</p>
              <p><span className="font-medium">Período:</span> {form.dataInicio} a {form.dataFim}</p>
              <p><span className="font-medium">Valor:</span> R$ {form.valorAluguel} — vence todo dia {form.diaVencimento}</p>
              {form.garantia && <p><span className="font-medium">Garantia:</span> {form.garantia}</p>}
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex justify-between mt-6">
        <button
          onClick={() => setStep((s) => s - 1)}
          disabled={step === 0}
          className="px-4 py-2 text-sm border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 disabled:opacity-40"
        >
          Voltar
        </button>
        {step < STEPS.length - 1 ? (
          <button
            onClick={() => setStep((s) => s + 1)}
            disabled={!canNext()}
            className="px-6 py-2 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-40"
          >
            Próximo
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="px-6 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-40"
          >
            {loading ? "Criando..." : "Criar Contrato"}
          </button>
        )}
      </div>
    </div>
  );
}
