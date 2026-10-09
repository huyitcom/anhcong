import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  X,
  Upload,
  UploadCloud,
  Check,
  RefreshCw,
  Download,
  AlertCircle,
  Search,
  ArrowRight,
  Wand2,
  ShieldCheck,
  Zap,
  LogIn,
  CreditCard,
  PlusCircle,
  CheckCircle2,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { FrameSlot } from '../types';
import { useAuth } from '../lib/AuthContext';
import { TopupCreditsModal } from './TopupCreditsModal';
import { useBackgroundTemplates } from '../lib/backgroundTemplatesService';
import { parseApiResponse, compressImageForAi } from '../utils/apiHelper';

interface AIBackgroundModalProps {
  isOpen: boolean;
  onClose: () => void;
  slots: FrameSlot[];
  initialSlotIndex?: number;
  initialTemplateId?: string;
  onApplyImageToSlot: (slotIndex: number, newImageUrl: string) => void;
}

const CREDIT_COSTS: Record<'1K' | '2K' | '4K', number> = {
  '1K': 1,
  '2K': 2,
  '4K': 3,
};

// Calculate closest Gemini supported aspect ratio from width and height
const getClosestGeminiAspectRatio = (width: number, height: number): '1:1' | '3:4' | '4:3' | '9:16' | '16:9' => {
  if (!width || !height || height <= 0) return '3:4';
  const ratio = width / height;
  const candidates: { key: '1:1' | '3:4' | '4:3' | '9:16' | '16:9'; val: number }[] = [
    { key: '9:16', val: 9 / 16 }, // 0.5625
    { key: '3:4', val: 3 / 4 },   // 0.75
    { key: '1:1', val: 1.0 },     // 1.0
    { key: '4:3', val: 4 / 3 },   // 1.3333
    { key: '16:9', val: 16 / 9 }, // 1.7778
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

export const AIBackgroundModal: React.FC<AIBackgroundModalProps> = ({
  isOpen,
  onClose,
  slots,
  initialSlotIndex = 0,
  initialTemplateId,
  onApplyImageToSlot,
}) => {
  const { currentUser, userProfile, loginWithGoogle, consumeCredits, authError, clearAuthError } = useAuth();
  const { activeTemplates, categories } = useBackgroundTemplates();

  const [selectedSlotIndex, setSelectedSlotIndex] = useState<number>(initialSlotIndex);
  const [customImage, setCustomImage] = useState<string | null>(null);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(
    initialTemplateId || activeTemplates[0]?.id || 'floral-arch-door'
  );
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Drag and Drop & Login Feedback States
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [isLoggingIn, setIsLoggingIn] = useState<boolean>(false);

  // Generation & Quality States
  const [selectedResolution, setSelectedResolution] = useState<'1K' | '2K' | '4K'>('2K');
  const [preserveFraming, setPreserveFraming] = useState<boolean>(true);
  const [generatedResolution, setGeneratedResolution] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generationStep, setGenerationStep] = useState<number>(1);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isQuotaError, setIsQuotaError] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<'result' | 'compare'>('result');
  const [renderSuccessToast, setRenderSuccessToast] = useState<string | null>(null);

  // Topup Modal State
  const [isTopupOpen, setIsTopupOpen] = useState<boolean>(false);

  useEffect(() => {
    setSelectedSlotIndex(initialSlotIndex);
    if (initialTemplateId) {
      setSelectedTemplateId(initialTemplateId);
      // Auto-set matching category if applicable
      const matched = activeTemplates.find((t) => t.id === initialTemplateId);
      if (matched && matched.category) {
        setSelectedCategory('all');
      }
      // Smoothly scroll the selected template into view inside the grid
      setTimeout(() => {
        const el = document.getElementById(`ai-tmpl-card-${initialTemplateId}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
      }, 150);
    }
  }, [initialSlotIndex, initialTemplateId, isOpen, activeTemplates]);

  if (!isOpen) return null;

  const activeSlot = slots[selectedSlotIndex];
  const sourceImage = customImage || activeSlot?.imageUri || null;
  const currentCredits = userProfile?.credits ?? 0;
  const cost = CREDIT_COSTS[selectedResolution];

  // Filtered Templates
  const filteredTemplates = activeTemplates.filter((tmpl) => {
    const matchCategory =
      selectedCategory === 'all' || tmpl.category === selectedCategory;
    const matchSearch =
      tmpl.name_vn.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tmpl.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCategory && matchSearch;
  });

  const selectedTemplate =
    activeTemplates.find((t) => t.id === selectedTemplateId) ||
    activeTemplates[0];

  const handleFileProcess = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setErrorMsg('Vui lòng chọn tệp định dạng hình ảnh (JPG, PNG, WebP).');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setCustomImage(reader.result);
        setGeneratedImage(null);
        setErrorMsg(null);
      }
    };
    reader.readAsDataURL(file);
  };

  // Handle local file upload via input
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileProcess(file);
  };

  // Drag & drop handlers
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleFileProcess(files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDragging) setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  // Trigger AI Background Replacement
  const handleGenerateAI = async () => {
    let activeCredits = currentCredits;

    // 1. Check Login: if not logged in, trigger Google login directly with instant feedback
    if (!currentUser) {
      setErrorMsg(null);
      if (clearAuthError) clearAuthError();
      try {
        setIsLoggingIn(true);
        const profile = await loginWithGoogle();
        if (!profile) {
          setErrorMsg('Vui lòng hoàn tất đăng nhập Google để nhận 3 lượt render AI miễn phí!');
          return;
        }
        setRenderSuccessToast('Đăng nhập thành công! Bạn nhận được 3 lượt render miễn phí.');
        setTimeout(() => setRenderSuccessToast(null), 4000);
        activeCredits = profile.credits ?? 3;
      } catch (err: any) {
        setErrorMsg('Lỗi đăng nhập: ' + (err?.message || 'Không thể đăng nhập Google'));
        return;
      } finally {
        setIsLoggingIn(false);
      }
    }

    if (!sourceImage) {
      setErrorMsg('Vui lòng kéo thả hoặc tải ảnh cô dâu chú rể ở khung bên trái trước khi ghép phông.');
      return;
    }

    // 2. Check Credits
    if (activeCredits < cost) {
      setErrorMsg(
        `Bạn hiện có ${activeCredits} lượt render, trong khi độ phân giải ${selectedResolution} cần ${cost} lượt. Vui lòng nạp thêm lượt để tiếp tục!`
      );
      setIsTopupOpen(true);
      return;
    }

    setIsGenerating(true);
    setGeneratedImage(null);
    setErrorMsg(null);
    setIsQuotaError(false);
    setGenerationStep(1);
    setRenderSuccessToast(null);

    const stepInterval = setInterval(() => {
      setGenerationStep((prev) => (prev < 3 ? prev + 1 : prev));
    }, 3200);

    try {
      // Detect real dimensions of source image to preserve horizontal/vertical orientation
      const dims = await getImageDimensions(sourceImage);
      const chosenAspectRatio = (dims.width > 0 && dims.height > 0)
        ? getClosestGeminiAspectRatio(dims.width, dims.height)
        : '3:4';

      // Optimize image payload to stay well within Vercel's 4.5MB limit
      const optimizedImage = await compressImageForAi(sourceImage);

      const res = await fetch('/api/ai/replace-background', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: optimizedImage,
          prompt: selectedTemplate.prompt,
          templateName: selectedTemplate.name_vn,
          aspectRatio: chosenAspectRatio,
          imageSize: selectedResolution,
          preserveFraming: preserveFraming,
          userId: currentUser?.uid || '',
          userEmail: currentUser?.email || '',
        }),
      });

      const data = await parseApiResponse(res);
      clearInterval(stepInterval);

      if (!res.ok || !data.success) {
        throw new Error(data.message || data.error || 'Tạo ảnh thất bại.');
      }

      // Deduct credits
      await consumeCredits(cost, selectedResolution, selectedTemplate.name_vn);

      setGeneratedImage(data.imageUrl);
      setGeneratedResolution(data.resolution || selectedResolution);
      setViewMode('result');

      // Trigger Celebration
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });

      setRenderSuccessToast(
        `Ghép phông thành công! Đã trừ ${cost} lượt (Số dư còn lại: ${Math.max(0, currentCredits - cost)} lượt)`
      );
      setTimeout(() => setRenderSuccessToast(null), 5000);
    } catch (err: any) {
      clearInterval(stepInterval);
      const isQuota =
        err?.message?.includes('RESOURCE_EXHAUSTED') ||
        err?.message?.includes('quota') ||
        err?.message?.includes('Google Cloud') ||
        err?.message?.includes('CONSUMER_SUSPENDED') ||
        err?.message?.includes('tạm dừng');
      setIsQuotaError(Boolean(isQuota));
      setErrorMsg(
        err?.message ||
          'Không thể kết nối đến máy chủ tạo ảnh AI. Vui lòng thử lại sau.'
      );
    } finally {
      setIsGenerating(false);
    }
  };

  // Apply Generated Image to the selected slot
  const handleApplyToSlot = () => {
    if (!generatedImage) return;
    onApplyImageToSlot(selectedSlotIndex, generatedImage);
    onClose();
  };

  // Download AI Image
  const handleDownload = () => {
    if (!generatedImage) return;
    const link = document.createElement('a');
    link.href = generatedImage;
    link.download = `AI_Wedding_Background_${selectedTemplate.id}_${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-2 sm:p-4 lg:p-6 animate-fade-in">
        <div className="bg-white rounded-3xl shadow-2xl max-w-5xl w-full h-[94vh] max-h-[880px] flex flex-col overflow-hidden border border-stone-200">
          {/* Modal Header */}
          <div className="shrink-0 flex items-center justify-between px-4 sm:px-6 py-3.5 border-b border-stone-200 bg-gradient-to-r from-stone-50 via-sky-50/40 to-stone-50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-sky-600 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-sky-500/20">
                <Sparkles className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-stone-800 text-base sm:text-lg leading-snug">
                    Ghép Phông Nền AI
                  </h3>
                </div>
                <p className="text-xs text-stone-500 hidden sm:block">
                  Biến những tấm ảnh trở nên độc đáo chỉ với 1 cick
                </p>
              </div>
            </div>

            {/* Credit Balance & Topup Actions */}
            <div className="flex items-center gap-2">
              {currentUser ? (
                <div className="flex items-center gap-2 bg-amber-50 border border-amber-200/80 px-2.5 sm:px-3 py-1.5 rounded-xl shadow-xs">
                  <div className="flex items-center gap-1.5">
                    <Zap className="w-4 h-4 text-amber-500 fill-amber-500" />
                    <span className="text-xs font-bold text-amber-900">
                      {currentCredits} <span className="text-[11px] font-normal text-amber-700">lượt</span>
                    </span>
                  </div>
                  <button
                    onClick={() => setIsTopupOpen(true)}
                    className="ml-1 px-2 py-0.5 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-slate-950 font-bold text-[10px] rounded-lg shadow-xs flex items-center gap-1 transition-all cursor-pointer"
                  >
                    <PlusCircle className="w-3 h-3" />
                    <span>Nạp</span>
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => loginWithGoogle()}
                  className="px-3 py-1.5 bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-700 hover:to-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Đăng nhập (Nhận 3 lượt free)</span>
                </button>
              )}

              <button
                onClick={onClose}
                className="p-2 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-full transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Unauthenticated notice banner */}
          {!currentUser && (
            <div className="shrink-0 bg-gradient-to-r from-amber-50 via-sky-50 to-indigo-50 border-b border-sky-200/80 px-4 sm:px-6 py-2.5 flex flex-col sm:flex-row items-center justify-between gap-2.5 text-stone-800">
              <div className="flex items-center gap-2.5 text-xs">
                <span className="w-7 h-7 rounded-xl bg-amber-400/20 text-amber-600 flex items-center justify-center font-bold text-sm shrink-0">
                  🎁
                </span>
                <div>
                  <p className="font-bold text-stone-900">
                    Bạn chưa đăng nhập: Tặng ngay 3 lượt Ghép Phông AI miễn phí!
                  </p>
                  <p className="text-[11px] text-stone-600">
                    Đăng nhập bằng tài khoản Google để nhận ngay 3 lượt trải nghiệm công nghệ AI Gemini 2K/4K sắc nét.
                  </p>
                </div>
              </div>
              <button
                type="button"
                disabled={isLoggingIn}
                onClick={async () => {
                  setErrorMsg(null);
                  if (clearAuthError) clearAuthError();
                  try {
                    setIsLoggingIn(true);
                    const res = await loginWithGoogle();
                    if (res) {
                      setRenderSuccessToast('Đăng nhập thành công! Bạn nhận được 3 lượt render miễn phí.');
                      setTimeout(() => setRenderSuccessToast(null), 4000);
                    }
                  } finally {
                    setIsLoggingIn(false);
                  }
                }}
                className="shrink-0 px-3.5 py-1.5 bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-700 hover:to-indigo-700 disabled:opacity-60 text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-1.5 transition cursor-pointer active:scale-95"
              >
                {isLoggingIn ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Đang đăng nhập...</span>
                  </>
                ) : (
                  <>
                    <LogIn className="w-3.5 h-3.5" />
                    <span>Đăng nhập Google ngay</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* Auth Error Banner if login popup had issues */}
          {authError && (
            <div className="shrink-0 bg-rose-50 border-b border-rose-200 px-4 sm:px-6 py-2 text-xs font-medium text-rose-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{authError}</span>
              </div>
              <button
                onClick={() => clearAuthError?.()}
                className="text-rose-600 hover:text-rose-900 text-xs underline ml-2 cursor-pointer"
              >
                Đóng
              </button>
            </div>
          )}

          {/* Success Toast */}
          {renderSuccessToast && (
            <div className="bg-emerald-500 text-white px-5 py-2 text-xs font-semibold flex items-center justify-between shadow-inner">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                <span>{renderSuccessToast}</span>
              </div>
              <button
                onClick={() => setRenderSuccessToast(null)}
                className="text-white/80 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Modal Body */}
          <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
            {/* Left Column: Image Selection & Preview (45%) */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`w-full lg:w-[46%] border-b lg:border-b-0 lg:border-r border-stone-200 p-4 sm:p-5 flex flex-col overflow-y-auto transition ${
                isDragging ? 'bg-sky-50/70 ring-2 ring-inset ring-sky-400' : 'bg-stone-50'
              }`}
            >
              {/* Step 1: Pick Subject Photo */}
              <div className="mb-3 shrink-0">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-stone-700 flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-stone-900 text-white text-[10px] flex items-center justify-center">
                      1
                    </span>
                    Chọn Ảnh Chủ Thể Dâu Rể
                  </label>
                  <label className="text-xs font-semibold text-sky-600 hover:text-sky-700 cursor-pointer flex items-center gap-1">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Tải ảnh mới</span>
                    <input
                      id="ai-photo-upload-input"
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              {/* Main Preview Area */}
              <div className="flex-1 flex flex-col items-center justify-center min-h-[260px]">
                {generatedImage && !isGenerating ? (
                  /* Result View with Compare Option */
                  <div className="w-full flex flex-col items-center">
                    <div className="flex items-center gap-2 mb-2 bg-stone-200/80 p-1 rounded-xl text-xs font-semibold">
                      <button
                        onClick={() => setViewMode('result')}
                        className={`px-3 py-1 rounded-lg transition ${
                          viewMode === 'result'
                            ? 'bg-white text-stone-900 shadow-xs'
                            : 'text-stone-600 hover:text-stone-900'
                        }`}
                      >
                        Kết quả AI ({generatedResolution})
                      </button>
                      <button
                        onClick={() => setViewMode('compare')}
                        className={`px-3 py-1 rounded-lg transition ${
                          viewMode === 'compare'
                            ? 'bg-white text-stone-900 shadow-xs'
                            : 'text-stone-600 hover:text-stone-900'
                        }`}
                      >
                        So sánh Trước / Sau
                      </button>
                    </div>

                    {viewMode === 'result' ? (
                      <div className="relative w-full max-w-[390px] aspect-[3/4] rounded-2xl overflow-hidden shadow-xl border-2 border-emerald-500 bg-black">
                        <img
                          src={generatedImage}
                          alt="AI Background Result"
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute top-2 right-2 bg-emerald-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-md flex items-center gap-1">
                          <Check className="w-3 h-3" />
                          <span>AI {generatedResolution}</span>
                        </div>
                      </div>
                    ) : (
                      <div className="w-full grid grid-cols-2 gap-2">
                        <div className="aspect-[3/4] rounded-xl overflow-hidden border border-stone-300 relative shadow-sm">
                          <img
                            src={sourceImage || ''}
                            alt="Gốc"
                            className="w-full h-full object-cover"
                          />
                          <span className="absolute bottom-1.5 left-1.5 bg-black/70 text-white text-[10px] font-medium px-2 py-0.5 rounded-md">
                            Ảnh gốc
                          </span>
                        </div>
                        <div className="aspect-[3/4] rounded-xl overflow-hidden border-2 border-emerald-500 relative shadow-sm">
                          <img
                            src={generatedImage}
                            alt="AI"
                            className="w-full h-full object-cover"
                          />
                          <span className="absolute bottom-1.5 left-1.5 bg-emerald-600 text-white text-[10px] font-semibold px-2 py-0.5 rounded-md">
                            Nền AI mới
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Actions for generated image */}
                    <div className="flex items-center gap-2 mt-4 w-full max-w-[390px]">
                      <button
                        onClick={handleApplyToSlot}
                        className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm py-2.5 px-4 rounded-xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <Check className="w-4 h-4" />
                        Áp Dụng Vào Ảnh Cổng
                      </button>
                      <button
                        onClick={handleDownload}
                        title="Tải ảnh này về máy"
                        className="p-2.5 border border-stone-300 hover:bg-white text-stone-700 rounded-xl transition cursor-pointer"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Source Photo Preview / Loading State with Drag & Drop */
                  <div className="w-full max-w-[390px] flex flex-col items-center">
                    <div
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      onClick={() => {
                        if (!isGenerating) {
                          const fileInput = document.getElementById('ai-photo-upload-input');
                          if (fileInput) fileInput.click();
                        }
                      }}
                      className={`relative w-full aspect-[3/4] rounded-2xl overflow-hidden shadow-lg border-2 transition cursor-pointer flex items-center justify-center group ${
                        isDragging
                          ? 'border-sky-500 ring-4 ring-sky-400/40 bg-sky-950 scale-[1.02]'
                          : 'border-stone-300 hover:border-sky-400 bg-stone-900'
                      }`}
                    >
                      {/* Drag Active Overlay */}
                      {isDragging && (
                        <div className="absolute inset-0 bg-sky-600/90 backdrop-blur-xs z-30 flex flex-col items-center justify-center p-4 text-white text-center pointer-events-none">
                          <UploadCloud className="w-12 h-12 text-white animate-bounce mb-2" />
                          <p className="font-bold text-sm">Thả ảnh vào đây</p>
                          <p className="text-xs text-sky-100">để dùng làm ảnh dâu rể</p>
                        </div>
                      )}

                      {sourceImage ? (
                        <>
                          <img
                            src={sourceImage}
                            alt="Source subject"
                            className={`w-full h-full object-cover transition duration-300 ${
                              isGenerating ? 'brightness-50 blur-xs scale-105' : ''
                            }`}
                          />
                          {!isGenerating && (
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex flex-col items-center justify-center text-white p-3 text-center pointer-events-none">
                              <Upload className="w-6 h-6 mb-1 text-sky-300" />
                              <span className="text-xs font-bold">Kéo thả hoặc bấm để thay ảnh</span>
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="text-center p-6 text-stone-300 flex flex-col items-center">
                          <UploadCloud className="w-12 h-12 mx-auto mb-2 text-stone-400 group-hover:text-sky-400 transition" />
                          <p className="text-xs font-bold text-white mb-1">Kéo thả ảnh dâu rể vào đây</p>
                          <p className="text-[11px] text-stone-400">hoặc bấm để tải ảnh từ máy tính</p>
                        </div>
                      )}

                      {/* Loading Overlay */}
                      {isGenerating && (
                        <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-white text-center z-20">
                          <div className="relative mb-4">
                            <div className="w-14 h-14 rounded-full border-4 border-sky-400/30 border-t-sky-400 animate-spin" />
                            <Sparkles className="w-6 h-6 text-sky-300 absolute inset-0 m-auto animate-pulse" />
                          </div>
                          <h4 className="font-bold text-sm text-sky-200 mb-1">
                            AI Đang Xử Lý Thay Nền...
                          </h4>
                          <p className="text-xs text-stone-300 leading-relaxed max-w-[220px]">
                            {generationStep === 1 && '1/3: Đang nhận diện và tách chủ thể dâu rể...'}
                            {generationStep === 2 && '2/3: Đang dựng phông nền và khớp phối cảnh...'}
                            {generationStep >= 3 && '3/3: Cân bằng ánh sáng và đổ bóng tự nhiên...'}
                          </p>
                        </div>
                      )}

                      {!isGenerating && sourceImage && !isDragging && (
                        <div className="absolute top-2 left-2 bg-black/60 text-white text-[10px] px-2 py-0.5 rounded-md backdrop-blur-xs">
                          Ảnh gốc chuẩn bị ghép phông
                        </div>
                      )}
                    </div>

                    <p className="text-[11px] text-stone-500 text-center mt-2 flex items-center justify-center gap-1.5">
                      <UploadCloud className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                      <span>Kéo thả ảnh trực tiếp hoặc bấm vào khung để tải ảnh</span>
                    </p>
                  </div>
                )}

                {/* Error Display */}
                {errorMsg && (
                  <div className="mt-3 w-full bg-red-50 border border-red-200 rounded-xl p-3 text-red-700 text-xs flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
                    <div className="flex-1">
                      <p className="font-semibold mb-0.5">Thông báo:</p>
                      <p className="text-stone-600 leading-relaxed">{errorMsg}</p>
                      {isQuotaError && (
                        <p className="mt-1 text-[11px] text-amber-700 font-medium">
                          💡 Gợi ý: Hãy đảm bảo tài khoản Google Cloud đã kích hoạt hạn mức tài nguyên cho mô hình Gemini Image.
                        </p>
                      )}
                      {currentCredits < cost && (
                        <button
                          onClick={() => setIsTopupOpen(true)}
                          className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-lg text-xs shadow-xs"
                        >
                          <CreditCard className="w-3.5 h-3.5" />
                          Nạp Thêm Lượt Bằng Mã VietQR
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Template Library (54%) */}
            <div className="w-full lg:w-[54%] flex flex-col p-4 sm:p-5 overflow-hidden">
              {/* Step 2: Header & Search */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 mb-3">
                <label className="text-xs font-bold uppercase tracking-wider text-stone-700 flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-stone-900 text-white text-[10px] flex items-center justify-center">
                    2
                  </span>
                  Chọn mẫu phông nền ({activeTemplates.length} Mẫu)
                </label>

                {/* Search input */}
                <div className="relative w-full sm:w-48">
                  <Search className="w-3.5 h-3.5 text-stone-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Tìm phông nền..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 text-xs bg-stone-100 rounded-lg border border-stone-200 focus:outline-hidden focus:border-sky-500"
                  />
                </div>
              </div>

              {/* Category Filter Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-2.5 mb-2 hide-scrollbar">
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`shrink-0 px-3 py-1 rounded-full text-xs font-semibold transition cursor-pointer ${
                      selectedCategory === cat.id
                        ? 'bg-sky-600 text-white shadow-xs'
                        : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                    }`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>

              {/* Template Grid */}
              <div className="flex-1 overflow-y-auto pr-1">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {filteredTemplates.map((template) => {
                    const isSelected = selectedTemplateId === template.id;
                    return (
                      <div
                        key={template.id}
                        id={`ai-tmpl-card-${template.id}`}
                        onClick={() => setSelectedTemplateId(template.id)}
                        className={`group relative rounded-2xl overflow-hidden border-2 cursor-pointer transition flex flex-col bg-white shadow-xs ${
                          isSelected
                            ? 'border-sky-600 ring-2 ring-sky-400/40 shadow-md'
                            : 'border-stone-200 hover:border-stone-300'
                        }`}
                      >
                        <div className="aspect-[3/4] overflow-hidden bg-stone-100 relative">
                          <img
                            src={template.thumbnailUrl}
                            alt={template.name_vn}
                            className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                          />
                          {isSelected && (
                            <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-sky-600 text-white flex items-center justify-center shadow-md">
                              <Check className="w-3.5 h-3.5 stroke-[3]" />
                            </div>
                          )}
                        </div>
                        <div className="p-2 text-center bg-white">
                          <h4 className="font-bold text-xs text-stone-800 truncate">
                            {template.name_vn}
                          </h4>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Quality & Credit Costs Options */}
              <div className="shrink-0 bg-stone-50/90 border border-stone-200 rounded-2xl p-3 my-2 space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    <span className="text-xs font-bold text-stone-700">Độ phân giải</span>
                  </div>
                  <div className="grid grid-cols-3 gap-1.5 w-full sm:w-auto">
                    {(['1K', '2K', '4K'] as const).map((res) => {
                      const resCost = CREDIT_COSTS[res];
                      const isSelected = selectedResolution === res;
                      return (
                        <button
                          key={res}
                          type="button"
                          onClick={() => setSelectedResolution(res)}
                          className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition cursor-pointer flex flex-col sm:flex-row items-center justify-center gap-1 ${
                            isSelected
                              ? 'bg-sky-600 text-white border-sky-600 shadow-xs'
                              : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-100'
                          }`}
                        >
                          <span>{res}</span>
                          <span
                            className={`text-[10px] px-1.5 py-0.2 rounded-full font-medium ${
                              isSelected
                                ? 'bg-sky-500/50 text-white'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            -{resCost} lượt
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Face Lock & Framing Checkbox */}
                <label className="flex items-center gap-2.5 cursor-pointer bg-white p-2.5 rounded-xl border border-stone-200 hover:border-emerald-300 transition">
                  <input
                    type="checkbox"
                    checked={preserveFraming}
                    onChange={(e) => setPreserveFraming(e.target.checked)}
                    className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
                  />
                  <div className="flex-1 text-xs">
                    <div className="flex items-center gap-1.5 font-bold text-stone-800">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>Giữ nguyên khuôn mặt và khoảng cách</span>
                      <span className="text-[10px] bg-emerald-100 text-emerald-700 px-1.5 py-0.2 rounded font-semibold shrink-0">
                        Chống biến đổi mặt
                      </span>
                    </div>
                  </div>
                </label>
              </div>

              {/* Bottom Generate Trigger Bar */}
              <div className="shrink-0 pt-2 border-t border-stone-200 flex items-center justify-end gap-3">
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    onClick={onClose}
                    className="px-4 py-2 text-xs font-semibold text-stone-600 hover:text-stone-800 hover:bg-stone-100 rounded-xl transition cursor-pointer"
                  >
                    Đóng
                  </button>

                  <button
                    type="button"
                    onClick={handleGenerateAI}
                    disabled={isGenerating || isLoggingIn}
                    className="flex-1 sm:flex-initial bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-700 hover:to-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed text-white text-xs sm:text-sm font-bold py-2.5 px-6 rounded-xl shadow-md shadow-sky-600/20 transition flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                  >
                    {isLoggingIn ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Đang mở đăng nhập Google...</span>
                      </>
                    ) : isGenerating ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Đang tạo ảnh {selectedResolution} (-{cost} lượt)...</span>
                      </>
                    ) : (
                      <>
                        <Wand2 className="w-4 h-4" />
                        <span>Ghép Ngay ({cost} lượt)</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Topup Credits Modal */}
      <TopupCreditsModal
        isOpen={isTopupOpen}
        onClose={() => setIsTopupOpen(false)}
        requiredCredits={cost}
      />
    </>
  );
};
