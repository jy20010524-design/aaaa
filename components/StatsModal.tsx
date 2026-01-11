import React, { useMemo } from 'react';
import { X, TrendingUp, ShoppingBag, DollarSign, Award } from 'lucide-react';
import { SquishyRecord } from '../types';

interface StatsModalProps {
  isOpen: boolean;
  onClose: () => void;
  records: SquishyRecord[];
}

const StatsModal: React.FC<StatsModalProps> = ({ isOpen, onClose, records }) => {
  const stats = useMemo(() => {
    const totalCount = records.length;
    
    // Calculate simple total spent (extract numbers from price string)
    const totalSpent = records.reduce((acc, curr) => {
      if (!curr.price) return acc;
      // Extract numeric value from string like "20.5元" or "$15"
      const match = curr.price.match(/(\d+(\.\d+)?)/);
      return acc + (match ? parseFloat(match[0]) : 0);
    }, 0);

    // Group by Shop
    const shopCounts: Record<string, number> = {};
    records.forEach(r => {
      const name = r.shopName || '未知店铺';
      shopCounts[name] = (shopCounts[name] || 0) + 1;
    });

    // Sort shops by count (descending)
    const sortedShops = Object.entries(shopCounts)
      .sort(([, a], [, b]) => b - a)
      .map(([name, count]) => ({ name, count }));

    return { totalCount, totalSpent, sortedShops };
  }, [records]);

  if (!isOpen) return null;

  const maxShopCount = stats.sortedShops.length > 0 ? stats.sortedShops[0].count : 1;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center pointer-events-none">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm pointer-events-auto" onClick={onClose} />
      
      <div className="bg-white w-full max-w-md rounded-t-[2rem] sm:rounded-[2rem] p-6 shadow-2xl transform transition-transform duration-300 pointer-events-auto flex flex-col max-h-[85vh]">
        
        <div className="flex justify-between items-center mb-6 shrink-0">
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-pink-500" /> 数据统计
          </h2>
          <button onClick={onClose} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200">
            <X className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        <div className="overflow-y-auto hide-scrollbar space-y-6 pb-4">
          
          {/* Summary Cards */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gradient-to-br from-pink-500 to-rose-500 rounded-2xl p-4 text-white shadow-lg shadow-pink-200">
              <div className="flex items-center gap-2 opacity-90 mb-1 text-sm font-medium">
                <ShoppingBag className="w-4 h-4" /> 总数量
              </div>
              <div className="text-3xl font-bold">{stats.totalCount} <span className="text-sm font-normal opacity-80">个</span></div>
            </div>
            
            <div className="bg-white border-2 border-pink-100 rounded-2xl p-4 text-gray-800 shadow-sm">
              <div className="flex items-center gap-2 text-pink-500 mb-1 text-sm font-medium">
                <DollarSign className="w-4 h-4" /> 估算花费
              </div>
              <div className="text-2xl font-bold">{stats.totalSpent.toFixed(0)} <span className="text-sm font-normal text-gray-400">元</span></div>
            </div>
          </div>

          {/* Shop Ranking */}
          <div>
             <h3 className="font-bold text-gray-700 mb-4 flex items-center gap-2">
               <Award className="w-5 h-5 text-yellow-500" /> 店铺排行榜
             </h3>
             
             {stats.sortedShops.length === 0 ? (
               <div className="text-center text-gray-400 py-8 text-sm">还没有数据哦</div>
             ) : (
               <div className="space-y-3">
                 {stats.sortedShops.map((shop, index) => (
                   <div key={shop.name} className="relative">
                     <div className="flex justify-between items-center mb-1 text-sm">
                       <span className="font-medium text-gray-700 flex items-center gap-2">
                         {index < 3 && <span className="text-xs font-bold text-yellow-500">#{index + 1}</span>}
                         {shop.name}
                       </span>
                       <span className="text-pink-500 font-bold">{shop.count}</span>
                     </div>
                     {/* Progress Bar Background */}
                     <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                       <div 
                         className="h-full bg-pink-400 rounded-full transition-all duration-500"
                         style={{ width: `${(shop.count / maxShopCount) * 100}%` }}
                       />
                     </div>
                   </div>
                 ))}
               </div>
             )}
          </div>

        </div>
      </div>
    </div>
  );
};

export default StatsModal;