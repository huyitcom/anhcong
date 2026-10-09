import React, { useState, useEffect } from 'react';
import { FrameSlot } from '../types';
import { PHOTO_FILTERS } from '../data/constants';
import {
  X,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Trash2,
  Sliders,
  Check,
  Sparkles,
  SunMedium,
  Flame,
  RefreshCw,
  Undo2,
  Download,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useAuth } from '../lib/AuthContext';
import { TopupCreditsModal } from './TopupCreditsModal';
import { LIGHTING_RESTORATION_PROMPT } from '../data/lightingRestorationPrompt';
import { HIGHLIGHT_RESTORATION_PROMPT } from '../data/highlightRestorationPrompt';
import { parseApiResponse, compressImageForAi } from '../utils/apiHelper';

interface PhotoCropModalProps {
  slot: FrameSlot | null;
  slotIndex: number;
  onClose: () => void;
  onUpdateSlot: (updated: FrameSlot) => void;
  onRemovePhoto: (id: string) => void;
  onOpenAIBackground?: (slotIndex: number) => void;
}

// Calculate closest Gemini supported aspect ratio from width and height
const getClosestGeminiAspectRatio = (width: number, height: number): '1:1' | '3:4' | '4:3' | '9:16' | '16:9' => {
  if (!width || !height || height <= 0) return '3:4';
  const ratio = width / height;
  const candidates: { key: '1:1' | '3:4' | '4:3' | '9:16' | '16:9'; val: number }[] = [
    { key: '9:16', val: 9 / 16 }, // 0.5625 (dọc 9:16)
    { key: '3:4', val: 3 / 4 },   // 0.75 (dọc chuẩn 3:4)
    { key: '1:1', val: 1.0 },     // 1.0 (vuông 1:1)
    { key: '4:3', val: 4 / 3 },   // 1.3333 (ngang chuẩn 4:3 / 3:2)
    { key: '16:9', val: 16 / 9 }, // 1.7778 (ngang rộng 16:9)
  ];
  let closest = candidates[0].key;
  let minDiff = Math.abs(ratio - candidates[0].val);
  for (const c of candidates) {
    const diff = Math.abs(ratio - c.val);
    if (diff < minDiff) {
      minDiff = diff;
      closest = c.key;
    }
  }
  return closest;
};

const getImageDimensions = (src: string): Promise<{ width: number; height: number }> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
    img.onerror = () => resolve({ width: 0, height: 0 });
    img.src = src;
  });
};

const RESTORATION_CREDIT_COSTS: Record<'1K' | '2K' | '4K', number> = {
  '1K': 1,
  '2K': 2,
  '4K': 3,
};

