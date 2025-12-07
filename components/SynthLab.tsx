
import React, { useState, useEffect, useRef } from 'react';
import * as Tone from 'tone';
import { Music, Play, Square, Loader2, Volume2, Sliders, Activity, RefreshCw } from 'lucide-react';
import { composeMusic } from '../services/gemini';

// Mapeo de instrumentos de Tone.js
const INSTRUMENTS: Record<string, any> = {
  'Classic Synth': Tone.Synth,
  'FM Synth (Retro)': Tone.FMSynth,
  'AM Synth (Suave)': Tone.AMSynth,
  'Membrane (Percusivo)': Tone.MembraneSynth,
  'DuoSynth (Grueso)': Tone.DuoSynth,
};

// Colores para las notas basados en su altura (Octava)
const NOTE_COLORS: Record<string, string> = {
  'C': 'bg-red-500', 'D': 'bg-orange-500', 'E': 'bg-yellow-500', 
  'F': 'bg-green-500', 'G': 'bg-teal-500', 'A': 'bg-blue-500', 'B': 'bg-purple-500'
};

export const SynthLab = () => {
  // Estados de IA y Datos
  const [style, setStyle] = useState("Videojuego retro 8-bits alegre");
  const [duration, setDuration] = useState<'short'|'medium'|'long'>('medium');
  const [composition, setComposition] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // Estados de Audio/Control
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedInst, setSelectedInst] = useState('Classic Synth');
  const [volume, setVolume] = useState(-10); // dB
  const [bpm, setBpm] = useState(120);
  
  // Referencia para cancelar reproducción
  const transportRef = useRef<any>(null);

  const apiKey = localStorage.getItem('gemini_api_key') || "";

  // Efecto para actualizar volumen/tempo en tiempo real
  useEffect(() => {
    try {
      Tone.Destination.volume.rampTo(volume, 0.1);
      Tone.Transport.bpm.rampTo(bpm, 0.1);
    } catch(e) {
      console.warn("Tone.js update failed:", e);
    }
  }, [volume, bpm]);

  const handleCompose = async () => {
    if (!apiKey) return alert("Falta API Key");
    setLoading(true);
    setComposition(null); // Limpiar anterior
    
    const result = await composeMusic(apiKey, style, duration);
    
    if (result.success) {
      setComposition(result.data);
      if (result.data.tempo) setBpm(result.data.tempo);
    } else {
      alert("Error: " + result.message);
    }
    setLoading(false);
  };

  const handlePlay = async () => {
    if (!composition) return;
    
    try {
      await Tone.start();
      setIsPlaying(true);
      
      // Limpiar transporte previo
      Tone.Transport.cancel();
      
      // Crear instrumento seleccionado
      const SynthClass = INSTRUMENTS[selectedInst];
      // Note: Wrapping instantiation in try-catch to catch "Illegal constructor" if Tone.js is in bad state
      const synth = new Tone.PolySynth(SynthClass).toDestination();
      synth.volume.value = volume;

      // Crear la Partitura (Tone.Part)
      // Mapeamos las notas para que Tone las entienda: [time, { note, duration, velocity }]
      const toneEvents = composition.notes.map((n: any, i: number) => {
        // Si la IA no devuelve time, lo calculamos (fallback básico)
        const calculatedTime = n.time !== undefined ? n.time : i * 0.5;
        return { 
          time: calculatedTime,
          note: n.note, 
          duration: n.duration 
        };
      });

      const part = new Tone.Part((time, value) => {
        synth.triggerAttackRelease(value.note, value.duration, time);
      }, toneEvents);

      part.start(0);
      Tone.Transport.start();

      // Detener automáticamente al final (estimado)
      // Buscamos el último evento y sumamos un margen
      const lastEvent = toneEvents[toneEvents.length - 1];
      const endTime = (lastEvent ? lastEvent.time + 2 : toneEvents.length) * (60/bpm) * 1000 + 2000;
      
      setTimeout(() => {
        // Verificamos si sigue siendo la misma reproducción
        if(Tone.Transport.state === 'started') handleStop();
      }, endTime);

    } catch (e: any) {
      console.error("Tone.js Play Error:", e);
      alert("Error al reproducir audio. " + e.message);
      setIsPlaying(false);
    }
  };

  const handleStop = () => {
    try {
      Tone.Transport.stop();
      Tone.Transport.cancel();
    } catch(e) { console.warn(e); }
    setIsPlaying(false);
  };

  // --- Renderizado del Piano Roll (Gráfico Visual) ---
  const renderPianoRoll = () => {
    if (!composition) return null;
    return (
      <div className="flex items-end gap-1 h-40 w-full overflow-x-auto p-4 bg-slate-900 rounded-lg border border-slate-700 custom-scrollbar">
        {composition.notes.map((note: any, idx: number) => {
          // Calcular altura de la barra basada en la nota (C4, A5, etc)
          const pitch = note.note.charAt(0); // C, D, E...
          const octave = parseInt(note.note.slice(-1)) || 4;
          // Altura relativa (hack simple visual)
          const heightPercent = Math.min(100, Math.max(20, (octave * 10) + (pitch.charCodeAt(0) - 60) * 2));
          const colorClass = NOTE_COLORS[pitch] || 'bg-slate-500';

          return (
            <div key={idx} className="flex flex-col justify-end items-center group relative min-w-[20px] flex-1">
              {/* Barra de Nota */}
              <div 
                className={`w-full rounded-t-md transition-all duration-300 opacity-80 hover:opacity-100 ${colorClass} ${isPlaying ? 'animate-pulse' : ''}`}
                style={{ height: `${heightPercent}%` }}
              >
                <span className="absolute bottom-1 left-1/2 -translate-x-1/2 text-[10px] font-bold text-white/50 group-hover:text-white">
                  {note.note}
                </span>
              </div>
              {/* Duración visual (Barra inferior) */}
              <div className="h-1 w-full mt-1 bg-white/20 rounded-full">
                <div 
                  className="h-full bg-white/60 rounded-full" 
                  style={{ width: note.duration.includes('8') ? '50%' : note.duration.includes('16') ? '25%' : '100%' }} 
                />
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xl overflow-hidden animate-in fade-in duration-500">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-6 text-white">
        <div className="flex justify-between items-center">
          <h3 className="text-2xl font-bold flex items-center gap-3">
            <Activity className="animate-pulse" /> SynthLab Pro
          </h3>
          <span className="px-3 py-1 bg-white/20 rounded-full text-xs font-mono">
            v2.0 Visual Core
          </span>
        </div>
        <p className="text-purple-100 mt-2 opacity-90">
          Estudio de composición generativa con visualización de espectro y control en tiempo real.
        </p>
      </div>

      <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* PANEL IZQUIERDO: Controles de IA */}
        <div className="lg:col-span-1 space-y-6 border-r border-slate-100 pr-0 lg:pr-6">
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2 mb-2">
              <RefreshCw size={14} /> Prompt Musical
            </label>
            <textarea 
              value={style}
              onChange={(e) => setStyle(e.target.value)}
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 outline-none h-24 resize-none"
              placeholder="Ej: Cyberpunk oscuro, bajos pesados..."
            />
          </div>

          <div>
             <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Duración</label>
             <div className="flex bg-slate-100 p-1 rounded-lg">
               {['short', 'medium', 'long'].map((d) => (
                 <button
                   key={d}
                   onClick={() => setDuration(d as any)}
                   className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${
                     duration === d ? 'bg-white text-purple-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                   }`}
                 >
                   {d === 'short' ? 'Corta' : d === 'medium' ? 'Media' : 'Larga'}
                 </button>
               ))}
             </div>
          </div>

          <button 
            onClick={handleCompose}
            disabled={loading}
            className="w-full py-3 bg-slate-900 text-white rounded-lg font-bold shadow-lg hover:shadow-xl hover:bg-black transition-all flex justify-center items-center gap-2 disabled:opacity-70"
          >
            {loading ? <Loader2 className="animate-spin" /> : <Music size={18} />}
            {loading ? "Componiendo..." : "Generar Partitura"}
          </button>
        </div>

        {/* PANEL DERECHO: Visualizador y Mezcladora */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          
          {/* Visualizador (Piano Roll) */}
          <div className="relative group">
            <div className="absolute top-2 right-2 z-10 bg-black/50 text-white text-[10px] px-2 py-1 rounded backdrop-blur-sm">
              {composition ? `${composition.notes.length} Notas` : "Esperando data..."}
            </div>
            {composition ? renderPianoRoll() : (
              <div className="h-40 bg-slate-100 rounded-lg border border-slate-200 border-dashed flex flex-col items-center justify-center text-slate-400">
                <Music size={40} className="mb-2 opacity-20" />
                <span className="text-sm">Genera una melodía para ver el Piano Roll</span>
              </div>
            )}
          </div>

          {/* Controls Deck (Mezcladora) */}
          <div className="bg-slate-50 rounded-xl p-5 border border-slate-200">
            <div className="flex flex-wrap gap-6 items-end">
              
              {/* Playback Controls */}
              <div className="flex gap-2">
                <button 
                  onClick={isPlaying ? handleStop : handlePlay}
                  disabled={!composition}
                  className={`w-14 h-14 rounded-full flex items-center justify-center transition-all shadow-md ${
                     isPlaying 
                      ? 'bg-red-500 text-white hover:bg-red-600' 
                      : 'bg-green-500 text-white hover:bg-green-600 disabled:bg-slate-300'
                  }`}
                >
                  {isPlaying ? <Square fill="currentColor" /> : <Play fill="currentColor" className="ml-1" />}
                </button>
              </div>

              {/* Instrument Selector */}
              <div className="flex-1 min-w-[150px]">
                <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Sintetizador</label>
                <select 
                  value={selectedInst}
                  onChange={(e) => setSelectedInst(e.target.value)}
                  className="w-full p-2 bg-white border border-slate-200 rounded-lg text-sm font-medium outline-none focus:border-purple-500"
                >
                  {Object.keys(INSTRUMENTS).map(inst => (
                    <option key={inst} value={inst}>{inst}</option>
                  ))}
                </select>
              </div>

              {/* Sliders (Volumen & BPM) */}
              <div className="flex gap-4 flex-1 min-w-[200px]">
                <div className="flex-1">
                   <div className="flex justify-between text-[10px] font-bold text-slate-400 mb-1">
                     <span className="flex items-center gap-1"><Volume2 size={10}/> VOL</span>
                     <span>{Math.round((volume + 60) / 0.6)}%</span>
                   </div>
                   <input 
                    type="range" min="-60" max="0" step="1"
                    value={volume}
                    onChange={(e) => setVolume(Number(e.target.value))}
                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
                   />
                </div>
                <div className="flex-1">
                   <div className="flex justify-between text-[10px] font-bold text-slate-400 mb-1">
                     <span className="flex items-center gap-1"><Sliders size={10}/> BPM</span>
                     <span>{Math.floor(bpm)}</span>
                   </div>
                   <input 
                    type="range" min="60" max="200" step="5"
                    value={bpm}
                    onChange={(e) => setBpm(Number(e.target.value))}
                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                   />
                </div>
              </div>

            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
