import React, { useState, useRef, useEffect } from 'react';
import { Check, X, Type, Wand2 } from 'lucide-react';

interface ImageEditorProps {
  imageSrc: string;
  onSave: (newImage: string) => void;
  onCancel: () => void;
}

const FILTERS = [
  { name: '原图', value: 'none' },
  { name: '复古', value: 'sepia(0.6) contrast(1.1)' },
  { name: '黑白', value: 'grayscale(1)' },
  { name: '鲜艳', value: 'saturate(1.8) contrast(1.1)' },
];

const ImageEditor: React.FC<ImageEditorProps> = ({ imageSrc, onSave, onCancel }) => {
  const [activeFilter, setActiveFilter] = useState(FILTERS[0]);
  const [text, setText] = useState('');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [previewUrl, setPreviewUrl] = useState(imageSrc);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = imageSrc;
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;

      // Apply Filter
      ctx.filter = activeFilter.value;
      ctx.drawImage(img, 0, 0);
      ctx.filter = 'none';

      // Apply Text
      if (text) {
        const fontSize = Math.max(20, img.width / 15);
        ctx.font = `bold ${fontSize}px sans-serif`;
        ctx.fillStyle = 'white';
        ctx.strokeStyle = 'black';
        ctx.lineWidth = fontSize / 8;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        
        const x = canvas.width / 2;
        const y = canvas.height - (fontSize * 0.5);
        
        ctx.lineJoin = 'round';
        ctx.strokeText(text, x, y);
        ctx.fillText(text, x, y);
      }
      
      setPreviewUrl(canvas.toDataURL('image/jpeg', 0.8));
    };
  }, [imageSrc, activeFilter, text]);

  return (
    <div className="fixed inset-0 z-[60] bg-black/90 flex flex-col items-center justify-center sm:p-4">
      <div className="w-full h-full sm:h-auto sm:max-h-[90vh] sm:max-w-md bg-white sm:rounded-2xl overflow-hidden flex flex-col">
        {/* Preview Area */}
        <div className="relative bg-gray-900 flex-1 flex items-center justify-center overflow-hidden">
          <img src={previewUrl} alt="Preview" className="max-h-full max-w-full object-contain" />
          <canvas ref={canvasRef} className="hidden" />
        </div>

        {/* Controls */}
        <div className="p-4 bg-white space-y-4 shrink-0">
          <div>
            <label className="text-xs font-bold text-gray-500 mb-2 flex items-center gap-1">
              <Wand2 className="w-3 h-3" /> 滤镜
            </label>
            <div className="flex gap-2 overflow-x-auto pb-2 hide-scrollbar">
              {FILTERS.map(f => (
                <button
                  key={f.name}
                  onClick={() => setActiveFilter(f)}
                  className={`px-3 py-1 rounded-full text-sm whitespace-nowrap transition-colors border ${
                    activeFilter.name === f.name 
                    ? 'bg-pink-500 text-white border-pink-500' 
                    : 'bg-gray-100 text-gray-600 border-gray-200'
                  }`}
                >
                  {f.name}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-gray-500 mb-2 flex items-center gap-1">
              <Type className="w-3 h-3" /> 文字贴纸
            </label>
            <input 
              type="text" 
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="输入文字..."
              className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-pink-300"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button 
              onClick={onCancel}
              className="flex-1 py-3 rounded-xl bg-gray-100 text-gray-600 font-bold flex items-center justify-center gap-2"
            >
              <X className="w-4 h-4" /> 取消
            </button>
            <button 
              onClick={() => onSave(previewUrl)}
              className="flex-1 py-3 rounded-xl bg-pink-500 text-white font-bold flex items-center justify-center gap-2"
            >
              <Check className="w-4 h-4" /> 完成
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImageEditor;