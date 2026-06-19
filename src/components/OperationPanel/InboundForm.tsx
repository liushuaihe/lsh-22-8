import { useState, useEffect, useMemo } from 'react';
import { ArrowDownCircle, Package, Calendar, Hash, Plus, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { useInventoryStore } from '@/store/useInventoryStore';
import { generateBatchNo, formatDate } from '@/utils/inventoryCalculator';
import type { Batch } from '@/types';

export function InboundForm() {
  const { skus, batches, inbound } = useInventoryStore();
  const [selectedSku, setSelectedSku] = useState('');
  const [batchNo, setBatchNo] = useState(generateBatchNo());
  const [productionDate, setProductionDate] = useState(new Date().toISOString().split('T')[0]);
  const [expiryDate, setExpiryDate] = useState('');
  const [quantity, setQuantity] = useState('');
  const [isAppendConfirmed, setIsAppendConfirmed] = useState(false);

  const existingBatch = useMemo<Batch | undefined>(() => {
    if (!selectedSku || !batchNo.trim()) return undefined;
    return batches.find(b => b.skuId === selectedSku && b.batchNo === batchNo.trim().toUpperCase());
  }, [selectedSku, batchNo, batches]);

  useEffect(() => {
    setIsAppendConfirmed(false);
  }, [selectedSku, batchNo]);

  const handleSkuChange = (value: string) => {
    setSelectedSku(value);
    setExpiryDate('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedSku || !quantity || !expiryDate) return;

    const qty = parseInt(quantity);
    if (qty <= 0) return;

    if (existingBatch && !isAppendConfirmed) return;

    inbound(selectedSku, {
      batchNo,
      productionDate,
      expiryDate,
      quantity: qty,
      availableQuantity: qty,
      isFrozen: false,
      createdAt: new Date().toISOString()
    });

    setSelectedSku('');
    setBatchNo(generateBatchNo());
    setQuantity('');
    setExpiryDate('');
    setIsAppendConfirmed(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/30 mb-3">
          <ArrowDownCircle size={32} className="text-emerald-400" />
        </div>
        <h3 className="text-lg font-semibold text-slate-100">入库录入</h3>
        <p className="text-sm text-slate-400">录入新批次商品信息</p>
      </div>

      <div>
        <label className="flex items-center gap-2 text-sm font-medium text-slate-300 mb-2">
          <Package size={14} />
          选择商品
        </label>
        <select
          value={selectedSku}
          onChange={(e) => handleSkuChange(e.target.value)}
          className="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all"
          required
        >
          <option value="">请选择商品...</option>
          {skus.map((sku) => (
            <option key={sku.id} value={sku.id}>
              {sku.name} ({sku.skuCode}) - {sku.category}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="flex items-center gap-2 text-sm font-medium text-slate-300 mb-2">
          <Hash size={14} />
          批次号
        </label>
        <div className="relative">
          <input
            type="text"
            value={batchNo}
            onChange={(e) => setBatchNo(e.target.value.toUpperCase())}
            className="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-lg text-slate-100 font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all"
            placeholder="自动生成或手动输入"
            required
          />
          <button
            type="button"
            onClick={() => setBatchNo(generateBatchNo())}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-slate-400 hover:text-emerald-400 transition-colors"
            title="重新生成批次号"
          >
            <Plus size={16} />
          </button>
        </div>
      </div>

      {existingBatch && (
        <div className={`p-4 rounded-lg border ${
          isAppendConfirmed
            ? 'bg-emerald-900/20 border-emerald-500/40'
            : 'bg-amber-900/20 border-amber-500/40'
        }`}>
          <div className="flex items-center gap-2 mb-3">
            {isAppendConfirmed ? (
              <CheckCircle2 size={18} className="text-emerald-400" />
            ) : (
              <AlertTriangle size={18} className="text-amber-400" />
            )}
            <span className={`text-sm font-semibold ${
              isAppendConfirmed ? 'text-emerald-400' : 'text-amber-400'
            }`}>
              {isAppendConfirmed ? '已确认追加入库' : '检测到已存在批次号'}
            </span>
          </div>
          <div className="grid grid-cols-3 gap-3 text-sm mb-3">
            <div className="bg-slate-800/60 rounded p-2 text-center">
              <div className="text-slate-500 text-xs mb-1">原批次数量</div>
              <div className="font-mono text-lg font-bold text-slate-200">
                {existingBatch.quantity}
                <span className="text-xs text-slate-500 ml-1">件</span>
              </div>
            </div>
            <div className="bg-slate-800/60 rounded p-2 text-center">
              <div className="text-slate-500 text-xs mb-1">生产日期</div>
              <div className="font-mono text-slate-200">
                {formatDate(existingBatch.productionDate)}
              </div>
            </div>
            <div className="bg-slate-800/60 rounded p-2 text-center">
              <div className="text-slate-500 text-xs mb-1">过期日期</div>
              <div className="font-mono text-slate-200">
                {formatDate(existingBatch.expiryDate)}
              </div>
            </div>
          </div>
          {!isAppendConfirmed && (
            <button
              type="button"
              onClick={() => setIsAppendConfirmed(true)}
              className="w-full py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white font-semibold rounded-lg transition-all duration-200 flex items-center justify-center gap-2 shadow-md shadow-amber-500/20 hover:shadow-amber-500/40"
            >
              <Plus size={18} />
              确认追加入库
            </button>
          )}
          {isAppendConfirmed && (
            <button
              type="button"
              onClick={() => setIsAppendConfirmed(false)}
              className="w-full py-2 bg-slate-700/50 hover:bg-slate-700 text-slate-300 font-medium rounded-lg transition-all duration-200 text-sm"
            >
              取消确认
            </button>
          )}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-slate-300 mb-2">
            <Calendar size={14} />
            生产日期
          </label>
          <input
            type="date"
            value={productionDate}
            onChange={(e) => setProductionDate(e.target.value)}
            className="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all"
            required
          />
        </div>
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-slate-300 mb-2">
            <Calendar size={14} />
            过期日期
          </label>
          <input
            type="date"
            value={expiryDate}
            onChange={(e) => setExpiryDate(e.target.value)}
            min={productionDate}
            className="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all"
            required
          />
        </div>
      </div>

      <div>
        <label className="flex items-center gap-2 text-sm font-medium text-slate-300 mb-2">
          <Hash size={14} />
          入库数量
        </label>
        <input
          type="number"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          min="1"
          className="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-lg text-slate-100 font-mono text-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all"
          placeholder="请输入数量"
          required
        />
      </div>

      <button
        type="submit"
        disabled={!selectedSku || !quantity || !expiryDate || (existingBatch && !isAppendConfirmed)}
        className={`w-full py-4 font-semibold rounded-lg transition-all duration-200 flex items-center justify-center gap-2 shadow-lg ${
          existingBatch && !isAppendConfirmed
            ? 'bg-gradient-to-r from-slate-600 to-slate-600 cursor-not-allowed text-slate-400 shadow-slate-900/20'
            : 'bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white shadow-emerald-500/20 hover:shadow-emerald-500/40'
        }`}
      >
        <ArrowDownCircle size={20} />
        {existingBatch && !isAppendConfirmed ? '请先确认追加入库' : existingBatch && isAppendConfirmed ? '确认追加入库' : '确认入库'}
      </button>
    </form>
  );
}
