import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Archive, Heart, Search, Filter, X, BarChart3, LayoutList, Layers } from 'lucide-react';
import { SquishyRecord } from './types';
import SquishyCard from './components/SquishyCard';
import AddModal from './components/AddModal';
import StatsModal from './components/StatsModal';
import ImageViewer from './components/ImageViewer';

const STORAGE_KEY = 'squishy_log_data';

// Safe ID generator that works on all devices/browsers
const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

const App: React.FC = () => {
  const [records, setRecords] = useState<SquishyRecord[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isStatsOpen, setIsStatsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // Edit & Data State
  const [editingRecord, setEditingRecord] = useState<SquishyRecord | null>(null);
  const [prefillData, setPrefillData] = useState<Partial<SquishyRecord> | null>(null);

  // Viewer State
  const [viewingImage, setViewingImage] = useState<string | null>(null);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [groupByShop, setGroupByShop] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Data Migration & Repair: 
        // 1. Convert old formats
        // 2. Fix missing IDs (Critical for deletion)
        const migrated = parsed.map((item: any) => ({
          ...item,
          id: item.id || generateId(), // Auto-repair missing IDs
          shopName: item.shopName || '',
          moldName: item.moldName || '', // Ensure moldName field exists
          squishDate: item.squishDate || item.date || new Date().toISOString().split('T')[0],
          recordDate: item.recordDate || item.date || new Date().toISOString().split('T')[0],
          imagesBefore: Array.isArray(item.imagesBefore) ? item.imagesBefore : (item.imageBefore ? [item.imageBefore] : []),
          imagesDuring: Array.isArray(item.imagesDuring) ? item.imagesDuring : [], // New field migration
          imagesAfter: Array.isArray(item.imagesAfter) ? item.imagesAfter : (item.imageAfter ? [item.imageAfter] : []),
          notes: item.notes || '', // Ensure notes field exists
        }));
        setRecords(migrated);
      } catch (e) {
        console.error("Failed to parse local storage data", e);
      }
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (!isLoading) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
      } catch (e) {
        alert('存储空间已满！请删除一些旧记录或导出备份。');
      }
    }
  }, [records, isLoading]);

  const handleSaveRecord = (recordData: Omit<SquishyRecord, 'id' | 'createdAt'>) => {
    if (editingRecord) {
      // Update existing record
      setRecords(records.map(r => 
        r.id === editingRecord.id 
          ? { ...r, ...recordData } 
          : r
      ));
    } else {
      // Create new record
      const record: SquishyRecord = {
        ...recordData,
        id: generateId(), // Use safe ID generator
        createdAt: Date.now(),
      };
      setRecords([record, ...records]);
    }
    // Close handled by Modal onClose, but we clean up state here
  };

  const handleDeleteRecord = (id: string) => {
    if (!id) return;
    setRecords(prev => prev.filter(r => r.id !== id));
  };
  
  const handleEditRecord = (record: SquishyRecord) => {
    setEditingRecord(record);
    setPrefillData(null);
    setIsModalOpen(true);
  };

  const handleDuplicateRecord = (record: SquishyRecord) => {
    // Create prefill data without ID and images
    const { id, imagesBefore, imagesDuring, imagesAfter, createdAt, ...rest } = record;
    setEditingRecord(null); // Ensure we are in "Create" mode
    setPrefillData({
      ...rest,
      // Clear images because a new squishy usually has different photos
      imagesBefore: [],
      imagesDuring: [],
      imagesAfter: []
    });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    // Delay clearing state for smooth animation
    setTimeout(() => {
      setEditingRecord(null);
      setPrefillData(null);
    }, 300);
  };

  const handleExport = () => {
    const dataStr = JSON.stringify(records, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `squishy_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Filter Logic
  const filteredRecords = records.filter(record => {
    const matchesSearch = 
      record.shopName.toLowerCase().includes(searchQuery.toLowerCase()) || 
      (record.moldName && record.moldName.toLowerCase().includes(searchQuery.toLowerCase()));
      
    const matchesStart = dateRange.start ? record.squishDate >= dateRange.start : true;
    const matchesEnd = dateRange.end ? record.squishDate <= dateRange.end : true;
    return matchesSearch && matchesStart && matchesEnd;
  });

  // Grouping Logic
  const groupedRecords = useMemo(() => {
    if (!groupByShop) return {} as Record<string, SquishyRecord[]>;
    
    return filteredRecords.reduce((acc, record) => {
      const shop = record.shopName || '其他';
      if (!acc[shop]) acc[shop] = [];
      acc[shop].push(record);
      return acc;
    }, {} as Record<string, SquishyRecord[]>);
  }, [filteredRecords, groupByShop]);

  return (
    <div className="min-h-screen pb-24 font-sans text-slate-700 max-w-lg mx-auto bg-rose-50 border-x border-pink-100 shadow-2xl min-h-[100dvh]">
      
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md shadow-sm border-b border-pink-100">
        <div className="px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Heart className="w-6 h-6 text-pink-500 fill-pink-500" />
            <h1 className="text-xl font-bold text-gray-800 tracking-wide">我的捏捏图鉴</h1>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => setIsStatsOpen(true)}
              className="p-2 text-pink-400 hover:bg-pink-50 rounded-full transition-colors"
              title="数据统计"
            >
              <BarChart3 className="w-6 h-6" />
            </button>
            <button 
              onClick={handleExport}
              className="p-2 text-pink-400 hover:bg-pink-50 rounded-full transition-colors"
              title="导出备份"
            >
              <Archive className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="px-4 pb-4 space-y-2">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input 
                type="text"
                placeholder="搜索店铺或模具..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-pink-50/50 border border-pink-100 rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:border-pink-300 focus:bg-white transition-all"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
            <button 
              onClick={() => setShowFilters(!showFilters)}
              className={`p-2.5 rounded-xl border transition-colors ${showFilters ? 'bg-pink-500 border-pink-500 text-white' : 'bg-white border-pink-100 text-pink-400'}`}
            >
              <Filter className="w-5 h-5" />
            </button>
          </div>
          
          {/* Collapsible Date Filters & Group Toggle */}
          {showFilters && (
            <div className="p-3 bg-white rounded-xl border border-pink-100 shadow-sm animate-in slide-in-from-top-2 duration-200 space-y-3">
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="text-xs text-gray-400 ml-1">开始日期</label>
                  <input 
                    type="date" 
                    value={dateRange.start}
                    onChange={(e) => setDateRange({...dateRange, start: e.target.value})}
                    className="w-full bg-gray-50 rounded-lg px-2 py-1.5 text-xs border border-gray-100 focus:outline-none focus:border-pink-300"
                  />
                </div>
                <div className="flex-1">
                   <label className="text-xs text-gray-400 ml-1">结束日期</label>
                  <input 
                    type="date" 
                     value={dateRange.end}
                     onChange={(e) => setDateRange({...dateRange, end: e.target.value})}
                    className="w-full bg-gray-50 rounded-lg px-2 py-1.5 text-xs border border-gray-100 focus:outline-none focus:border-pink-300"
                  />
                </div>
                {(dateRange.start || dateRange.end) && (
                  <div className="flex items-end">
                     <button 
                      onClick={() => setDateRange({start: '', end: ''})}
                      className="p-2 text-gray-400 hover:text-red-400"
                     >
                       <X className="w-4 h-4" />
                     </button>
                  </div>
                )}
              </div>
              
              {/* Group Toggle */}
              <div className="flex items-center justify-between pt-1 border-t border-gray-100">
                 <span className="text-xs font-bold text-gray-500 flex items-center gap-1">
                   {groupByShop ? <Layers className="w-3 h-3" /> : <LayoutList className="w-3 h-3" />}
                   显示模式
                 </span>
                 <div className="flex bg-gray-100 p-1 rounded-lg">
                   <button 
                    onClick={() => setGroupByShop(false)}
                    className={`px-3 py-1 text-xs rounded-md transition-all ${!groupByShop ? 'bg-white text-pink-500 shadow-sm font-bold' : 'text-gray-400'}`}
                   >
                     默认
                   </button>
                   <button 
                    onClick={() => setGroupByShop(true)}
                    className={`px-3 py-1 text-xs rounded-md transition-all ${groupByShop ? 'bg-white text-pink-500 shadow-sm font-bold' : 'text-gray-400'}`}
                   >
                     按店铺分组
                   </button>
                 </div>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="p-4">
        {isLoading ? (
           <div className="flex justify-center pt-20 text-pink-300">加载中...</div>
        ) : filteredRecords.length === 0 ? (
          <div className="flex flex-col items-center justify-center pt-32 text-center opacity-60">
            <div className="w-32 h-32 bg-pink-200 rounded-full flex items-center justify-center mb-6">
              {records.length > 0 ? (
                <Search className="w-12 h-12 text-white" />
              ) : (
                <span className="text-4xl">🧸</span>
              )}
            </div>
            <p className="text-lg font-medium text-gray-500">
              {records.length > 0 ? '没有找到匹配的记录' : '还没有记录哦'}
            </p>
            {records.length === 0 && (
               <p className="text-sm text-gray-400 mt-2">点击右下角按钮添加你的第一个捏捏吧！</p>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {groupByShop ? (
              // Grouped View
              Object.entries(groupedRecords).map(([shop, shopRecords]: [string, SquishyRecord[]]) => (
                <div key={shop} className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div className="flex items-center gap-2 mb-3 ml-1">
                     <span className="bg-pink-100 text-pink-600 px-3 py-1 rounded-full text-xs font-bold shadow-sm border border-pink-200">
                       {shop}
                     </span>
                     <span className="text-xs text-gray-400">{shopRecords.length} 个</span>
                  </div>
                  <div className="space-y-6 pl-2 border-l-2 border-pink-100">
                    {shopRecords.map((record) => (
                      <SquishyCard 
                        key={record.id} 
                        record={record} 
                        onDelete={handleDeleteRecord}
                        onEdit={handleEditRecord}
                        onDuplicate={handleDuplicateRecord}
                        onViewImage={setViewingImage}
                      />
                    ))}
                  </div>
                </div>
              ))
            ) : (
              // Normal List View
              filteredRecords.map(record => (
                <SquishyCard 
                  key={record.id} 
                  record={record} 
                  onDelete={handleDeleteRecord}
                  onEdit={handleEditRecord}
                  onDuplicate={handleDuplicateRecord}
                  onViewImage={setViewingImage}
                />
              ))
            )}
          </div>
        )}
      </main>

      {/* Floating Action Button */}
      <button
        onClick={() => {
          setEditingRecord(null);
          setPrefillData(null);
          setIsModalOpen(true);
        }}
        className="fixed bottom-8 right-8 w-16 h-16 bg-gradient-to-br from-pink-500 to-rose-500 text-white rounded-full shadow-xl shadow-pink-300/50 flex items-center justify-center hover:scale-110 active:scale-95 transition-all duration-300 z-40"
      >
        <Plus className="w-8 h-8" />
      </button>

      {/* Modals & Overlays */}
      <AddModal 
        isOpen={isModalOpen} 
        onClose={handleCloseModal}
        onSave={handleSaveRecord}
        onDelete={handleDeleteRecord}
        initialData={editingRecord || prefillData}
      />
      
      <StatsModal 
        isOpen={isStatsOpen}
        onClose={() => setIsStatsOpen(false)}
        records={records}
      />

      <ImageViewer 
        src={viewingImage}
        onClose={() => setViewingImage(null)}
      />
      
    </div>
  );
};

export default App;