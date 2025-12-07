
import React, { useState } from 'react';
import { Copy, Terminal, Wand2, ArrowRight, Check, Sparkles, FileText } from 'lucide-react';
import { PROJECT_CAPABILITIES } from '../AI_CONTEXT';

export const PromptManager: React.FC = () => {
  const [userInput, setUserInput] = useState('');
  const [optimizedPrompt, setOptimizedPrompt] = useState('');
  const [copied, setCopied] = useState(false);

  const generatePrompt = () => {
    if (!userInput.trim()) return;

    // Construcción del Prompt Estructurado basado en tu Referencia
    const contextBlock = `
--- CONTEXTO DEL PROYECTO (OBLIGATORIO) ---
Consulta el archivo 'AI_CONTEXT.ts' para la arquitectura base.

1. MAPA DE COMPONENTES:
   - Autenticación: ${PROJECT_CAPABILITIES.auth}
   - Base de Datos: ${PROJECT_CAPABILITIES.db}
   - UI System: ${PROJECT_CAPABILITIES.ui}

2. REGLAS DE CAPACIDAD (JSDoc Tags):
   - @ai-capability AUTH_HOOK: Usa 'hooks/useAuthLogic.ts' para cualquier lógica de login/logout/reset.
   - @ai-capability DATABASE_WRITE: SIEMPRE usa 'smartAddDoc' (services/firestore.ts) para escribir, nunca addDoc nativo.
   - @ai-capability AUTH_CORE: Usa 'services/firebase.ts' solo para primitivas de bajo nivel.

3. INSTRUCCIÓN DE TAREA:
`;

    const finalPrompt = `${contextBlock}${userInput}\n\nGenera el código cumpliendo estrictamente estas referencias arquitectónicas.`;
    setOptimizedPrompt(finalPrompt);
    setCopied(false);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(optimizedPrompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4">
      
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-xl p-8 text-white shadow-xl border border-slate-700">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-indigo-500/20 rounded-lg border border-indigo-500/50">
            <Wand2 className="text-indigo-400" size={24} />
          </div>
          <h2 className="text-2xl font-bold">Prompt Architect</h2>
        </div>
        <p className="text-slate-400 max-w-2xl">
          Convierte requerimientos simples en instrucciones técnicas precisas que Google AI Studio entiende, forzando el uso de tu arquitectura existente.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[600px]">
        
        {/* INPUT AREA */}
        <div className="flex flex-col bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
            <h3 className="font-bold text-slate-700 flex items-center gap-2">
              <Terminal size={18} className="text-slate-400" /> Tu Requerimiento
            </h3>
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Entrada Natural</span>
          </div>
          <div className="flex-1 p-4 flex flex-col">
            <textarea
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              placeholder="Ej: Crea un formulario de 'Contáctanos' que guarde el mensaje en la base de datos y requiera que el usuario esté logueado..."
              className="flex-1 w-full p-4 bg-slate-50 border border-slate-200 rounded-lg resize-none focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-sm leading-relaxed"
            />
            <div className="mt-4 flex justify-end">
              <button
                onClick={generatePrompt}
                disabled={!userInput.trim()}
                className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold shadow-lg hover:shadow-indigo-200 disabled:opacity-50 disabled:shadow-none transition-all"
              >
                <Sparkles size={18} /> Traducir a Prompt Técnico
              </button>
            </div>
          </div>
        </div>

        {/* OUTPUT AREA */}
        <div className="flex flex-col bg-slate-900 rounded-xl border border-slate-800 shadow-2xl overflow-hidden relative">
          <div className="p-4 border-b border-slate-800 bg-black/20 flex items-center justify-between">
            <h3 className="font-bold text-indigo-400 flex items-center gap-2">
              <FileText size={18} /> Prompt Optimizado
            </h3>
            {optimizedPrompt && (
              <button
                onClick={handleCopy}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                  copied 
                    ? 'bg-green-500/20 text-green-400 border border-green-500/50' 
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700'
                }`}
              >
                {copied ? <Check size={14} /> : <Copy size={14} />}
                {copied ? '¡Copiado!' : 'Copiar para AI Studio'}
              </button>
            )}
          </div>
          <div className="flex-1 p-0 relative group">
            <textarea
              readOnly
              value={optimizedPrompt}
              className="w-full h-full p-6 bg-transparent text-slate-300 font-mono text-sm resize-none outline-none leading-relaxed custom-scrollbar selection:bg-indigo-500/30"
              placeholder="El prompt generado aparecerá aquí..."
            />
            {!optimizedPrompt && (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-600 pointer-events-none">
                <ArrowRight size={48} className="mb-4 opacity-20" />
                <p className="text-sm">Esperando instrucciones...</p>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
