import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Key,
  CreditCard,
  Plus,
  Trash2,
  CheckCircle,
  XCircle,
  Radio,
  Fingerprint,
  Edit2,
  Check,
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function RfidTab({ onOpenDoor }) {
  const [cards, setCards] = useState(() => {
    try {
      const saved = localStorage.getItem('smartlock_rfid_cards');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [newCardName, setNewCardName] = useState('');
  const [newCardUid, setNewCardUid] = useState('');
  const [newCardRole, setNewCardRole] = useState('Thành Viên Gia Đình');
  const [simulating, setSimulating] = useState(false);
  const [editingCardId, setEditingCardId] = useState(null);
  const [editingName, setEditingName] = useState('');

  const saveCards = (updated) => {
    setCards(updated);
    localStorage.setItem('smartlock_rfid_cards', JSON.stringify(updated));
  };

  const handleAddCard = (e) => {
    e.preventDefault();
    if (!newCardName.trim() || !newCardUid.trim()) {
      toast.error('Vui lòng nhập tên người dùng thẻ và mã thẻ.');
      return;
    }

    const cleanUid = newCardUid.trim().toUpperCase();

    // Check duplicate
    if (cards.some((c) => c.uid === cleanUid)) {
      toast.error(`Mã thẻ ${cleanUid} đã có trong danh sách.`);
      return;
    }

    const newEntry = {
      id: Date.now(),
      name: newCardName.trim(),
      uid: cleanUid,
      role: newCardRole,
      status: 'ACTIVE',
      lastUsed: 'Chưa sử dụng',
    };

    saveCards([newEntry, ...cards]);
    setNewCardName('');
    setNewCardUid('');
    toast.success(`Đã thêm thẻ từ [${newEntry.uid}] thành công!`, { icon: '💳' });
  };

  const handleToggleStatus = (id) => {
    const updated = cards.map((c) =>
      c.id === id ? { ...c, status: c.status === 'ACTIVE' ? 'BLOCKED' : 'ACTIVE' } : c
    );
    saveCards(updated);
    toast.success('Đã cập nhật trạng thái thẻ');
  };

  const handleDeleteCard = (id, uid) => {
    const updated = cards.filter((c) => c.id !== id);
    saveCards(updated);
    toast.success(`Đã thu hồi quyền truy cập của thẻ [${uid}]`);
  };

  const handleStartEdit = (card) => {
    setEditingCardId(card.id);
    setEditingName(card.name);
  };

  const handleSaveEdit = (id) => {
    if (!editingName.trim()) return;
    const updated = cards.map((c) => (c.id === id ? { ...c, name: editingName.trim() } : c));
    saveCards(updated);
    setEditingCardId(null);
    toast.success('Đã lưu tên chủ thẻ mới');
  };

  const handleSimulateSwipe = async (card) => {
    if (card.status === 'BLOCKED') {
      toast.error(`Từ chối truy cập! Thẻ [${card.uid}] hiện đang bị khóa.`, { icon: '🚫' });
      return;
    }

    setSimulating(true);
    try {
      toast.loading(`Đang kiểm tra thẻ [${card.uid}]...`, { id: 'rfid-swipe' });
      if (onOpenDoor) {
        await onOpenDoor();
      }
      toast.success(`Quẹt thẻ thành công! Cửa đã mở cho ${card.name}`, { id: 'rfid-swipe', icon: '🔓' });
    } catch {
      toast.error('Lỗi khi mô phỏng quẹt thẻ', { id: 'rfid-swipe' });
    } finally {
      setSimulating(false);
    }
  };

  return (
    <div className="space-y-4 w-full h-full flex flex-col justify-between select-none text-slate-800">
      
      {/* Header */}
      <div>
        <span className="text-xs font-bold text-blue-600 tracking-wider uppercase">
          Quản Trị Thẻ Thông Minh
        </span>
        <h2 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-slate-800 tracking-tight">
          Quản Lý Thẻ Từ
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">
          Cấp quyền mở cửa bằng thẻ từ và kiểm tra thẻ đã đăng ký
        </p>
      </div>

      {/* Main Grid: Form bên trái + Danh sách thẻ bên phải */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 flex-1 items-stretch">
        
        {/* Cột Trái: Form Thêm Thẻ Mới */}
        <div className="lg:col-span-4 p-4 rounded-2xl bg-slate-50 border border-slate-100 shadow-xs flex flex-col justify-between space-y-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="p-1.5 rounded-lg bg-blue-100 text-blue-600">
                <Plus className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-slate-800">Thêm Thẻ Từ Mới</h3>
            </div>
            <p className="text-xs text-slate-400">Đăng ký thẻ để mở cửa</p>
          </div>

          <form onSubmit={handleAddCard} className="space-y-2.5">
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">
                Tên Chủ Thẻ
              </label>
              <input
                type="text"
                value={newCardName}
                onChange={(e) => setNewCardName(e.target.value)}
                placeholder="Ví dụ: Thẻ anh Hiếu (Chìa khóa xe)"
                className="w-full px-3 py-1.5 bg-white rounded-xl border border-slate-200 text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">
                Mã Thẻ
              </label>
              <input
                type="text"
                value={newCardUid}
                onChange={(e) => setNewCardUid(e.target.value)}
                placeholder="Ví dụ: C30B2407"
                className="w-full px-3 py-1.5 bg-white rounded-xl border border-slate-200 text-xs font-mono font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all uppercase"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">
                Quyền Truy Cập
              </label>
              <select
                value={newCardRole}
                onChange={(e) => setNewCardRole(e.target.value)}
                className="w-full px-3 py-1.5 bg-white rounded-xl border border-slate-200 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all cursor-pointer"
              >
                <option value="Toàn Quyền Quản Trị">Toàn Quyền Quản Trị (Master)</option>
                <option value="Thành Viên Gia Đình">Thành Viên Gia Đình</option>
                <option value="Khách Tạm Thời">Khách Tạm Thời</option>
              </select>
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              className="w-full py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md shadow-blue-500/20 flex items-center justify-center gap-1.5 transition-all cursor-pointer mt-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Đăng Ký Thẻ Ngay</span>
            </motion.button>
          </form>

          {/* Hộp thông tin phụ */}
          <div className="p-2.5 bg-blue-50/80 rounded-xl border border-blue-100 text-[11px] text-blue-700 flex items-center gap-2">
            <Radio className="w-4 h-4 text-blue-600 flex-shrink-0" />
            <span>Thẻ đã đăng ký có thể dùng để mở cửa.</span>
          </div>
        </div>

        {/* Cột Phải: Danh Sách Thẻ Được Cấp Quyền */}
        <div className="lg:col-span-8 p-4 rounded-2xl bg-slate-50 border border-slate-100 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-800">Thẻ Được Cấp Quyền</h3>
              <p className="text-xs text-slate-400">Bấm "Quẹt Thẻ Thử" để kiểm tra mở cửa tức thì</p>
            </div>
            <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-100">
              {cards.length} thẻ đã lưu
            </span>
          </div>

          {/* Danh sách thẻ */}
          <div className="max-h-[360px] overflow-y-auto space-y-2 pr-1 scrollbar-thin">
            {cards.length === 0 ? (
              <div className="py-12 px-4 text-center rounded-2xl bg-white border border-dashed border-slate-200 flex flex-col items-center justify-center space-y-2.5">
                <div className="relative">
                  <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center shadow-xs">
                    <CreditCard className="w-6 h-6 stroke-[1.75]" />
                  </div>
                  <span className="absolute -top-1 -right-1 w-3 h-3 bg-amber-400 rounded-full border-2 border-white animate-pulse" />
                </div>
                <div className="space-y-0.5">
                  <h4 className="text-xs font-bold text-slate-800">Chưa có dữ liệu</h4>
                  <p className="text-[11px] text-slate-400 max-w-[260px] leading-relaxed">
                    Chưa có thẻ nào được ghi nhận. Dùng biểu mẫu bên cạnh để thêm thẻ mới.
                  </p>
                </div>
                <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-full border border-slate-200">
                  Sẵn sàng thêm thẻ
                </span>
              </div>
            ) : (
              cards.map((card) => {
                const isActive = card.status === 'ACTIVE';
                const isEditing = editingCardId === card.id;

                return (
                  <div
                    key={card.id}
                    className="p-3 rounded-xl bg-white border border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 shadow-xs hover:shadow-xs transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-xs flex-shrink-0 ${
                          isActive
                            ? 'bg-blue-50 text-blue-600'
                            : 'bg-slate-100 text-slate-400'
                        }`}
                      >
                        <CreditCard className="w-5 h-5" />
                      </div>
                      <div>
                        {isEditing ? (
                          <div className="flex items-center gap-1.5 mb-1">
                            <input
                              type="text"
                              value={editingName}
                              onChange={(e) => setEditingName(e.target.value)}
                              className="px-2 py-0.5 text-xs border rounded-md font-bold text-slate-800 bg-white border-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                            <button
                              onClick={() => handleSaveEdit(card.id)}
                              className="p-1 rounded bg-blue-600 text-white"
                            >
                              <Check className="w-3 h-3" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <h4 className="text-xs font-bold text-slate-800">{card.name}</h4>
                            <span
                              className={`px-2 py-0.2 rounded-full text-[9px] font-bold uppercase ${
                                isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                              }`}
                            >
                              {isActive ? 'Đang Hoạt Động' : 'Đã Khóa'}
                            </span>
                          </div>
                        )}
                        <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5 font-mono">
                          <span>Mã thẻ: <strong className="text-slate-700">{card.uid}</strong></span>
                          <span>•</span>
                          <span className="font-sans text-slate-500">{card.role}</span>
                        </div>
                      </div>
                    </div>

                    {/* Các Nút Thao Tác */}
                    <div className="flex items-center gap-1.5 self-end sm:self-center">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleSimulateSwipe(card)}
                        disabled={simulating || !isActive}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold shadow-xs transition-all flex items-center gap-1 cursor-pointer border ${
                          isActive
                            ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200'
                            : 'bg-slate-100 text-slate-400 cursor-not-allowed border-slate-200'
                        }`}
                      >
                        <Fingerprint className="w-3.5 h-3.5" />
                        <span>Quẹt Thử</span>
                      </motion.button>

                      <button
                        onClick={() => handleStartEdit(card)}
                        className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                        title="Đổi tên chủ thẻ"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => handleToggleStatus(card.id)}
                        className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 transition-colors cursor-pointer"
                        title={isActive ? 'Khóa thẻ' : 'Kích hoạt thẻ'}
                      >
                        {isActive ? (
                          <XCircle className="w-3.5 h-3.5 text-amber-500" />
                        ) : (
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                        )}
                      </button>

                      <button
                        onClick={() => handleDeleteCard(card.id, card.uid)}
                        className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                        title="Thu hồi quyền truy cập"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
