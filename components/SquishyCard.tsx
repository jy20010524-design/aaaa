import React, { useState, useEffect } from 'react';
import { SquishyRecord } from '../types';
import { Trash2, Calendar, Store, Sparkles, Scale, DollarSign, Star, Edit3, Box, AlertCircle, Check, Copy } from 'lucide-react';

interface SquishyCardProps {
  record: SquishyRecord;
  onDelete: (id: string) => void;
  onEdit: (record: SquishyRecord) => void;
  onDuplicate: (record: SquishyRecord) => void;
  onViewImage: (src: string) => void;
}

const SquishyCard: React.FC<SquishyCardProps> = ({ record, onDelete, onEdit, onDuplicate, onViewImage }) => {
  const [isDeleting, setIsDeleting] = useState(false);

  // Auto-reset delete state after 3 seconds if not confirmed
  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;
    if (isDeleting) {
      timeout = setTimeout(() => setIsDeleting(false), 3000);
    }
    return () => clearTimeout(timeout);
  }, [isDeleting]);

  const renderStars = (rating: number) => {
    return (
      <div className="flex">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star 
            key={star} 
            className={`w-3 h-3 ${star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} 
          />
        ))}
      </div>
    );
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isDeleting) {
      onDelete(record.id);
      setIsDeleting(false);
    } else {
      setIsDeleting(true);
    }
  };

  return (
    <div 
      onClick={() => onEdit(record)}
      className="bg-white rounded-3xl shadow-lg overflow-hidden mb-6 border border-pink-100 duration-200 active:scale-[0.99] transition-transform cursor-pointer"
    >
      
      {/* Header Info */}
      <div className="p-4 bg-pink-50/50">
        <div className="flex justify-between items-start mb-2">
          <div>
            <div className="flex items-center text-pink-800 font-bold text-lg mb-1">
              <Store className="w-5 h-5 mr-2 text-pink-500" />
              {record.shopName}
            </div>
            {record.moldName && (
               <div className="text-sm text-gray-600 mb-2 flex items-center">
                 <span className="text-[10px] bg-pink-100/50 border border-pink-200 text-pink-500 px-1.5 py-0.5 rounded mr-1.5 font-medium flex items-center">
                    <Box className="w-3 h-3 mr-0.5" /> 模具
                 </span>
                 {record.moldName}
               </div>
            )}
            <div className="flex flex-col text-xs text-gray-500 space-y-0.5">
               <div className="flex items-center">
                 <span className="opacity-70 mr-2">开捏:</span> {record.squishDate}
               </div>
               <div className="flex items-center">
                 <span className="opacity-70 mr-2">记录:</span> {record.recordDate}
               </div>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {/* Duplicate Button */}
            <button 
              onClick={(e) => {
                e.stopPropagation();
                onDuplicate(record);
              }}
              className="p-3 text-gray-400 hover:text-blue-500 bg-white/50 hover:bg-white rounded-full transition-all active:scale-90"
              title="复制 (仿制)"
            >
              <Copy className="w-5 h-5" />
            </button>
            
            {/* Delete Button with Inline Confirmation */}
            <button 
              onClick={handleDeleteClick}
              className={`p-3 rounded-full transition-all active:scale-90 flex items-center gap-1 ${
                isDeleting 
                  ? 'bg-red-500 text-white w-auto px-4' 
                  : 'text-gray-400 hover:text-red-500 bg-white/50 hover:bg-white'
              }`}
              title="删除"
            >
              {isDeleting ? (
                <>
                  <span className="text-xs font-bold whitespace-nowrap">确认?</span>
                  <Check className="w-4 h-4" />
                </>
              ) : (
                <Trash2 className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>

        {/* Optional Details Tags */}
        <div className="flex flex-wrap gap-2 mt-2">
          {record.rating !== undefined && record.rating > 0 && (
             <div className="bg-white border border-yellow-100 px-2 py-1 rounded-lg flex items-center shadow-sm">
                {renderStars(record.rating)}
             </div>
          )}
          {record.price && (
            <div className="bg-white border border-green-100 px-2 py-1 rounded-lg flex items-center text-xs text-green-700 shadow-sm">
              <DollarSign className="w-3 h-3 mr-1" />
              {record.price}
            </div>
          )}
          {record.weight && (
            <div className="bg-white border border-blue-100 px-2 py-1 rounded-lg flex items-center text-xs text-blue-700 shadow-sm">
              <Scale className="w-3 h-3 mr-1" />
              {record.weight}
            </div>
          )}
           {record.texture && (
            <div className="bg-white border border-purple-100 px-2 py-1 rounded-lg flex items-center text-xs text-purple-700 shadow-sm">
              <Sparkles className="w-3 h-3 mr-1" />
              {record.texture}
            </div>
          )}
        </div>

        {/* Notes Section */}
        {record.notes && (
          <div className="mt-3 text-sm text-gray-600 bg-white/60 p-3 rounded-xl border border-pink-100/50 whitespace-pre-wrap">
            <span className="font-bold text-pink-400 text-xs mr-1">📝 备注:</span>
            {record.notes}
          </div>
        )}
      </div>

      {/* Image Comparison Grid - Scrollable if multiple */}
      <div className="grid grid-cols-2 gap-0.5 bg-pink-100 h-48">
        
        {/* Before Side */}
        <div className="relative h-full bg-gray-50 overflow-x-auto snap-x snap-mandatory flex hide-scrollbar">
           {record.imagesBefore.length > 0 ? (
             record.imagesBefore.map((img, idx) => (
                <div 
                  key={idx} 
                  className="min-w-full h-full snap-center relative"
                  onClick={(e) => {
                    e.stopPropagation();
                    onViewImage(img);
                  }}
                >
                  <img src={img} alt={`Before ${idx}`} className="w-full h-full object-cover" />
                  {record.imagesBefore.length > 1 && (
                    <div className="absolute top-2 right-2 bg-black/40 text-white text-[9px] px-1.5 rounded-full backdrop-blur-sm pointer-events-none">
                      {idx + 1}/{record.imagesBefore.length}
                    </div>
                  )}
                </div>
             ))
           ) : (
            <div className="min-w-full h-full flex items-center justify-center text-gray-300 text-xs">无图</div>
           )}
           <span className="absolute bottom-2 left-2 bg-pink-500/80 text-white text-[10px] px-2 py-0.5 rounded-full backdrop-blur-sm z-10 pointer-events-none">
            捏之前
          </span>
        </div>

        {/* After Side */}
        <div className="relative h-full bg-gray-50 overflow-x-auto snap-x snap-mandatory flex hide-scrollbar">
           {record.imagesAfter.length > 0 ? (
             record.imagesAfter.map((img, idx) => (
                <div 
                  key={idx} 
                  className="min-w-full h-full snap-center relative"
                  onClick={(e) => {
                    e.stopPropagation();
                    onViewImage(img);
                  }}
                >
                  <img src={img} alt={`After ${idx}`} className="w-full h-full object-cover" />
                  {record.imagesAfter.length > 1 && (
                    <div className="absolute top-2 right-2 bg-black/40 text-white text-[9px] px-1.5 rounded-full backdrop-blur-sm pointer-events-none">
                      {idx + 1}/{record.imagesAfter.length}
                    </div>
                  )}
                </div>
             ))
           ) : (
            <div className="min-w-full h-full flex items-center justify-center text-gray-300 text-xs">无图</div>
           )}
           <span className="absolute bottom-2 left-2 bg-indigo-500/80 text-white text-[10px] px-2 py-0.5 rounded-full backdrop-blur-sm z-10 pointer-events-none">
            捏之后
          </span>
        </div>

      </div>
    </div>
  );
};

export default SquishyCard;