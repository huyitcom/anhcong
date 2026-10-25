import React, { useState, useEffect } from 'react';
import {
  X,
  Download,
  Check,
  Clock,
  Eye,
  ImageIcon,
  Trash2,
  RefreshCw,
  Copy,
} from 'lucide-react';
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../lib/AuthContext';
import {
  getRenderHistory,
  clearRenderHistory,
  RenderHistoryItem,
} from '../utils/renderHistory';

interface RenderHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectImage?: (imageUrl: string) => void;
}

export const RenderHistoryModal: React.FC<RenderHistoryModalProps> = ({
  isOpen,
  onClose,
  onSelectImage,
}) => {
  const { currentUser } = useAuth();
  const [localItems, setLocalItems] = useState<RenderHistoryItem[]>([]);
  const [firestoreItems, setFirestoreItems] = useState<any[]>([]);
  const [loadingFirestore, setLoadingFirestore] = useState(false);
  const [selectedPreview, setSelectedPreview] = useState<{
    imageUrl: string;
    title: string;
    resolution?: string;
    time?: string;
    prompt?: string;
  } | null>(null);
  const [copiedToast, setCopiedToast] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    // Load local history
    const history = getRenderHistory();
    setLocalItems(history);

    // Fetch user's history from Firestore if logged in
    if (currentUser?.uid) {
      setLoadingFirestore(true);
      const q = query(
        collection(db, 'renderLogs'),
        where('userId', '==', currentUser.uid),
        orderBy('timestamp', 'desc'),
        limit(40)
      );
      getDocs(q)
        .then((snap) => {
          const list: any[] = [];
          snap.forEach((docSnap) => {
            const data = docSnap.data();
            list.push({ id: docSnap.id, ...data });
          });
          setFirestoreItems(list);
        })
        .catch((err) => {
          console.warn('[RenderHistoryModal] Could not fetch Firestore history:', err);
        })
        .finally(() => {
          setLoadingFirestore(false);
        });
    }
  }, [isOpen, currentUser]);

  if (!isOpen) return null;

  // Merge items: prioritize local items, supplement with firestore items that have images
  const allDisplayItems: Array<{
    id: string;
    imageUrl: string;
    thumbnailUrl?: string;
    templateName: string;
    resolution: string;
    timestamp: string;
    source: 'local' | 'cloud';
    prompt?: string;
  }> = [];

  const seenUrls = new Set<string>();

  localItems.forEach((item) => {
    if (item.imageUrl && !seenUrls.has(item.imageUrl)) {
      seenUrls.add(item.imageUrl);
      allDisplayItems.push({
        id: item.id,
        imageUrl: item.imageUrl,
        thumbnailUrl: item.thumbnailUrl,
        templateName: item.templateName,
        resolution: item.resolution,
        timestamp: item.timestamp,
        source: 'local',
        prompt: item.prompt,
      });
    }
  });

  firestoreItems.forEach((f) => {
    const imgUrl = f.renderedImageUrl || f.thumbnailUrl;
    if (imgUrl && !seenUrls.has(imgUrl)) {
      seenUrls.add(imgUrl);
      allDisplayItems.push({
        id: f.id,
        imageUrl: f.renderedImageUrl || f.thumbnailUrl,
        thumbnailUrl: f.thumbnailUrl || f.renderedImageUrl,
        templateName: f.templateName || 'Ghép phông AI',
        resolution: f.resolution || '1K',
        timestamp: f.timestamp || '',
        source: 'cloud',
        prompt: f.prompt,
      });
    }
  });

  const handleDownload = (imageUrl: string, filename: string) => {
    try {
      const link = document.createElement('a');
      link.href = imageUrl;
      link.download = filename || `anh_cuoi_ai_${Date.now()}.png`;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (e) {
      console.warn('Download error:', e);
      window.open(imageUrl, '_blank');
    }
  };

  const handleApply = (imageUrl: string) => {
    if (onSelectImage) {
      onSelectImage(imageUrl);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/75 backdrop-blur-md animate-fadeIn">
      <div className="bg-stone-900 border border-stone-800 rounded-3xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-stone-800 flex items-center justify-between bg-stone-900/90 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-sky-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-sky-500/20">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-base sm:text-lg text-white flex items-center gap-2">
                <span>Lịch Sử Ảnh AI Đã Ghép</span>
                <span className="text-xs bg-sky-500/20 text-sky-400 font-semibold px-2 py-0.5 rounded-full border border-sky-500/30">
                  {allDisplayItems.length} ảnh
                </span>
              </h2>
              <p className="text-xs text-stone-400">
                Xem lại, tải về hoặc áp dụng lại các ảnh bạn đã render AI trên hệ thống
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {localItems.length > 0 && (
              <button
                onClick={() => {
                  if (confirm('Bạn có chắc muốn xóa lịch sử ảnh tạm trên trình duyệt này?')) {
                    clearRenderHistory();
                    setLocalItems([]);
                  }
                }}
                title="Xóa bộ nhớ đệm ảnh trên máy này"
                className="p-2 text-stone-500 hover:text-rose-400 hover:bg-stone-800 rounded-xl transition text-xs flex items-center gap-1 cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span className="hidden sm:inline">Dọn dẹp</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 text-stone-400 hover:text-white hover:bg-stone-800 rounded-xl transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content list */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-stone-950/50">
          {loadingFirestore && allDisplayItems.length === 0 ? (
            <div className="py-20 text-center text-stone-400 flex flex-col items-center justify-center">
              <RefreshCw className="w-8 h-8 text-sky-500 animate-spin mb-3" />
              <p className="text-xs text-stone-400">Đang tải lịch sử ảnh AI của bạn...</p>
            </div>
          ) : allDisplayItems.length === 0 ? (
            <div className="py-20 text-center text-stone-400 flex flex-col items-center justify-center">
              <div className="w-16 h-16 rounded-2xl bg-stone-800/80 border border-stone-700 flex items-center justify-center text-stone-500 mb-3">
                <ImageIcon className="w-8 h-8" />
              </div>
              <h3 className="font-semibold text-stone-300 text-sm mb-1">
                Chưa có ảnh AI nào trong lịch sử
              </h3>
              <p className="text-xs text-stone-500 max-w-sm">
                Khi bạn bấm tạo ảnh bằng tính năng "Ghép phông nền AI" hoặc "Cứu sáng ảnh", kết quả sẽ tự động lưu lại ở đây để bạn xem và tải về bất kỳ lúc nào.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
              {allDisplayItems.map((item) => (
                <div
                  key={item.id}
                  className="group relative bg-stone-900 border border-stone-800 rounded-2xl overflow-hidden shadow-md hover:border-sky-500/50 hover:shadow-sky-500/10 transition flex flex-col"
                >
                  {/* Thumbnail Container */}
                  <div className="aspect-[3/4] relative bg-stone-950 overflow-hidden">
                    <img
                      src={item.thumbnailUrl || item.imageUrl}
                      alt={item.templateName}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                      loading="lazy"
                    />

                    {/* Badge Resolution */}
                    <div className="absolute top-2 left-2 bg-black/75 backdrop-blur-xs text-sky-400 text-[10px] font-bold px-2 py-0.5 rounded-md border border-white/10 shadow-xs">
                      {item.resolution}
                    </div>

                    {/* Overlay Action Buttons */}
                    <div className="absolute inset-0 bg-stone-950/70 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 p-2">
                      <button
                        onClick={() =>
                          setSelectedPreview({
                            imageUrl: item.imageUrl,
                            title: item.templateName,
                            resolution: item.resolution,
                            time: item.timestamp,
                            prompt: item.prompt,
                          })
                        }
                        className="w-full py-1.5 px-2 bg-stone-800/90 hover:bg-stone-700 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 shadow-sm cursor-pointer transition"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Xem lớn</span>
                      </button>

                      {onSelectImage && (
                        <button
                          onClick={() => handleApply(item.imageUrl)}
                          className="w-full py-1.5 px-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 shadow-sm cursor-pointer transition"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Áp dụng ảnh</span>
                        </button>
                      )}

                      <button
                        onClick={() =>
                          handleDownload(
                            item.imageUrl,
                            `anh_cuoi_ai_${item.templateName.replace(/\s+/g, '_')}_${Date.now()}.png`
                          )
                        }
                        className="w-full py-1.5 px-2 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 shadow-sm cursor-pointer transition"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Tải về</span>
                      </button>
                    </div>
                  </div>

                  {/* Info footer */}
                  <div className="p-2.5 bg-stone-900 border-t border-stone-800 flex flex-col justify-between flex-1">
                    <div className="font-semibold text-xs text-stone-200 truncate" title={item.templateName}>
                      {item.templateName}
                    </div>
                    <div className="text-[10px] text-stone-400 mt-1 flex items-center justify-between">
                      <span>{item.timestamp ? new Date(item.timestamp).toLocaleDateString('vi-VN') : ''}</span>
                      <span className="text-stone-500">{item.timestamp ? new Date(item.timestamp).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : ''}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Lightbox / Large Preview Modal */}
      {selectedPreview && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-fadeIn">
          <div className="relative max-w-2xl w-full bg-stone-900 border border-stone-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
            {/* Modal header */}
            <div className="p-4 border-b border-stone-800 flex items-center justify-between bg-stone-900 shrink-0">
              <div>
                <h3 className="font-bold text-sm text-white flex items-center gap-2">
                  <span>{selectedPreview.title}</span>
                  {selectedPreview.resolution && (
                    <span className="text-xs bg-sky-500/20 text-sky-400 px-2 py-0.5 rounded-md font-mono">
                      {selectedPreview.resolution}
                    </span>
                  )}
                </h3>
                {selectedPreview.time && (
                  <div className="text-[11px] text-stone-400">
                    Thời gian tạo: {new Date(selectedPreview.time).toLocaleString('vi-VN')}
                  </div>
                )}
              </div>
              <button
                onClick={() => setSelectedPreview(null)}
                className="p-1.5 text-stone-400 hover:text-white rounded-lg hover:bg-stone-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Image Display */}
            <div
              onClick={(e) => {
                if (e.shiftKey && selectedPreview.prompt) {
                  e.preventDefault();
                  e.stopPropagation();
                  navigator.clipboard.writeText(selectedPreview.prompt);
                  setCopiedToast(true);
                  setTimeout(() => setCopiedToast(false), 2500);
                }
              }}
              title={selectedPreview.prompt ? "Đè phím Shift + Click vào ảnh để sao chép câu lệnh Prompt gốc!" : undefined}
              className="flex-1 overflow-auto p-4 flex items-center justify-center bg-black relative group cursor-pointer"
            >
              <img
                src={selectedPreview.imageUrl}
                alt={selectedPreview.title}
                className="max-h-[65vh] w-auto max-w-full object-contain rounded-xl shadow-lg border border-white/5"
              />
              {selectedPreview.prompt && (
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-black/80 backdrop-blur-xs text-stone-200 text-[11px] px-3 py-1 rounded-full border border-white/10 flex items-center gap-1.5 pointer-events-none opacity-80 group-hover:opacity-100 transition">
                  <Copy className="w-3.5 h-3.5 text-sky-400" />
                  <span>Đè <b>Shift + Click</b> để copy Prompt gốc</span>
                </div>
              )}
              {copiedToast && (
                <div className="absolute inset-0 bg-black/80 flex items-center justify-center p-4 z-20">
                  <div className="bg-emerald-600 text-white text-xs font-bold px-4 py-2 rounded-xl shadow-lg flex items-center gap-2">
                    <Check className="w-4 h-4" />
                    <span>Đã sao chép câu lệnh Prompt gốc!</span>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer Actions */}
            <div className="p-3 sm:p-4 border-t border-stone-800 bg-stone-900 flex items-center justify-end gap-2.5 shrink-0 flex-wrap">
              {selectedPreview.prompt && (
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(selectedPreview.prompt!);
                    setCopiedToast(true);
                    setTimeout(() => setCopiedToast(false), 2500);
                  }}
                  className="px-3.5 py-2 bg-purple-900/40 hover:bg-purple-800/60 text-purple-200 border border-purple-500/40 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5 text-purple-400" />
                  <span>Copy Prompt Gốc</span>
                </button>
              )}
              {onSelectImage && (
                <button
                  onClick={() => {
                    handleApply(selectedPreview.imageUrl);
                    setSelectedPreview(null);
                  }}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>Áp Dụng Vào Ảnh Cổng</span>
                </button>
              )}
              <button
                onClick={() =>
                  handleDownload(
                    selectedPreview.imageUrl,
                    `anh_cuoi_ai_${Date.now()}.png`
                  )
                }
                className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Tải Ảnh Về Máy</span>
              </button>
              <button
                onClick={() => setSelectedPreview(null)}
                className="px-3.5 py-2 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded-xl text-xs font-semibold transition cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
