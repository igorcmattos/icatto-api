import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../services/api.ts";

const STATUS_LABEL: Record<string, string> = {
  DOCUMENTACAO: "Documentação",
  VISTORIA: "Vistoria",
  CONTRATO_GERADO: "Contrato Gerado",
  ASSINATURA_PENDENTE: "Aguardando Assinatura",
  CONCLUIDO: "Concluído",
  CANCELADO: "Cancelado",
};

const STATUS_COLOR: Record<string, string> = {
  DOCUMENTACAO: "bg-yellow-100 text-yellow-800",
  VISTORIA: "bg-blue-100 text-blue-800",
  CONTRATO_GERADO: "bg-purple-100 text-purple-800",
  ASSINATURA_PENDENTE: "bg-orange-100 text-orange-800",
  CONCLUIDO: "bg-green-100 text-green-800",
  CANCELADO: "bg-red-100 text-red-800",
};

export default function DashboardPage() {
  const [contratos, setContratos] = useState<any[]>([]);

  useEffect(() => {
    api.get("/contratos").then((r) => setContratos(r.data));
  }, []);

  const ativos = contratos.filter((c) => c.status !== "CANCELADO" && c.status !== "CONCLUIDO");
  const concluidos = contratos.filter((c) => c.status === "CONCLUIDO");

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-2xl font-bold">Dashboard</h2>
        <Link
          to="/contratos/novo"
          className="bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-700"
        >
          + Novo Contrato
        </Link>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-sm text-gray-500">Contratos Ativos</p>
          <p className="text-3xl font-bold text-primary-600 mt-1">{ativos.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-sm text-gray-500">Concluídos</p>
          <p className="text-3xl font-bold text-green-600 mt-1">{concluidos.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-sm text-gray-500">Total</p>
          <p className="text-3xl font-bold mt-1">{contratos.length}</p>
        </div>
      </div>

      {/* Lista de contratos ativos */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="p-5 border-b border-gray-100">
          <h3 className="font-semibold">Contratos em Andamento</h3>
        </div>
        {ativos.length === 0 ? (
          <p className="p-5 text-gray-500 text-sm">Nenhum contrato ativo.</p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {ativos.map((c) => (
              <li key={c.id}>
                <Link to={`/contratos/${c.id}`} className="flex items-center justify-between px-5 py-4 hover:bg-gray-50">
                  <div>
                    <p className="font-medium text-sm">
                      {c.imovel.endereco}, {c.imovel.numero}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Inquilino: {c.inquilino.nome}
                    </p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_COLOR[c.status]}`}>
                    {STATUS_LABEL[c.status]}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