export const PhotoCropModal: React.FC<PhotoCropModalProps> = ({
  slot,
  slotIndex,
  onClose,
  onUpdateSlot,
  onRemovePhoto,
  onOpenAIBackground,
}) => {
  if (!slot || !slot.imageUri) return null;

  const { currentUser, userProfile, loginWithGoogle, consumeCredits } = useAuth();
  const currentCredits = userProfile?.credits ?? 0;

  // Selected Resolution for AI restoration (Default 1K = 1 credit)
  const [selectedResolution, setSelectedResolution] = useState<'1K' | '2K' | '4K'>('1K');

  // Natural Aspect Ratio Detection
  const [naturalAspectRatio, setNaturalAspectRatio] = useState<number>(3 / 4);

  useEffect(() => {
    if (slot?.imageUri) {
      const img = new Image();
      img.src = slot.imageUri;
      img.onload = () => {
        if (img.naturalWidth && img.naturalHeight) {
          setNaturalAspectRatio(img.naturalWidth / img.naturalHeight);
        }
      };
    }
  }, [slot?.imageUri]);

  // AI Restoration States
  const [isRestoringLighting, setIsRestoringLighting] = useState<boolean>(false);
  const [isRestoringHighlight, setIsRestoringHighlight] = useState<boolean>(false);
  const [restoredType, setRestoredType] = useState<'lighting' | 'highlight' | null>(null);
  const [restorationStep, setRestorationStep] = useState<number>(1);
  const [originalImageBeforeRestore, setOriginalImageBeforeRestore] = useState<string | null>(null);
  const [restorationToast, setRestorationToast] = useState<string | null>(null);
  const [restorationError, setRestorationError] = useState<string | null>(null);
  const [isTopupOpen, setIsTopupOpen] = useState<boolean>(false);

  const currentFilter = PHOTO_FILTERS.find((f) => f.id === slot.filter) || PHOTO_FILTERS[0];
  const posX = Math.max(0, Math.min(100, 50 + (slot.offsetX || 0)));
  const posY = Math.max(0, Math.min(100, 50 + (slot.offsetY || 0)));

  // Account for user rotation when computing effective aspect ratio
  const isRotated90 = (slot.rotation || 0) % 180 !== 0;
  const effectiveRatio = isRotated90 ? 1 / naturalAspectRatio : naturalAspectRatio;

  const handleZoomChange = (newZoom: number) => {
    const zoom = Math.min(Math.max(newZoom, 1), 3);
    onUpdateSlot({ ...slot, zoom });
  };

  const handleOffsetChange = (axis: 'X' | 'Y', value: number) => {
    if (axis === 'X') {
      onUpdateSlot({ ...slot, offsetX: value });
    } else {
      onUpdateSlot({ ...slot, offsetY: value });
    }
  };

  const handleRotate = () => {
    const currentRot = slot.rotation || 0;
    const nextRot = (currentRot + 90) % 360;
    onUpdateSlot({ ...slot, rotation: nextRot });
  };

  // AI Exposure & Lighting Restoration Handler (Cứu Sáng)
  const handleRestoreLighting = async () => {
    if (!slot || !slot.imageUri) return;

    let activeCredits = currentCredits;

    // 1. Check Login
    if (!currentUser) {
      setRestorationError(null);
      try {
        const profile = await loginWithGoogle();
        if (!profile) {
          setRestorationError('Vui lòng hoàn tất đăng nhập Google để nhận 3 lượt AI miễn phí!');
          return;
        }
        activeCredits = profile.credits ?? 3;
      } catch (err: any) {
        setRestorationError('Lỗi đăng nhập: ' + (err?.message || 'Không thể đăng nhập Google'));
        return;
      }
    }

    // 2. Check Credits (dynamic based on selected resolution)
    const cost = RESTORATION_CREDIT_COSTS[selectedResolution];
    if (activeCredits < cost) {
      setRestorationError(
        `Bạn hiện có ${activeCredits} lượt AI. Gói phân giải ${selectedResolution} cần ${cost} lượt. Vui lòng nạp thêm để tiếp tục!`
      );
      setIsTopupOpen(true);
      return;
    }

    setIsRestoringLighting(true);
    setRestorationError(null);
    setRestorationStep(1);

    const stepInterval = setInterval(() => {
      setRestorationStep((prev) => (prev < 3 ? prev + 1 : prev));
    }, 2800);

    try {
      // Detect real dimensions of source image to preserve horizontal/vertical orientation
      const dims = await getImageDimensions(slot.imageUri);
      const chosenAspectRatio = (dims.width > 0 && dims.height > 0)
        ? getClosestGeminiAspectRatio(dims.width, dims.height)
        : (effectiveRatio > 1.15 ? '4:3' : (effectiveRatio < 0.85 ? '3:4' : '1:1'));

      // Optimize image payload to stay well within Vercel's 4.5MB limit
      const optimizedImage = await compressImageForAi(slot.imageUri);

      const clientApiKey = (((import.meta as any).env?.VITE_GEMINI_API_KEY as string) || '').trim();

      const res = await fetch('/api/ai/restore-lighting', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(clientApiKey ? { 'x-gemini-api-key': clientApiKey } : {}),
        },
        body: JSON.stringify({
          image: optimizedImage,
          prompt: LIGHTING_RESTORATION_PROMPT,
          imageSize: selectedResolution,
          aspectRatio: chosenAspectRatio,
          apiKey: clientApiKey || undefined,
        }),
      });

      const data = await parseApiResponse(res);
      clearInterval(stepInterval);

      if (!res.ok || !data.success) {
        throw new Error(data.message || data.error || 'Cứu sáng thất bại.');
      }

      // Deduct credit
      await consumeCredits(cost, selectedResolution, 'Cứu sáng ảnh cưới');

      // Save original image for undo
      if (!originalImageBeforeRestore) {
        setOriginalImageBeforeRestore(slot.imageUri);
      }
      setRestoredType('lighting');

      // Update slot image
      onUpdateSlot({
        ...slot,
        imageUri: data.imageUrl,
      });

      confetti({
        particleCount: 60,
        spread: 60,
        origin: { y: 0.6 },
      });

      setRestorationToast('Cứu sáng thành công! Vùng tối và chi tiết ảnh đã được phục hồi tự nhiên.');
      setTimeout(() => setRestorationToast(null), 4500);
    } catch (err: any) {
      clearInterval(stepInterval);
      setRestorationError(
        err?.message || 'Không thể kết nối đến máy chủ AI Cứu Sáng. Vui lòng thử lại sau.'
      );
    } finally {
      setIsRestoringLighting(false);
    }
  };

  // AI Overexposure & Highlight Restoration Handler (Cứu Cháy)
  const handleRestoreHighlight = async () => {
    if (!slot || !slot.imageUri) return;

    let activeCredits = currentCredits;

    // 1. Check Login
    if (!currentUser) {
      setRestorationError(null);
      try {
        const profile = await loginWithGoogle();
        if (!profile) {
          setRestorationError('Vui lòng hoàn tất đăng nhập Google để nhận 3 lượt AI miễn phí!');
          return;
        }
        activeCredits = profile.credits ?? 3;
      } catch (err: any) {
        setRestorationError('Lỗi đăng nhập: ' + (err?.message || 'Không thể đăng nhập Google'));
        return;
      }
    }

    // 2. Check Credits (dynamic based on selected resolution)
    const cost = RESTORATION_CREDIT_COSTS[selectedResolution];
    if (activeCredits < cost) {
      setRestorationError(
        `Bạn hiện có ${activeCredits} lượt AI. Gói phân giải ${selectedResolution} cần ${cost} lượt. Vui lòng nạp thêm để tiếp tục!`
      );
      setIsTopupOpen(true);
      return;
    }

    setIsRestoringHighlight(true);
    setRestorationError(null);
    setRestorationStep(1);

    const stepInterval = setInterval(() => {
      setRestorationStep((prev) => (prev < 3 ? prev + 1 : prev));
    }, 2800);

    try {
      // Detect real dimensions of source image to preserve horizontal/vertical orientation
      const dims = await getImageDimensions(slot.imageUri);
      const chosenAspectRatio = (dims.width > 0 && dims.height > 0)
        ? getClosestGeminiAspectRatio(dims.width, dims.height)
        : (effectiveRatio > 1.15 ? '4:3' : (effectiveRatio < 0.85 ? '3:4' : '1:1'));

      // Optimize image payload to stay well within Vercel's 4.5MB limit
      const optimizedImage = await compressImageForAi(slot.imageUri);

      const clientApiKey = (((import.meta as any).env?.VITE_GEMINI_API_KEY as string) || '').trim();

      const res = await fetch('/api/ai/restore-lighting', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(clientApiKey ? { 'x-gemini-api-key': clientApiKey } : {}),
        },
        body: JSON.stringify({
          image: optimizedImage,
          prompt: HIGHLIGHT_RESTORATION_PROMPT,
          imageSize: selectedResolution,
          aspectRatio: chosenAspectRatio,
          apiKey: clientApiKey || undefined,
        }),
      });

      const data = await parseApiResponse(res);
      clearInterval(stepInterval);

      if (!res.ok || !data.success) {
        throw new Error(data.message || data.error || 'Cứu cháy thất bại.');
      }

      // Deduct credit
      await consumeCredits(cost, selectedResolution, 'Cứu cháy ảnh cưới');

      // Save original image for undo
      if (!originalImageBeforeRestore) {
        setOriginalImageBeforeRestore(slot.imageUri);
      }
      setRestoredType('highlight');

      // Update slot image
      onUpdateSlot({
        ...slot,
        imageUri: data.imageUrl,
      });

      confetti({
        particleCount: 60,
        spread: 60,
        origin: { y: 0.6 },
      });

      setRestorationToast('Cứu cháy thành công! Vùng cháy sáng và chi tiết ảnh đã được phục hồi tự nhiên.');
      setTimeout(() => setRestorationToast(null), 4500);
    } catch (err: any) {
      clearInterval(stepInterval);
      setRestorationError(
        err?.message || 'Không thể kết nối đến máy chủ AI Cứu Cháy. Vui lòng thử lại sau.'
      );
    } finally {
      setIsRestoringHighlight(false);
    }
  };

  // Undo / Revert to original photo before restoration
  const handleUndoRestore = () => {
    if (!originalImageBeforeRestore) return;
    onUpdateSlot({
      ...slot,
      imageUri: originalImageBeforeRestore,
    });
    setOriginalImageBeforeRestore(null);
    setRestoredType(null);
    setRestorationToast('Đã khôi phục lại ảnh ban đầu trước khi sửa AI.');
    setTimeout(() => setRestorationToast(null), 3000);
  };

  // Download restored image directly
  const handleDownloadRestored = () => {
    if (!slot || !slot.imageUri) return;
    const link = document.createElement('a');
    link.href = slot.imageUri;
    link.download = `AI_${restoredType === 'highlight' ? 'Cuu_Chay' : 'Cuu_Sang'}_${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const isRestoring = isRestoringLighting || isRestoringHighlight;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
        <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-full flex flex-col overflow-hidden border border-stone-200">
          {/* Header */}
          <div className="shrink-0 flex items-center justify-between px-4 sm:px-6 py-4 border-b border-stone-100 bg-stone-50/50">
            <div className="flex items-center gap-2">
              <Sliders className="w-5 h-5 text-sky-600" />
              <h3 className="font-semibold text-stone-800 text-base sm:text-lg">
                Chỉnh Sửa Ảnh Khung #{slotIndex + 1}
              </h3>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-full transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Success Toast Banner */}
          {restorationToast && (
            <div className="bg-emerald-500 text-white px-5 py-2 text-xs font-semibold flex items-center justify-between shadow-inner">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                <span>{restorationToast}</span>
              </div>
              <button
                onClick={() => setRestorationToast(null)}
                className="text-white/80 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Error Banner */}
          {restorationError && (
            <div className="bg-rose-50 border-b border-rose-200 px-4 sm:px-6 py-2 text-xs font-medium text-rose-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{restorationError}</span>
              </div>
              <button
                onClick={() => setRestorationError(null)}
                className="text-rose-600 hover:text-rose-900 text-xs underline ml-2 cursor-pointer"
              >
                Đóng
              </button>
            </div>
          )}

          <div className="flex-1 overflow-y-auto p-4 sm:p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
              {/* Preview Container (Cột Trái) */}
              <div className="flex flex-col items-center w-full">
                <div
                  className="relative w-full max-w-[360px] bg-stone-900 rounded-xl overflow-hidden shadow-inner flex items-center justify-center group border border-stone-200 transition-all duration-200 mx-auto"
                  style={{
                    aspectRatio: `${effectiveRatio}`,
                    maxHeight: '380px',
                  }}
                >
                  <img
                    src={slot.imageUri}
                    alt={`Slot ${slotIndex + 1}`}
                    className={`w-full h-full object-cover transition duration-200 ${
                      isRestoring ? 'brightness-50 blur-xs scale-105' : ''
                    }`}
                    style={{
                      objectPosition: `${posX}% ${posY}%`,
                      transform: `scale(${slot.zoom}) rotate(${slot.rotation || 0}deg)`,
                      transformOrigin: `${posX}% ${posY}%`,
                      filter: currentFilter.css,
                    }}
                  />

                  {/* AI Restoration Loading Overlay */}
                  {isRestoring && (
                    <div className="absolute inset-0 bg-black/65 backdrop-blur-xs flex flex-col items-center justify-center p-4 text-white text-center z-30">
                      <div className="relative mb-3">
                        <div
                          className={`w-12 h-12 rounded-full border-4 ${
                            isRestoringHighlight
                              ? 'border-rose-400/30 border-t-rose-500'
                              : 'border-amber-400/30 border-t-amber-400'
                          } animate-spin`}
                        />
                        {isRestoringHighlight ? (
                          <Flame className="w-6 h-6 text-rose-400 absolute inset-0 m-auto animate-pulse" />
                        ) : (
                          <SunMedium className="w-6 h-6 text-amber-300 absolute inset-0 m-auto animate-pulse" />
                        )}
                      </div>
                      <h4
                        className={`font-bold text-xs sm:text-sm mb-1 ${
                          isRestoringHighlight ? 'text-rose-200' : 'text-amber-200'
                        }`}
                      >
                        {isRestoringHighlight
                          ? 'AI Đang Cứu Cháy & Cân Bằng Vùng Sáng...'
                          : 'AI Đang Cứu Sáng & Khôi Phục Vùng Tối...'}
                      </h4>
                      <p className="text-[11px] text-stone-300 leading-relaxed max-w-[220px]">
                        {isRestoringHighlight ? (
                          <>
                            {restorationStep === 1 && '1/3: Chuẩn đoán vùng cháy sáng & độ tương phản...'}
                            {restorationStep === 2 && '2/3: Phục hồi chi tiết váy cưới, da và cảnh...'}
                            {restorationStep >= 3 && '3/3: Cân bằng màu sắc & dải tương phản tự nhiên...'}
                          </>
                        ) : (
                          <>
                            {restorationStep === 1 && '1/3: Phân tích vùng tối & độ phơi sáng...'}
                            {restorationStep === 2 && '2/3: Nâng sáng tự nhiên, bảo toàn chi tiết...'}
                            {restorationStep >= 3 && '3/3: Cân bằng dải màu & hoàn thiện ảnh...'}
                          </>
                        )}
                      </p>
                    </div>
                  )}

                  <div className="absolute top-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded-md backdrop-blur-sm pointer-events-none">
                    Thu Phóng: {Math.round(slot.zoom * 100)}%
                  </div>

                  {originalImageBeforeRestore && !isRestoring && (
                    <div
                      className={`absolute top-2 left-2 text-white font-bold text-[10px] px-2 py-0.5 rounded-full shadow-md flex items-center gap-1 ${
                        restoredType === 'highlight'
                          ? 'bg-rose-600'
                          : 'bg-amber-500 text-stone-950'
                      }`}
                    >
                      {restoredType === 'highlight' ? (
                        <>
                          <Flame className="w-3 h-3 text-white" />
                          <span>Đã Cứu Cháy AI</span>
                        </>
                      ) : (
                        <>
                          <SunMedium className="w-3 h-3" />
                          <span>Đã Cứu Sáng AI</span>
                        </>
                      )}
                    </div>
                  )}
                </div>

                {/* Actions after AI restoration: Tải file & Ảnh gốc (Đặt dưới ảnh preview) */}
                {originalImageBeforeRestore && !isRestoring && (
                  <div className="w-full max-w-[360px] flex items-center gap-2 mt-3 animate-fade-in">
                    <button
                      type="button"
                      onClick={handleDownloadRestored}
                      className="flex-1 py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs flex items-center justify-center gap-1.5 transition cursor-pointer active:scale-95"
                    >
                      <Download className="w-4 h-4" />
                      <span>Tải file</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleUndoRestore}
                      className="py-2.5 px-3 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold rounded-xl border border-stone-200 flex items-center justify-center gap-1.5 transition cursor-pointer active:scale-95"
                      title="Khôi phục lại ảnh ban đầu"
                    >
                      <Undo2 className="w-3.5 h-3.5" />
                      <span>Ảnh gốc</span>
                    </button>
                  </div>
                )}

                <p className="text-xs text-stone-400 mt-2 text-center">
                  Mẹo: Dùng các thanh kéo bên dưới để căn chỉnh vị trí ảnh hoàn hảo.
                </p>
              </div>

              {/* Adjustments Panel (Cột Phải) */}
              <div className="space-y-4">
                {/* AI Tools Section */}
                <div className="space-y-2">
                  {/* Tùy chọn Độ phân giải */}
                  <div className="flex items-center justify-between bg-stone-50 border border-stone-200/90 rounded-xl p-2 px-2.5">
                    <span className="text-[11px] font-semibold text-stone-700">Độ phân giải:</span>
                    <div className="flex items-center gap-1">
                      {(['1K', '2K', '4K'] as const).map((res) => {
                        const resCost = RESTORATION_CREDIT_COSTS[res];
                        const isSelected = selectedResolution === res;
                        return (
                          <button
                            key={res}
                            type="button"
                            onClick={() => setSelectedResolution(res)}
                            className={`px-2 py-0.5 rounded-lg text-[11px] font-semibold transition cursor-pointer ${
                              isSelected
                                ? 'bg-amber-600 text-white shadow-xs'
                                : 'bg-white border border-stone-200 text-stone-600 hover:bg-stone-100 hover:text-stone-900'
                            }`}
                          >
                            <span>{res}</span>
                            <span className={`ml-1 text-[10px] ${isSelected ? 'text-amber-100' : 'text-stone-400'}`}>
                              ({resCost} lượt)
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Row 1: Cứu Sáng & Cứu Cháy Buttons (Clean & Minimal) */}
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      disabled={isRestoring}
                      onClick={handleRestoreLighting}
                      className="py-2.5 px-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white text-xs font-bold rounded-xl shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 active:scale-95"
                    >
                      {isRestoringLighting ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>Đang cứu sáng...</span>
                        </>
                      ) : (
                        <>
                          <SunMedium className="w-4 h-4" />
                          <span>Cứu Sáng</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      disabled={isRestoring}
                      onClick={handleRestoreHighlight}
                      className="py-2.5 px-3 bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-600 hover:to-red-700 text-white text-xs font-bold rounded-xl shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 active:scale-95"
                    >
                      {isRestoringHighlight ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>Đang cứu cháy...</span>
                        </>
                      ) : (
                        <>
                          <Flame className="w-4 h-4" />
                          <span>Cứu Cháy</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Thay Nền Bằng AI Action Button */}
                  {onOpenAIBackground && (
                    <div className="bg-gradient-to-r from-sky-50 via-indigo-50/50 to-purple-50 p-2.5 rounded-2xl border border-sky-100/80 flex items-center justify-between gap-2 shadow-2xs">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-sky-600 to-indigo-600 flex items-center justify-center text-white shrink-0 shadow-xs">
                          <Sparkles className="w-3.5 h-3.5" />
                        </div>
                        <div className="text-xs font-bold text-stone-800">
                          Thay Nền Bằng AI
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          onOpenAIBackground(slotIndex);
                        }}
                        className="bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold px-3 py-1.5 rounded-xl shadow-2xs transition shrink-0 cursor-pointer"
                      >
                        Thay Nền
                      </button>
                    </div>
                  )}
                </div>

                {/* Zoom Slider */}
                <div>
                  <div className="flex items-center justify-between text-sm font-medium text-stone-700 mb-1.5">
                    <span className="flex items-center gap-1.5">
                      <ZoomIn className="w-4 h-4 text-stone-500" />
                      Mức Thu Phóng (Zoom)
                    </span>
                    <span className="text-stone-500 text-xs">{slot.zoom.toFixed(1)}x</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleZoomChange(slot.zoom - 0.1)}
                      className="p-1.5 text-stone-500 hover:bg-stone-100 rounded-lg border border-stone-200 cursor-pointer"
                    >
                      <ZoomOut className="w-4 h-4" />
                    </button>
                    <input
                      type="range"
                      min="1"
                      max="3"
                      step="0.05"
                      value={slot.zoom}
                      onChange={(e) => handleZoomChange(parseFloat(e.target.value))}
                      className="w-full accent-sky-600 h-1.5 bg-stone-200 rounded-lg cursor-pointer"
                    />
                    <button
                      onClick={() => handleZoomChange(slot.zoom + 0.1)}
                      className="p-1.5 text-stone-500 hover:bg-stone-100 rounded-lg border border-stone-200 cursor-pointer"
                    >
                      <ZoomIn className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Position X Offset */}
                <div>
                  <div className="flex items-center justify-between text-sm font-medium text-stone-700 mb-1.5">
                    <span>Vị trí ngang (Trái / Phải)</span>
                    <span className="text-stone-500 text-xs">{slot.offsetX}%</span>
                  </div>
                  <input
                    type="range"
                    min="-50"
                    max="50"
                    step="1"
                    value={slot.offsetX}
                    onChange={(e) => handleOffsetChange('X', parseInt(e.target.value))}
                    className="w-full accent-sky-600 h-1.5 bg-stone-200 rounded-lg cursor-pointer"
                  />
                </div>

                {/* Position Y Offset */}
                <div>
                  <div className="flex items-center justify-between text-sm font-medium text-stone-700 mb-1.5">
                    <span>Vị trí dọc (Lên / Xuống)</span>
                    <span className="text-stone-500 text-xs">{slot.offsetY}%</span>
                  </div>
                  <input
                    type="range"
                    min="-50"
                    max="50"
                    step="1"
                    value={slot.offsetY}
                    onChange={(e) => handleOffsetChange('Y', parseInt(e.target.value))}
                    className="w-full accent-sky-600 h-1.5 bg-stone-200 rounded-lg cursor-pointer"
                  />
                </div>

                {/* Rotation & Reset */}
                <div className="flex items-center gap-2 pt-2">
                  <button
                    onClick={handleRotate}
                    className="flex-1 flex items-center justify-center gap-2 py-2 px-3 text-xs font-medium text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-xl transition cursor-pointer"
                  >
                    <RotateCw className="w-3.5 h-3.5" />
                    Xoay 90°
                  </button>
                  <button
                    onClick={() => onUpdateSlot({ ...slot, zoom: 1, offsetX: 0, offsetY: 0, rotation: 0 })}
                    className="py-2 px-3 text-xs font-medium text-stone-500 hover:text-stone-800 bg-stone-50 hover:bg-stone-100 rounded-xl border border-stone-200 transition cursor-pointer"
                  >
                    Đặt lại ban đầu
                  </button>
                </div>

                {/* Photo Filters */}
                <div>
                  <label className="block text-xs font-medium text-stone-700 mb-2">
                    Bộ Lọc Màu Nghệ Thuật
                  </label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {PHOTO_FILTERS.map((f) => (
                      <button
                        key={f.id}
                        onClick={() => onUpdateSlot({ ...slot, filter: f.id })}
                        className={`px-2 py-1.5 text-xs rounded-lg border text-center transition truncate cursor-pointer ${
                          slot.filter === f.id
                            ? 'border-sky-600 bg-sky-50 text-sky-800 font-medium'
                            : 'border-stone-200 hover:border-stone-300 text-stone-600'
                        }`}
                      >
                        {f.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="shrink-0 flex items-center justify-between px-4 sm:px-6 py-4 bg-stone-50 border-t border-stone-100">
            <button
              onClick={() => {
                onRemovePhoto(slot.id);
                onClose();
              }}
              className="flex items-center gap-1.5 text-xs font-medium text-red-600 hover:text-red-700 px-3 py-2 rounded-lg hover:bg-red-50 transition cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
              <span className="hidden sm:inline">Xóa ảnh khỏi khung</span>
              <span className="sm:hidden">Xóa ảnh</span>
            </button>
            <button
              onClick={onClose}
              className="flex items-center gap-2 bg-stone-900 hover:bg-black text-white text-sm font-medium px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl shadow-sm transition cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span className="hidden sm:inline">Hoàn Tất Chỉnh Sửa</span>
              <span className="sm:hidden">Xong</span>
            </button>
          </div>
        </div>
      </div>

      {/* Topup Credits Modal */}
      <TopupCreditsModal
        isOpen={isTopupOpen}
        onClose={() => setIsTopupOpen(false)}
        requiredCredits={1}
      />
    </>
  );
};
