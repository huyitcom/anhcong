import { useState, useRef } from 'react';
import {
  FrameSlot,
  PosterSettings,
  TemplateId,
  TextConfig,
} from './types';
import {
  DEFAULT_POSTER_SETTINGS,
  DEFAULT_TEXT_CONFIG,
  SAMPLE_WEDDING_PHOTOS,
  TEMPLATES,
} from './data/constants';
import { Navbar } from './components/Navbar';
import { PosterCanvas } from './components/PosterCanvas';
import { EditorSidebar } from './components/EditorSidebar';
import { PhotoCropModal } from './components/PhotoCropModal';
import { BatchUploadModal } from './components/BatchUploadModal';
import { toPng } from 'html-to-image';
import confetti from 'canvas-confetti';

export default function App() {
  const [templateId, setTemplateId] = useState<TemplateId>('classic-10');
  const [textConfig, setTextConfig] = useState<TextConfig>(DEFAULT_TEXT_CONFIG);
  const [posterSettings, setPosterSettings] = useState<PosterSettings>(DEFAULT_POSTER_SETTINGS);

  // Initialize slots
  const [slots, setSlots] = useState<FrameSlot[]>(() => {
    return Array.from({ length: 10 }, (_, i) => ({
      id: `slot-${i}`,
      imageUri: SAMPLE_WEDDING_PHOTOS[i] || null,
      zoom: 1,
      offsetX: 0,
      offsetY: 0,
      filter: 'none',
      rotation: 0,
    }));
  });

  const [activeSlotIndex, setActiveSlotIndex] = useState<number | null>(null);
  const [editingSlot, setEditingSlot] = useState<{ slot: FrameSlot; index: number } | null>(null);

  // Modals
  const [isBatchUploadOpen, setIsBatchUploadOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const posterRef = useRef<HTMLDivElement>(null);

  // Adjust slot count when template changes
  const handleTemplateChange = (newTemplateId: TemplateId) => {
    setTemplateId(newTemplateId);
    const selectedTemplate = TEMPLATES.find((t) => t.id === newTemplateId);
    const targetCount = selectedTemplate ? selectedTemplate.slotCount : 10;

    setSlots((prev) => {
      if (prev.length === targetCount) return prev;
      if (prev.length < targetCount) {
        const added = Array.from({ length: targetCount - prev.length }, (_, i) => ({
          id: `slot-${prev.length + i}`,
          imageUri: SAMPLE_WEDDING_PHOTOS[prev.length + i] || null,
          zoom: 1,
          offsetX: 0,
          offsetY: 0,
          filter: 'none',
          rotation: 0,
        }));
        return [...prev, ...added];
      }
      return prev.slice(0, targetCount);
    });
  };

  // Single Slot Image Update
  const handleSlotImageChange = (index: number, imageUri: string) => {
    setSlots((prev) => {
      const updated = [...prev];
      if (updated[index]) {
        updated[index] = {
          ...updated[index],
          imageUri,
          zoom: 1,
          offsetX: 0,
          offsetY: 0,
        };
      }
      return updated;
    });
  };

  // Update Slot Configuration
  const handleUpdateSlot = (updatedSlot: FrameSlot) => {
    setSlots((prev) =>
      prev.map((s) => (s.id === updatedSlot.id ? updatedSlot : s))
    );
    if (editingSlot && editingSlot.slot.id === updatedSlot.id) {
      setEditingSlot({ ...editingSlot, slot: updatedSlot });
    }
  };

  // Remove Photo from Slot
  const handleRemovePhoto = (slotId: string) => {
    setSlots((prev) =>
      prev.map((s) =>
        s.id === slotId
          ? { ...s, imageUri: null, zoom: 1, offsetX: 0, offsetY: 0, filter: 'none' }
          : s
      )
    );
  };

  // Batch Apply Uploaded Photos
  const handleApplyBatchPhotos = (images: string[]) => {
    setSlots((prev) => {
      const updated = [...prev];
      images.forEach((img, idx) => {
        if (idx < updated.length) {
          updated[idx] = {
            ...updated[idx],
            imageUri: img,
            zoom: 1,
            offsetX: 0,
            offsetY: 0,
          };
        }
      });
      return updated;
    });
  };

  // Export High Quality PNG
  const handleExportPoster = async () => {
    if (!posterRef.current) return;
    try {
      setIsExporting(true);
      const dataUrl = await toPng(posterRef.current, {
        quality: 0.98,
        pixelRatio: 3, // Ultra crisp resolution!
      });

      const fileName = `Anh_Cong_Cuoi_${textConfig.groomName || 'TuanAnh'}_${textConfig.brideName || 'BaoNgoc'}.png`;
      const link = document.createElement('a');
      link.download = fileName;
      link.href = dataUrl;
      link.click();

      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });
    } catch (error) {
      console.error('Error exporting image:', error);
      alert('Đã xảy ra lỗi khi tạo file ảnh. Vui lòng thử lại!');
    } finally {
      setIsExporting(false);
    }
  };

  // Reset All to Default
  const handleResetAll = () => {
    if (confirm('Khôi phục lại thiết lập mặc định ban đầu?')) {
      setTemplateId('classic-10');
      setTextConfig(DEFAULT_TEXT_CONFIG);
      setPosterSettings(DEFAULT_POSTER_SETTINGS);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-stone-100 font-sans text-stone-900 selection:bg-sky-200 selection:text-sky-900">
      {/* Top Navbar */}
      <Navbar
        onExportPoster={handleExportPoster}
        onResetAll={handleResetAll}
        onOpenBatchUpload={() => setIsBatchUploadOpen(true)}
        isExporting={isExporting}
      />

      {/* Main App Layout: Left Workspace + Right Control Panel */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Workspace Center Display */}
        <main className="flex-1 bg-stone-200/60 overflow-y-auto p-4 sm:p-6 lg:p-8 flex items-center justify-center min-h-[500px]">
          <div className="w-full max-w-2xl flex flex-col items-center">
            <PosterCanvas
              templateId={templateId}
              slots={slots}
              textConfig={textConfig}
              posterSettings={posterSettings}
              activeSlotIndex={activeSlotIndex}
              onSelectSlot={(index) => setActiveSlotIndex(index)}
              onSlotImageChange={handleSlotImageChange}
              onOpenCropModal={(slot, index) => setEditingSlot({ slot, index })}
              posterRef={posterRef}
            />

            <p className="text-xs text-stone-500 mt-3 text-center">
              💡 Bấm vào từng khung ảnh để thay đổi hoặc tùy chỉnh vị trí. Dùng menu bên phải để sửa tên dâu rể & ngày cưới.
            </p>
          </div>
        </main>

        {/* Right Editor Controls Sidebar */}
        <EditorSidebar
          templateId={templateId}
          onChangeTemplate={handleTemplateChange}
          textConfig={textConfig}
          onChangeTextConfig={setTextConfig}
          posterSettings={posterSettings}
          onChangePosterSettings={setPosterSettings}
        />
      </div>

      {/* Modals */}
      {editingSlot && (
        <PhotoCropModal
          slot={editingSlot.slot}
          slotIndex={editingSlot.index}
          onClose={() => setEditingSlot(null)}
          onUpdateSlot={handleUpdateSlot}
          onRemovePhoto={handleRemovePhoto}
        />
      )}

      <BatchUploadModal
        isOpen={isBatchUploadOpen}
        onClose={() => setIsBatchUploadOpen(false)}
        onApplyPhotos={handleApplyBatchPhotos}
        currentSlotsCount={slots.length}
      />
    </div>
  );
}
