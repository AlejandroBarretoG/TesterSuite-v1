
import React, { useState, useEffect, useCallback } from 'react';
import { UploadCloud, File, Trash2, Link as LinkIcon, Image as ImageIcon, Loader2, Check, RefreshCw } from 'lucide-react';
import { useFirebase } from '../context/FirebaseContext';
import { uploadFile, listFiles, deleteFile, FileData } from '../services/storage';

export const StorageLab: React.FC = () => {
  const { app } = useFirebase();
  const [files, setFiles] = useState<FileData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    if (app) loadFiles();
  }, [app]);

  const loadFiles = async () => {
    if (!app) return;
    setIsLoading(true);
    const result = await listFiles(app);
    if (result.success && result.files) {
      setFiles(result.files);
    }
    setIsLoading(false);
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (!app) return;

    const droppedFiles = Array.from(e.dataTransfer.files);
    if (droppedFiles.length === 0) return;

    // Upload first file only for simplicity in this lab
    const file = droppedFiles[0];
    await processUpload(file);
  }, [app]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0] && app) {
      await processUpload(e.target.files[0]);
    }
  };

  const processUpload = async (file: File) => {
    if (!app) return;
    setUploadProgress(1); // Start
    const result = await uploadFile(app, file, (progress) => {
      setUploadProgress(progress);
    });

    if (result.success) {
      setUploadProgress(0);
      loadFiles();
    } else {
      setUploadProgress(0);
      alert("Error uploading: " + result.error);
    }
  };

  const handleDelete = async (fullPath: string) => {
    if (!app || !confirm("¿Eliminar archivo permanentemente?")) return;
    const result = await deleteFile(app, fullPath);
    if (result.success) {
      setFiles(prev => prev.filter(f => f.fullPath !== fullPath));
    } else {
      alert("Error: " + result.error);
    }
  };

  const handleCopyUrl = (url: string, id: string) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const formatSize = (bytes?: number) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  if (!app) return <div className="p-8 text-center text-slate-400">Conecta Firebase primero.</div>;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
      {/* HEADER */}
      <div className="bg-gradient-to-r from-blue-600 to-cyan-600 p-6 rounded-xl text-white shadow-lg">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <UploadCloud size={28} /> Storage Lab
        </h2>
        <p className="text-blue-100 opacity-90">Gestor de archivos Drag & Drop. Los archivos se guardan en <code>/public_assets/</code></p>
      </div>

      {/* DROP ZONE */}
      <div 
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300 ${
          isDragging 
            ? 'border-blue-500 bg-blue-50 scale-[1.01]' 
            : 'border-slate-300 bg-white hover:border-slate-400'
        }`}
      >
        <input 
          type="file" 
          onChange={handleFileSelect}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
        
        {uploadProgress > 0 ? (
          <div className="max-w-xs mx-auto">
             <Loader2 className="animate-spin mx-auto text-blue-500 mb-2" size={32} />
             <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
               <div className="h-full bg-blue-500 transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
             </div>
             <p className="text-sm text-slate-500 mt-2">Subiendo... {Math.round(uploadProgress)}%</p>
          </div>
        ) : (
          <div className="pointer-events-none">
            <UploadCloud size={48} className={`mx-auto mb-4 ${isDragging ? 'text-blue-500' : 'text-slate-300'}`} />
            <p className="text-lg font-medium text-slate-700">Arrastra archivos aquí</p>
            <p className="text-sm text-slate-500">o haz clic para explorar</p>
          </div>
        )}
      </div>

      {/* FILE LIST */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <h3 className="font-bold text-slate-700 flex items-center gap-2">
            <File size={16} /> Archivos ({files.length})
          </h3>
          <button onClick={loadFiles} disabled={isLoading} className="p-2 hover:bg-white rounded-full text-slate-500 transition-colors">
            <RefreshCw size={16} className={isLoading ? "animate-spin" : ""} />
          </button>
        </div>
        
        {files.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-sm">Carpeta vacía</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
             {files.map((file) => (
               <div key={file.fullPath} className="group relative bg-white border border-slate-200 rounded-lg p-3 hover:shadow-md transition-shadow flex items-start gap-3">
                 <div className="w-12 h-12 rounded bg-slate-100 flex items-center justify-center shrink-0 overflow-hidden border border-slate-100">
                    {file.contentType?.startsWith('image/') ? (
                      <img src={file.url} alt={file.name} className="w-full h-full object-cover" />
                    ) : (
                      <File className="text-slate-400" size={24} />
                    )}
                 </div>
                 <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-slate-800 text-sm truncate" title={file.name}>{file.name}</h4>
                    <p className="text-xs text-slate-500">{formatSize(file.size)}</p>
                 </div>
                 
                 <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => handleCopyUrl(file.url, file.fullPath)}
                      className={`p-1.5 rounded hover:bg-slate-100 ${copiedId === file.fullPath ? 'text-green-500' : 'text-slate-400'}`}
                      title="Copiar URL"
                    >
                      {copiedId === file.fullPath ? <Check size={14} /> : <LinkIcon size={14} />}
                    </button>
                    <button 
                      onClick={() => handleDelete(file.fullPath)}
                      className="p-1.5 rounded hover:bg-red-50 text-slate-400 hover:text-red-500"
                      title="Eliminar"
                    >
                      <Trash2 size={14} />
                    </button>
                 </div>
               </div>
             ))}
          </div>
        )}
      </div>
    </div>
  );
};
