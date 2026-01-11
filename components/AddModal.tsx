import React, { useState, useRef, useEffect } from 'react';
import { X, Upload, Camera, Loader2, Edit2, Plus, Trash2, Star, Sparkles, Scale, DollarSign, Calendar, AlertTriangle, StickyNote, Box } from 'lucide-react';
import { SquishyRecord } from '../types';
import { compressImage } from '../utils/imageUtils';
import ImageEditor from './ImageEditor';

interface AddModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (record: Omit<SquishyRecord, 'id' | 'createdAt'>) => void;
  onDelete?: (id: string) => void;
  initialData?: Partial<SquishyRecord> | null;
}

const AddModal: React.FC<AddModalProps> = ({ isOpen, onClose, onSave, onDelete, initialData }) => {
  const [shopName, setShopName] = useState('');
  const [moldName, setMoldName] = useState('');
  const [squishDate, setSquishDate] = useState(new Date().toISOString().split('T')[0]);
  const [recordDate, setRecordDate] = useState(new Date().toISOString().split('T')[0]);
  
  // Optional Fields
  const [rating, setRating] = useState(0);
  const [price, setPrice] = useState('');
  const [weight, setWeight] = useState('');
  const [texture, setTexture] = useState('');
  const [notes, setNotes] = useState('');

  // Images arrays
  const [imagesBefore, setImagesBefore] = useState<string[]>([]);
  const [imagesDuring, setImagesDuring] = useState<string[]>([]);
  const [imagesAfter, setImagesAfter] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Editor State
  const [editingImage, setEditingImage] = useState<{ type: 'before' | 'during' | 'after', index: number } | null>(null);
  
  // Delete Confirmation State
  const [confirmDelete, setConfirmDelete] = useState(false);

  const fileInputBeforeRef = useRef<HTMLInputElement>(null);
  const fileInputDuringRef = useRef<HTMLInputElement>(null);
  const fileInputAfterRef = useRef<HTMLInputElement>(null);

  // Initialize or Reset form when opening/closing or changing initialData
  useEffect(() => {
    if (isOpen) {
      setConfirmDelete(false); // Reset delete state
      if (initialData) {
        setShopName(initialData.shopName || '');
        setMoldName(initialData.moldName || '');
        setSquishDate(initialData.squishDate || new Date().toISOString().split('T')[0]);
        setRecordDate(initialData.recordDate || new Date().toISOString().split('T')[0]);
        
        // Only load images if we are strictly editing (has ID), or if we explicitly passed images (rare for dupes)
        // For duplication, we typically want to clear images, but let's trust the passed props.
        setImagesBefore(initialData.imagesBefore || []);
        setImagesDuring(initialData.imagesDuring || []);
        setImagesAfter(initialData.imagesAfter || []);
        
        setRating(initialData.rating || 0);
        setPrice(initialData.price || '');
        setWeight(initialData.weight || '');
        setTexture(initialData.texture || '');
        setNotes(initialData.notes || '');
      } else {
        // Reset to defaults for new record
        setShopName('');
        setMoldName('');
        setSquishDate(new Date().toISOString().split('T')[0]);
        setRecordDate(new Date().toISOString().split('T')[0]);
        setImagesBefore([]);
        setImagesDuring([]);
        setImagesAfter([]);
        setRating(0);
        setPrice('');
        setWeight('');
        setTexture('');
        setNotes('');
      }
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'before' | 'during' | 'after') => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsProcessing(true);
    try {
      const newImages: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const compressed = await compressImage(files[i]);
        newImages.push(compressed);
      }
      
      if (type === 'before') {
        setImagesBefore([...imagesBefore, ...newImages]);
      } else if (type === 'during') {
        setImagesDuring([...imagesDuring, ...newImages]);
      } else {
        setImagesAfter([...imagesAfter, ...newImages]);
      }
    } catch (error) {
      alert('图片处理失败，请重试');
      console.error(error);
    } finally {
      setIsProcessing(false);
      if (e.target) e.target.value = '';
    }
  };

  const handleSaveEditor = (newImage: string) => {
    if (!editingImage) return;
    
    if (editingImage.type === 'before') {
      const updated = [...imagesBefore];
      updated[editingImage.index] = newImage;
      setImagesBefore(updated);
    } else if (editingImage.type === 'during') {
      const updated = [...imagesDuring];
      updated[editingImage.index] = newImage;
      setImagesDuring(updated);
    } else {
      const updated = [...imagesAfter];
      updated[editingImage.index] = newImage;
      setImagesAfter(updated);
    }
    setEditingImage(null);
  };

  const handleDeleteImage = (type: 'before' | 'during' | 'after', index: number, e: React.MouseEvent) => {
    e.stopPropagation(); // Stop bubbling so it doesn't open the editor
    
    if (type === 'before') {
       setImagesBefore(imagesBefore.filter((_, i) => i !== index));
    } else if (type === 'during') {
       setImagesDuring(imagesDuring.filter((_, i) => i !== index));
    } else {
       setImagesAfter(imagesAfter.filter((_, i) => i !== index));
    }
  };

  const handleDeleteClick = () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      // Auto reset after 3 seconds if not clicked
      setTimeout(() => setConfirmDelete(false), 3000);
    } else {
      if (initialData && initialData.id && onDelete) {
        onDelete(initialData.id);
        onClose();
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!shopName) {
      alert('请填写店铺名哦！');
      return;
    }
    if (imagesBefore.length === 0) {
      alert('请至少上传一张捏之前的照片哦！');
      return;
    }

    onSave({ 
      shopName,
      moldName,
      squishDate, 
      recordDate,
      imagesBefore, 
      imagesDuring,
      imagesAfter,
      rating,
      price,
      weight,
      texture,
      notes
    });
    
    onClose();
  };

  const ImageList = ({ type, images }: { type: 'before' | 'during' | 'after', images: string[] }) => {
    
    // Style configuration based on type
    const getStyles = () => {
      switch(type) {
        case 'before': return {
          border: 'border-pink-300',
          bg: 'bg-pink-50',
          hover: 'hover:bg-pink-100',
          icon: 'text-pink-400',
          text: 'text-pink-400'
        };
        case 'during': return {
          border: 'border-orange-300',
          bg: 'bg-orange-50',
          hover: 'hover:bg-orange-100',
          icon: 'text-orange-400',
          text: 'text-orange-400'
        };
        case 'after': return {
          border: 'border-indigo-300',
          bg: 'bg-indigo-50',
          hover: 'hover:bg-indigo-100',
          icon: 'text-indigo-400',
          text: 'text-indigo-400'
        };
      }
    };

    const styles = getStyles();
    
    // Handle File Input Ref
    const triggerUpload = () => {
      if (type === 'before') fileInputBeforeRef.current?.click();
      else if (type === 'during') fileInputDuringRef.current?.click();
      else fileInputAfterRef.current?.click();
    };

    // Get correct ref
    const getRef = () => {
      if (type === 'before') return fileInputBeforeRef;
      if (type === 'during') return fileInputDuringRef;
      return fileInputAfterRef;
    };

    return (
      <div className="flex gap-3 overflow-x-auto pb-2 snap-x hide-scrollbar">
        {images.map((img, idx) => (
          <div 
            key={idx} 
            onClick={() => setEditingImage({ type, index: idx })}
            className="relative w-24 h-24 shrink-0 rounded-xl overflow-hidden border-2 border-gray-100 shadow-sm snap-start cursor-pointer group"
          >
            <img src={img} alt={`${type} ${idx}`} className="w-full h-full object-cover" />
            <button 
              type="button"
              onClick={(e) => handleDeleteImage(type, idx, e)}
              className="absolute top-1 right-1 bg-white/90 p-1.5 rounded-full text-red-500 shadow-sm z-10 hover:bg-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="absolute inset-0 bg-black/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
               <Edit2 className="w-5 h-5 text-white drop-shadow-md" />
            </div>
          </div>
        ))}
        <button 
          type="button"
          onClick={triggerUpload}
          className={`w-24 h-24 shrink-0 rounded-xl border-2 border-dashed flex flex-col items-center justify-center transition-colors ${styles.border} ${styles.bg} ${styles.hover}`}
        >
          <Plus className={`w-8 h-8 ${styles.icon}`} />
          <span className={`text-[10px] font-bold mt-1 ${styles.text}`}>添加图片</span>
        </button>
        <input
          ref={getRef()}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => handleImageUpload(e, type)}
        />
      </div>
    );
  };

  return (
    <>
      {editingImage && (
        <ImageEditor 
          imageSrc={
            editingImage.type === 'before' 
              ? imagesBefore[editingImage.index] 
              : editingImage.type === 'during'
                ? imagesDuring[editingImage.index]
                : imagesAfter[editingImage.index]
          }
          onSave={handleSaveEditor}
          onCancel={() => setEditingImage(null)}
        />
      )}
      
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center pointer-events-none">
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm pointer-events-auto" onClick={onClose} />
        
        <div className="bg-white w-full max-w-md rounded-t-[2rem] sm:rounded-[2rem] p-6 shadow-2xl transform transition-transform duration-300 pointer-events-auto flex flex-col max-h-[90vh]">
          
          <div className="flex justify-between items-center mb-4 shrink-0">
            <h2 className="text-2xl font-bold text-gray-800">
              {initialData && initialData.id ? '编辑记录 ✏️' : '记录新捏捏 ✨'}
            </h2>
            <button onClick={onClose} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200">
              <X className="w-6 h-6 text-gray-500" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto hide-scrollbar space-y-5 pb-2">
            
            {/* Essential Info */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1 ml-1">店铺名称 *</label>
                <input
                  type="text"
                  value={shopName}
                  onChange={(e) => setShopName(e.target.value)}
                  placeholder=""
                  className="w-full bg-pink-50 border-2 border-pink-100 rounded-2xl px-4 py-3 text-lg focus:outline-none focus:border-pink-300 transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1 ml-1 flex items-center gap-1">
                  <Box className="w-3.5 h-3.5" /> 模具名称 <span className="text-[10px] font-normal text-gray-400">(选填)</span>
                </label>
                <input
                  type="text"
                  value={moldName}
                  onChange={(e) => setMoldName(e.target.value)}
                  placeholder=""
                  className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-base focus:outline-none focus:border-pink-300 transition-colors"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                 <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1 ml-1 flex items-center">
                       <Calendar className="w-3 h-3 mr-1" /> 开捏日期
                    </label>
                    <input
                      type="date"
                      value={squishDate}
                      onChange={(e) => setSquishDate(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-pink-300"
                    />
                 </div>
                 <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1 ml-1 flex items-center">
                       <Calendar className="w-3 h-3 mr-1" /> 记录日期
                    </label>
                    <input
                      type="date"
                      value={recordDate}
                      onChange={(e) => setRecordDate(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-pink-300"
                    />
                 </div>
              </div>
            </div>

            {/* Optional Details */}
            <div className="bg-gray-50 rounded-2xl p-4 space-y-4 border border-gray-100">
               <div className="flex justify-between items-center">
                  <span className="text-sm font-bold text-gray-600">喜爱程度</span>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        className="p-1 hover:scale-110 transition-transform"
                      >
                         <Star className={`w-6 h-6 ${star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} />
                      </button>
                    ))}
                  </div>
               </div>

               <div className="grid grid-cols-3 gap-2">
                  <div className="relative">
                    <div className="absolute left-2 top-2 text-gray-400">
                       <DollarSign className="w-4 h-4" />
                    </div>
                    <input 
                      type="text" 
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      placeholder="价格"
                      className="w-full pl-7 pr-2 py-2 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-pink-300"
                    />
                  </div>
                  <div className="relative">
                    <div className="absolute left-2 top-2 text-gray-400">
                       <Scale className="w-4 h-4" />
                    </div>
                    <input 
                      type="text" 
                      value={weight}
                      onChange={(e) => setWeight(e.target.value)}
                      placeholder="克重"
                      className="w-full pl-7 pr-2 py-2 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-pink-300"
                    />
                  </div>
                   <div className="relative">
                    <div className="absolute left-2 top-2 text-gray-400">
                       <Sparkles className="w-4 h-4" />
                    </div>
                    <input 
                      type="text" 
                      value={texture}
                      onChange={(e) => setTexture(e.target.value)}
                      placeholder="手感"
                      className="w-full pl-7 pr-2 py-2 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-pink-300"
                    />
                  </div>
               </div>
               
               {/* Notes Field */}
               <div>
                 <label className="block text-xs font-medium text-gray-500 mb-1 ml-1 flex items-center">
                   <StickyNote className="w-3 h-3 mr-1" /> 备注 (选填)
                 </label>
                 <textarea
                   value={notes}
                   onChange={(e) => setNotes(e.target.value)}
                   placeholder="写点什么..."
                   className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-pink-300 min-h-[80px]"
                 />
               </div>
            </div>

            {/* Images */}
            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-end mb-2 px-1">
                   <label className="text-sm font-bold text-pink-600">捏之前 (Original)</label>
                   <span className="text-[10px] text-gray-400">{imagesBefore.length} 张</span>
                </div>
                <ImageList type="before" images={imagesBefore} />
              </div>

              <div>
                <div className="flex justify-between items-end mb-2 px-1">
                   <label className="text-sm font-bold text-orange-500">捏捏中 (During) <span className="text-[10px] font-normal text-gray-400 ml-1">(选填)</span></label>
                   <span className="text-[10px] text-gray-400">{imagesDuring.length} 张</span>
                </div>
                <ImageList type="during" images={imagesDuring} />
              </div>

              <div>
                <div className="flex justify-between items-end mb-2 px-1">
                   <label className="text-sm font-bold text-indigo-600">捏之后 (Squished) <span className="text-[10px] font-normal text-gray-400 ml-1">(选填)</span></label>
                   <span className="text-[10px] text-gray-400">{imagesAfter.length} 张</span>
                </div>
                <ImageList type="after" images={imagesAfter} />
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <button
                type="submit"
                disabled={isProcessing}
                className="w-full bg-gradient-to-r from-pink-400 to-rose-400 text-white font-bold text-xl py-3.5 rounded-2xl shadow-lg shadow-pink-200 active:scale-95 transition-all flex items-center justify-center shrink-0"
              >
                {isProcessing ? <Loader2 className="animate-spin mr-2" /> : (initialData && initialData.id ? '更新记录' : '保存记录')}
              </button>

              {initialData && initialData.id && onDelete && (
                 <button
                   type="button"
                   onClick={handleDeleteClick}
                   className={`w-full py-3 font-bold text-sm flex items-center justify-center gap-2 rounded-xl transition-all duration-300 ${
                     confirmDelete 
                       ? 'bg-red-500 text-white shadow-md' 
                       : 'bg-transparent text-red-400 hover:bg-red-50'
                   }`}
                 >
                   {confirmDelete ? (
                     <>
                       <AlertTriangle className="w-4 h-4" /> 确定要删除吗？点击确认
                     </>
                   ) : (
                     <>
                       <Trash2 className="w-4 h-4" /> 删除此记录
                     </>
                   )}
                 </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default AddModal;