import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import SignatureCanvas from "react-signature-canvas";
import axios from "axios";

export default function AssinarPage() {
  const { token } = useParams<{ token: string }>();
  const [info, setInfo] = useState<any>(null);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState(false);
  const [loading, setLoading] = useState(false);
  const sigRef = useRef<SignatureCanvas>(null);

  useEffect(() => {
    axios
      .get(`/api/assinaturas/${token}`)
      .then((r) => setInfo(r.data))
      .catch((e) => setErro(e.response?.data?.error ?? "Link inválido ou expirado."));
  }, [token]);

  const handleAssinar = async () => {
    if (!sigRef.current || sigRef.current.isEmpty()) {
      alert("Por favor, assine no campo abaixo antes de confirmar.");
      return;
    }
    setLoading(true);
    try {
      const assinaturaBase64 = sigRef.current.getTrimmedCanvas().toDataURL("image/png");
      await axios.post(`/api/assinaturas/${token}`, { assinaturaBase64 });
      setSucesso(true);
    } catch (e: any) {
      setErro(e.response?.data?.error ?? "Erro ao registrar assinatura.");
    } finally {
      setLoading(false);
    }
  };

  if (erro) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white rounded-2xl shadow-lg p-10 max-w-sm text-center">
        <p className="text-red-500 text-lg font-semibold">{erro}</p>
      </div>
    </div>
  );

  if (sucesso) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white rounded-2xl shadow-lg p-10 max-w-sm text-center">
        <p className="text-5xl mb-4">✅</p>
        <h2 className="text-xl font-bold text-green-600">Assinatura registrada!</h2>
        <p className="text-gray-500 text-sm mt-2">Seu documento foi assinado com sucesso.</p>
      </div>
    </div>
  );

  if (!info) return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-gray-400">Carregando...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-lg">
        <h1 className="text-2xl font-bold text-primary-600 mb-1">Icatto</h1>
        <p className="text-gray-500 text-sm mb-6">Assinatura Eletrônica de Contrato</p>

        <div className="bg-gray-50 rounded-xl p-4 mb-6 text-sm space-y-1">
          <p><span className="font-medium">Assinante:</span> {info.pessoa.nome} ({info.pessoa.tipo === "PROPRIETARIO" ? "Proprietário" : "Inquilino"})</p>
          <p><span className="font-medium">Imóvel:</span> {info.contrato.imovel}</p>
          <p><span className="font-medium">Imobiliária:</span> {info.contrato.imobiliaria}</p>
          <p><span className="font-medium">Validade do link:</span> {new Date(info.expiresAt).toLocaleString("pt-BR")}</p>
        </div>

        <p className="text-sm font-medium text-gray-700 mb-2">Assine abaixo:</p>
        <div className="border-2 border-dashed border-gray-300 rounded-xl overflow-hidden mb-4">
          <SignatureCanvas
            ref={sigRef}
            penColor="black"
            canvasProps={{ width: 460, height: 180, className: "w-full" }}
          />
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => sigRef.current?.clear()}
            className="flex-1 py-2 text-sm border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50"
          >
            Limpar
          </button>
          <button
            onClick={handleAssinar}
            disabled={loading}
            className="flex-1 py-2 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium disabled:opacity-50"
          >
            {loading ? "Registrando..." : "Confirmar Assinatura"}
          </button>
        </div>

        <p className="text-xs text-gray-400 mt-4 text-center">
          Ao confirmar, você concorda que esta assinatura eletrônica tem validade legal conforme a MP 2.200-2/2001.
        </p>
      </div>
    </div>
  );
}
