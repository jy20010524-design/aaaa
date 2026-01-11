import React from 'react';
import { X, ZoomIn } from 'lucide-react';

interface ImageViewerProps {
  src: string | null;
  onClose: () => void;
}

const ImageViewer: React.FC<ImageViewerProps> = ({ src, onClose }) => {
  if (!src) return null;

  return (
    <div 
      className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-sm flex items-center justify-center animate-in fade-in duration-200"
      onClick={onClose}
    >
      <button 
        onClick={onClose}
        className="absolute top-4 right-4 p-3 bg-white/10 text-white rounded-full hover:bg-white/20 transition-colors z-50"
      >
        <X className="w-6 h-6" />
      </button>

      <div className="w-full h-full p-4 flex items-center justify-center overflow-hidden">
        <img 
          src={src} 
          alt="Full screen preview" 
          className="max-w-full max-h-full object-contain shadow-2xl rounded-sm transition-transform duration-300"
          onClick={(e) => e.stopPropagation()} 
        />
      </div>
    </div>
  );
};

export default ImageViewer;