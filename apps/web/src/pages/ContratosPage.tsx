import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../services/api.ts";

const STATUS_LABEL: Record<string, string> = {
  DOCUMENTACAO: "Documentação", VISTORIA: "Vistoria",
  CONTRATO_GERADO: "Contrato Gerado", ASSINATURA_PENDENTE: "Aguard. Assinatura",
  CONCLUIDO: "Concluído", CANCELADO: "Cancelado",
};
const STATUS_COLOR: Record<string, string> = {
  DOCUMENTACAO: "bg-yellow-100 text-yellow-800", VISTORIA: "bg-blue-100 text-blue-800",
  CONTRATO_GERADO: "bg-purple-100 text-purple-800", ASSINATURA_PENDENTE: "bg-orange-100 text-orange-800",
  CONCLUIDO: "bg-green-100 text-green-800", CANCELADO: "bg-red-100 text-red-800",
};

export default function ContratosPage() {
  const [contratos, setContratos] = useState<any[]>([]);

  useEffect(() => { api.get("/contratos").then((r) => setContratos(r.data)); }, []);

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Contratos</h2>
        <Link to="/contratos/novo" className="bg-primary-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-primary-700">
          + Novo Contrato
        </Link>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
        {contratos.length === 0 && <p className="p-5 text-gray-500 text-sm">Nenhum contrato cadastrado.</p>}
        {contratos.map((c) => (
          <Link key={c.id} to={`/contratos/${c.id}`} className="flex items-center justify-between px-5 py-4 hover:bg-gray-50">
            <div className="flex-1">
              <p className="font-medium text-sm">{c.imovel.endereco}, {c.imovel.numero} — {c.imovel.cidade}</p>
              <p className="text-xs text-gray-500 mt-0.5">
                Proprietário: {c.proprietario.nome} · Inquilino: {c.inquilino.nome}
              </p>
            </div>
            <div className="text-right">
              <span className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_COLOR[c.status]}`}>
                {STATUS_LABEL[c.status]}
              </span>
              <p className="text-xs text-gray-400 mt-1">
                {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(c.valorAluguel))}/mês
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
