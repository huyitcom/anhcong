import React, { useState } from 'react';
import {
  Search,
  Plus,
  Edit,
  Trash2,
  Copy,
  Check,
  Eye,
  EyeOff,
  Sparkles,
  Wand2,
  CheckCircle2,
  AlertCircle,
  Image as ImageIcon,
  Save,
  X,
  FileText,
  User,
  Users,
  Upload,
  UploadCloud,
  RefreshCw,
  Download,
  FlaskConical,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import {
  useBackgroundTemplates,
  ExtendedBackgroundTemplate,
} from '../lib/backgroundTemplatesService';
import {
  BACKGROUND_CATEGORIES,
  createMasterPrompt,
  createPortraitPrompt,
  createFullBodyPrompt,
} from '../data/backgroundTemplates';
import { useAuth } from '../lib/AuthContext';
import { parseApiResponse, compressImageForAi } from '../utils/apiHelper';
import { SAMPLE_WEDDING_PHOTOS } from '../data/constants';

// Helper to determine closest Gemini supported aspect ratio from width and height
const getClosestGeminiAspectRatio = (width: number, height: number): '1:1' | '3:4' | '4:3' | '9:16' | '16:9' => {
  if (!width || !height || height <= 0) return '3:4';
  const ratio = width / height;
  const candidates: { key: '1:1' | '3:4' | '4:3' | '9:16' | '16:9'; val: number }[] = [
    { key: '9:16', val: 9 / 16 },
    { key: '3:4', val: 3 / 4 },
    { key: '1:1', val: 1.0 },
    { key: '4:3', val: 4 / 3 },
    { key: '16:9', val: 16 / 9 },
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

// Intelligent helper to extract the specific background description from any prompt format
export function extractBackgroundDescription(prompt?: string): string {
  if (!prompt) return '';

  // 1. Match Section with "Replace ... background with:" (Sections 7, 6, 3, etc.)
  const matchReplace = prompt.match(/(?:Replace the original background with|Replace ONLY the background with|Replace background with):?\s*\n+([\s\S]*?)(?=\n\s*(?:The new (?:environment|background)|The background|A floor|[789]\.\s*|={10,}|$))/i);
  if (matchReplace && matchReplace[1]) {
    const extracted = matchReplace[1].trim();
    if (
      extracted &&
      extracted !== '[INSERT BACKGROUND DESCRIPTION HERE]' &&
      !extracted.startsWith('the specified new environment') &&
      !extracted.includes('ONE of these categories') &&
      !extracted.includes('FIRST: ANALYZE')
    ) {
      return extracted;
    }
  }

  // 2. Match Section 7: BACKGROUND ENVIRONMENT
  const match7 = prompt.match(/7\.\s*BACKGROUND(?:\s*ENVIRONMENT)?[\s\S]*?Replace[^\n:]+with:?\s*([\s\S]*?)(?=\n\s*(?:The new background|8\.\s*|={10,}|$))/i);
  if (match7 && match7[1]) {
    const extracted = match7[1].trim();
    if (
      extracted &&
      extracted !== '[INSERT BACKGROUND DESCRIPTION HERE]' &&
      !extracted.startsWith('the specified new environment') &&
      !extracted.includes('ONE of these categories') &&
      !extracted.includes('FIRST: ANALYZE')
    ) {
      return extracted;
    }
  }

  // 3. Match Section 6: NEW BACKGROUND (in 12-section Master Prompt)
  const match6 = prompt.match(/6\.\s*NEW\s*BACKGROUND[\s\S]*?Replace[^\n:]+with:?\s*([\s\S]*?)(?=\n\s*(?:The new background|7\.\s*BACKGROUND|={10,}|$))/i);
  if (match6 && match6[1]) {
    const extracted = match6[1].trim();
    if (
      extracted &&
      extracted !== '[INSERT BACKGROUND DESCRIPTION HERE]' &&
      !extracted.startsWith('the specified new environment') &&
      !extracted.includes('ONE of these categories') &&
      !extracted.includes('FIRST: ANALYZE')
    ) {
      return extracted;
    }
  }

  // 4. Match Section 3: BACKGROUND REPLACEMENT (in 8-section Master Prompt)
  const match3 = prompt.match(/3\.\s*BACKGROUND\s*REPLACEMENT[\s\S]*?replace[^\n:]+with:?\s*([\s\S]*?)(?=\n\s*(?:The new (?:environment|background)|4\.\s*COMPOSITION|={10,}|$))/i);
  if (match3 && match3[1]) {
    const extracted = match3[1].trim();
    if (
      extracted &&
      extracted !== '[INSERT BACKGROUND DESCRIPTION HERE]' &&
      !extracted.startsWith('the specified new environment') &&
      !extracted.includes('ONE of these categories') &&
      !extracted.includes('FIRST: ANALYZE')
    ) {
      return extracted;
    }
  }

  // 5. Match legacy Section 2: Place the isolated subject(s) into...
  const matchLegacy = prompt.match(/2\.\s*Place the isolated subject(?:\(s\))?\s*into\s*(?:a background that features\s*|a background that have setting featuring\s*|a background that\s*|A\s*|a\s*)?([\s\S]*?)(?=\n\s*(?:3\.\s*Crucially|3\.|\n\s*4\.|\n\s*Preserve|$))/i);
  if (matchLegacy && matchLegacy[1]) {
    const extracted = matchLegacy[1].trim();
    if (
      extracted &&
      !extracted.startsWith('the specified new environment') &&
      !extracted.includes('ONE of these categories') &&
      !extracted.includes('FIRST: ANALYZE')
    ) {
      return extracted;
    }
  }

  // 6. Match "2. NEW ENVIRONMENT & BACKGROUND:"
  const matchEnv = prompt.match(/2\.\s*NEW\s*ENVIRONMENT\s*&\s*BACKGROUND:?\s*([\s\S]*?)(?=\n\s*(?:3\.|\n\s*Ensure|$))/i);
  if (matchEnv && matchEnv[1]) {
    const extracted = matchEnv[1].trim();
    if (extracted) return extracted;
  }

  // 7. If the prompt is just raw background description (doesn't contain ROLE: or TASK:)
  if (!prompt.includes('ROLE:') && !prompt.includes('TASK:') && !prompt.includes('FIRST: ANALYZE')) {
    return prompt.trim();
  }

  return '';
}

// Helper to replace [BỐI CẢNH] and its variations with the actual background description
export function replaceBoiCanhPlaceholder(prompt: string, description: string): { newPrompt: string; replacedCount: number } {
  if (!prompt || !description.trim()) return { newPrompt: prompt, replacedCount: 0 };
  const desc = description.trim();
  let count = 0;
  // Regex matches [BỐI CẢNH], [Bối Cảnh], [bối cảnh], [BOI CANH], [boi canh], [BỐI_CẢNH], [BOI_CANH], [INSERT BACKGROUND DESCRIPTION HERE]
  const boiCanhRegex = /\[(?:BỐI\s*CẢNH|bối\s*cảnh|Bối\s*Cảnh|BOI\s*CANH|boi\s*canh|BỐI_CẢNH|BOI_CANH|INSERT\s*BACKGROUND\s*DESCRIPTION\s*HERE)\]/gi;
  const newPrompt = prompt.replace(boiCanhRegex, () => {
    count++;
    return desc;
  });
  return { newPrompt, replacedCount: count };
}

export const AdminBackgroundTemplatesManager: React.FC = () => {
  const {
    allTemplates,
    loading,
    saveTemplate,
    toggleTemplateActive,
    deleteTemplate,
  } = useBackgroundTemplates();

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showOnlyInactive, setShowOnlyInactive] = useState<boolean>(false);

  // Edit / Add Modal state
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [isEditingNew, setIsEditingNew] = useState<boolean>(false);
  const [activePromptTab, setActivePromptTab] = useState<'portrait' | 'fullbody'>('portrait');
  const [currentBgDesc, setCurrentBgDesc] = useState<string>('');
  const [editingTemplate, setEditingTemplate] = useState<Partial<ExtendedBackgroundTemplate>>({
    id: '',
    name: '',
    name_vn: '',
    thumbnailUrl: '',
    prompt: '',
    promptPortrait: '',
    promptFullBody: '',
    bgDescription: '',
    category: 'wedding-arch',
    isActive: true,
  });

  const { currentUser } = useAuth();

  // Test Render feature states
  const [showTestSection, setShowTestSection] = useState<boolean>(true);
  const [testImage, setTestImage] = useState<string | null>(null);
  const [testPromptMode, setTestPromptMode] = useState<'portrait' | 'fullbody' | 'manual'>('portrait');
  const [manualTestPrompt, setManualTestPrompt] = useState<string>('');
  const [testFramingMode, setTestFramingMode] = useState<'portrait' | 'fullbody'>('portrait');
  const [testResolution, setTestResolution] = useState<'1K' | '2K'>('2K');
  const [isTestRendering, setIsTestRendering] = useState<boolean>(false);
  const [testRenderStep, setTestRenderStep] = useState<string>('Khởi tạo...');
  const [testRenderResult, setTestRenderResult] = useState<string | null>(null);
  const [testRenderError, setTestRenderError] = useState<string | null>(null);
  const [lastTestPromptUsed, setLastTestPromptUsed] = useState<string>('');
  const [isDraggingTestImage, setIsDraggingTestImage] = useState<boolean>(false);

  // Action status states
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [copiedPromptId, setCopiedPromptId] = useState<string | null>(null);
  const [viewPromptTemplate, setViewPromptTemplate] = useState<ExtendedBackgroundTemplate | null>(null);
  const [viewDetailTab, setViewDetailTab] = useState<'portrait' | 'fullbody'>('portrait');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Open creation modal - initialize 2 prompts (portrait & full-body)
  const handleAddNew = () => {
    const defaultDesc = 'A luxurious romantic wedding flower arch with warm golden hour lighting and lush roses.';
    setCurrentBgDesc(defaultDesc);
    const portraitP = createPortraitPrompt(defaultDesc);
    const fullBodyP = createFullBodyPrompt(defaultDesc);
    setEditingTemplate({
      id: `custom-template-${Date.now()}`,
      name: 'New Custom Background',
      name_vn: 'Mẫu Phông Mới',
      thumbnailUrl: 'https://www.photobookvietnam.net/app/images/background1.jpg',
      prompt: createMasterPrompt(defaultDesc),
      promptPortrait: portraitP,
      promptFullBody: fullBodyP,
      bgDescription: defaultDesc,
      category: 'wedding-arch',
      isActive: true,
    });
    setActivePromptTab('portrait');
    setIsEditingNew(true);
    // Chuẩn bị sẵn bộ test cho admin
    setTestImage(null);
    setTestRenderResult(null);
    setTestRenderError(null);
    setShowTestSection(true);
    setTestPromptMode('portrait');
    setManualTestPrompt(portraitP);
    setTestFramingMode('portrait');
    setIsEditModalOpen(true);
  };

  // Open edit modal for an existing template - PRESERVES BOTH PROMPTS 100% UNTOUCHED
  const handleEdit = (tmpl: ExtendedBackgroundTemplate) => {
    const savedDesc = tmpl.bgDescription !== undefined ? (tmpl.bgDescription || '') : '';
    const extractedDesc = savedDesc || extractBackgroundDescription(tmpl.promptPortrait || tmpl.promptFullBody || tmpl.prompt);
    setCurrentBgDesc(extractedDesc);
    // Nếu template đã có promptPortrait thì dùng, nếu không thì để trống (không tự động ép)
    const initialPortrait = tmpl.promptPortrait !== undefined ? (tmpl.promptPortrait || '') : '';
    const initialFullBody = tmpl.promptFullBody || tmpl.prompt || (extractedDesc ? createFullBodyPrompt(extractedDesc) : '');

    setEditingTemplate({
      ...tmpl,
      prompt: tmpl.prompt || '',
      promptPortrait: initialPortrait,
      promptFullBody: initialFullBody,
      bgDescription: extractedDesc,
    });
    // Nếu chỉ có toàn thân thì mặc định mở tab fullbody, ngược lại mở portrait
    setActivePromptTab(initialPortrait ? 'portrait' : 'fullbody');
    setIsEditingNew(false);
    // Khởi tạo state test render
    setTestImage(null);
    setTestRenderResult(null);
    setTestRenderError(null);
    setShowTestSection(true);
    setTestPromptMode(initialPortrait ? 'portrait' : 'fullbody');
    setManualTestPrompt(initialPortrait || initialFullBody || '');
    setTestFramingMode(initialPortrait ? 'portrait' : 'fullbody');
    setIsEditModalOpen(true);
  };

  // Duplicate / Clone template - PRESERVES BOTH PROMPTS 100% UNTOUCHED
  const handleClone = (tmpl: ExtendedBackgroundTemplate) => {
    const newId = `${tmpl.id}-copy-${Date.now()}`;
    const savedDesc = tmpl.bgDescription !== undefined ? (tmpl.bgDescription || '') : '';
    const extractedDesc = savedDesc || extractBackgroundDescription(tmpl.promptPortrait || tmpl.promptFullBody || tmpl.prompt);
    setCurrentBgDesc(extractedDesc);
    const initialPortrait = tmpl.promptPortrait !== undefined ? (tmpl.promptPortrait || '') : '';
    const initialFullBody = tmpl.promptFullBody || tmpl.prompt || (extractedDesc ? createFullBodyPrompt(extractedDesc) : '');

    setEditingTemplate({
      ...tmpl,
      id: newId,
      name_vn: `${tmpl.name_vn} (Bản sao)`,
      name: `${tmpl.name} (Copy)`,
      prompt: tmpl.prompt || '',
      promptPortrait: initialPortrait,
      promptFullBody: initialFullBody,
      bgDescription: extractedDesc,
      isActive: true,
    });
    setActivePromptTab(initialPortrait ? 'portrait' : 'fullbody');
    setIsEditingNew(true);
    // Khởi tạo test
    setTestImage(null);
    setTestRenderResult(null);
    setTestRenderError(null);
    setShowTestSection(true);
    setTestPromptMode(initialPortrait ? 'portrait' : 'fullbody');
    setManualTestPrompt(initialPortrait || initialFullBody || '');
    setTestFramingMode(initialPortrait ? 'portrait' : 'fullbody');
    setIsEditModalOpen(true);
  };

  // Xử lý tải ảnh thử nghiệm từ máy tính
  const handleTestImageFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      showToast('⚠️ Vui lòng chỉ chọn tệp định dạng hình ảnh (PNG, JPG, WEBP).');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      if (dataUrl) {
        setTestImage(dataUrl);
        setTestRenderResult(null);
        setTestRenderError(null);
        showToast('📸 Đã tải ảnh lên để test thành công!');
      }
    };
    reader.readAsDataURL(file);
  };

  // Xử lý thực hiện render test thử nghiệm với AI
  const handleRunTestRender = async () => {
    if (!testImage) {
      showToast('⚠️ Vui lòng upload ảnh hoặc chọn một ảnh mẫu thử nghiệm ở khung bên dưới!');
      return;
    }

    let promptToSend = '';
    if (testPromptMode === 'manual') {
      promptToSend = manualTestPrompt.trim();
    } else if (testPromptMode === 'portrait') {
      promptToSend = (editingTemplate.promptPortrait || manualTestPrompt || '').trim();
    } else {
      promptToSend = (editingTemplate.promptFullBody || editingTemplate.prompt || manualTestPrompt || '').trim();
    }

    if (!promptToSend) {
      showToast('⚠️ Vui lòng nhập câu prompt bằng tay hoặc chọn prompt cần test!');
      return;
    }

    // Tự động giải quyết placeholder [BỐI CẢNH] nếu còn trong prompt
    const bgDesc = currentBgDesc.trim() || editingTemplate.name_vn || 'a romantic wedding setting';
    promptToSend = replaceBoiCanhPlaceholder(promptToSend, bgDesc).newPrompt;

    setIsTestRendering(true);
    setTestRenderError(null);
    setTestRenderResult(null);
    setTestRenderStep('Đang kiểm tra kích thước ảnh...');

    try {
      const dims = await getImageDimensions(testImage);
      const chosenAspectRatio = (dims.width > 0 && dims.height > 0)
        ? getClosestGeminiAspectRatio(dims.width, dims.height)
        : '3:4';

      setTestRenderStep('Đang nén ảnh & chuẩn bị dữ liệu AI...');
      const optimizedImage = await compressImageForAi(testImage);

      setTestRenderStep('Đang gửi prompt đến AI Studio để ghép phông...');
      const clientApiKey = (((import.meta as any).env?.VITE_GEMINI_API_KEY as string) || '').trim();

      const res = await fetch('/api/ai/replace-background', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(clientApiKey ? { 'x-gemini-api-key': clientApiKey } : {}),
        },
        body: JSON.stringify({
          image: optimizedImage,
          prompt: promptToSend,
          framingMode: testFramingMode,
          templateName: editingTemplate.name_vn || 'Mẫu Test',
          category: editingTemplate.category || 'wedding-arch',
          aspectRatio: chosenAspectRatio,
          imageSize: testResolution,
          preserveFraming: true,
          userId: currentUser?.uid || '',
          userEmail: currentUser?.email || '',
          apiKey: clientApiKey || undefined,
        }),
      });

      const data = await parseApiResponse(res);

      if (!res.ok || !data.success) {
        throw new Error(data.message || data.error || 'Tạo ảnh thử nghiệm thất bại.');
      }

      const finalUrl = data.imageUrl || data.cloudinaryUrl || data.staticUrl;
      setTestRenderResult(finalUrl);
      setLastTestPromptUsed(promptToSend);
      showToast('🎉 Render thử nghiệm thành công! Bạn có thể xem kết quả bên dưới.');
    } catch (err: any) {
      console.error('[Test Render Error]', err);
      const msg = err.message || 'Lỗi khi test render prompt.';
      setTestRenderError(msg);
      showToast('❌ Test render thất bại: ' + msg);
    } finally {
      setIsTestRendering(false);
    }
  };

  // Save template handler - Saves promptPortrait, promptFullBody and fallback prompt to Firestore
  const handleSaveTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTemplate.id || !editingTemplate.name_vn || !editingTemplate.thumbnailUrl) {
      showToast('⚠️ Vui lòng điền đầy đủ Mã ID, Tên tiếng Việt và Link ảnh!');
      return;
    }

    const bgDesc = currentBgDesc.trim();
    let portraitPrompt = (editingTemplate.promptPortrait || '').trim();
    let fullBodyPrompt = (editingTemplate.promptFullBody || '').trim();
    let basePrompt = (editingTemplate.prompt || '').trim();

    // Nếu có nhập Mô Tả Bối Cảnh Phông Nền Cũ, tự động chèn vào cụm từ [BỐI CẢNH] trong prompt
    if (bgDesc) {
      if (portraitPrompt) {
        portraitPrompt = replaceBoiCanhPlaceholder(portraitPrompt, bgDesc).newPrompt;
      }
      if (fullBodyPrompt) {
        fullBodyPrompt = replaceBoiCanhPlaceholder(fullBodyPrompt, bgDesc).newPrompt;
      }
      if (basePrompt) {
        basePrompt = replaceBoiCanhPlaceholder(basePrompt, bgDesc).newPrompt;
      }
    }
    
    // Yêu cầu: Nếu có đủ cả 2 thì áp dụng cả 2. Nếu chỉ có Toàn thân thì chạy Toàn thân.
    const fallbackPrompt = fullBodyPrompt || portraitPrompt || basePrompt;

    if (!fallbackPrompt) {
      showToast('⚠️ Vui lòng nhập nội dung cho ít nhất một câu lệnh Prompt (Toàn thân hoặc Chân dung)!');
      return;
    }

    setIsSaving(true);
    try {
      await saveTemplate({
        id: editingTemplate.id.trim(),
        name: editingTemplate.name?.trim() || editingTemplate.name_vn.trim(),
        name_vn: editingTemplate.name_vn.trim(),
        thumbnailUrl: editingTemplate.thumbnailUrl.trim(),
        prompt: fallbackPrompt,
        promptPortrait: portraitPrompt, // Lưu đúng giá trị, nếu không nhập thì để trống
        promptFullBody: fullBodyPrompt || fallbackPrompt, // Đảm bảo luôn có Toàn thân
        bgDescription: bgDesc, // Lưu lại nội dung của phần Mô tả bối cảnh chứ không xóa
        category: (editingTemplate.category as any) || 'wedding-arch',
        isActive: editingTemplate.isActive !== false,
      });
      const modeMsg = portraitPrompt && fullBodyPrompt
        ? 'cả 2 phần Prompt (Chân dung & Toàn thân)'
        : fullBodyPrompt
        ? 'Prompt Toàn Thân'
        : 'Prompt Chân Dung';
      showToast(`🎉 Đã lưu ${modeMsg} cho mẫu "${editingTemplate.name_vn}" thành công!`);
      setIsEditModalOpen(false);
    } catch (err: any) {
      showToast('❌ Lỗi lưu template: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  // Toggle active status
  const handleToggle = async (tmpl: ExtendedBackgroundTemplate) => {
    const newState = !(tmpl.isActive !== false);
    try {
      await toggleTemplateActive(tmpl.id, newState);
      showToast(`Đã ${newState ? 'bật' : 'tắt hiển thị'} mẫu "${tmpl.name_vn}"`);
    } catch (err: any) {
      showToast('❌ Lỗi cập nhật trạng thái: ' + err.message);
    }
  };

  // Delete template
  const handleDelete = async (tmpl: ExtendedBackgroundTemplate) => {
    try {
      await deleteTemplate(tmpl.id);
      showToast(`Đã xóa/ẩn mẫu "${tmpl.name_vn}" thành công!`);
    } catch (err: any) {
      showToast('❌ Lỗi xóa template: ' + err.message);
    }
  };

  // Filter templates
  const filteredTemplates = allTemplates.filter((t) => {
    const query = searchQuery.toLowerCase().trim();
    const matchQuery =
      !query ||
      t.name_vn?.toLowerCase().includes(query) ||
      t.name?.toLowerCase().includes(query) ||
      t.id?.toLowerCase().includes(query) ||
      t.prompt?.toLowerCase().includes(query);

    const matchCategory =
      selectedCategory === 'all' || t.category === selectedCategory;

    const matchInactive = !showOnlyInactive || t.isActive === false;

    return matchQuery && matchCategory && matchInactive;
  });

  const inactiveCount = allTemplates.filter((t) => t.isActive === false).length;

  return (
    <div className="space-y-4">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 px-4 py-2.5 rounded-xl text-xs flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Toolbar */}
      <div className="bg-slate-850 border border-slate-750 p-4 rounded-2xl space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-bold text-white text-sm flex items-center gap-2">
              <Wand2 className="w-4 h-4 text-purple-400" />
              <span>Quản Lý Mẫu Phông</span>
            </h3>
          </div>

          {/* Top Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleAddNew}
              className="px-3.5 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs rounded-xl shadow-md shadow-purple-600/20 flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Thêm Mẫu Mới</span>
            </button>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="pt-2 border-t border-slate-750/70 flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 hide-scrollbar">
            {BACKGROUND_CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => {
                  setSelectedCategory(cat.id);
                  setShowOnlyInactive(false);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                  selectedCategory === cat.id && !showOnlyInactive
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'bg-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-750'
                }`}
              >
                {cat.name}
              </button>
            ))}

            <button
              onClick={() => setShowOnlyInactive(!showOnlyInactive)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                showOnlyInactive
                  ? 'bg-amber-600 text-white'
                  : 'bg-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-750'
              }`}
            >
              Đã Ẩn ({inactiveCount})
            </button>
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tìm theo tên, ID, từ khóa prompt..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none focus:border-purple-500"
            />
          </div>
        </div>
      </div>

      {/* Loading state */}
      {loading ? (
        <div className="py-16 text-center text-slate-400 text-xs">
          <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          Đang tải dữ liệu mẫu phông nền AI...
        </div>
      ) : filteredTemplates.length === 0 ? (
        <div className="py-12 bg-slate-850/50 border border-slate-800 rounded-2xl text-center text-slate-400 text-xs space-y-2">
          <AlertCircle className="w-8 h-8 text-slate-500 mx-auto" />
          <p>Không tìm thấy mẫu phông nền nào phù hợp với bộ lọc.</p>
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory('all');
              setShowOnlyInactive(false);
            }}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-purple-300 rounded-lg text-xs"
          >
            Đặt lại bộ lọc
          </button>
        </div>
      ) : (
        /* Templates Grid Display */
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5">
          {filteredTemplates.map((tmpl) => {
            const isActive = tmpl.isActive !== false;
            const catName =
              BACKGROUND_CATEGORIES.find((c) => c.id === tmpl.category)?.name || tmpl.category || 'Mặc định';

            return (
              <div
                key={tmpl.id}
                className={`group rounded-2xl border transition-all duration-200 flex flex-col overflow-hidden ${
                  isActive
                    ? 'bg-slate-850 border-slate-750 hover:border-purple-500/80 shadow-md'
                    : 'bg-slate-900/60 border-slate-800 opacity-65'
                }`}
              >
                  {/* Thumbnail Preview Image */}
                <div className="relative aspect-[3/4] bg-slate-950 overflow-hidden">
                  <img
                    src={tmpl.thumbnailUrl}
                    alt={tmpl.name_vn}
                    className="w-full h-full object-cover"
                    loading="lazy"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src =
                        'https://images.unsplash.com/photo-1519741497674-611481863552?w=500&auto=format&fit=crop&q=80';
                    }}
                  />

                  {/* Top Badges */}
                  <div className="absolute top-2 left-2 right-2 flex items-center justify-between gap-1 pointer-events-none">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-900/80 backdrop-blur-md text-purple-300 border border-purple-500/40">
                      {catName}
                    </span>

                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full backdrop-blur-md border ${
                        isActive
                          ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40'
                          : 'bg-rose-950/80 text-rose-300 border-rose-500/40'
                      }`}
                    >
                      {isActive ? 'Đang hiện' : 'Đã ẩn'}
                    </span>
                  </div>
                </div>

                {/* Card Information */}
                <div className="p-3 flex-1 flex flex-col justify-between space-y-2.5">
                  <div>
                    <div className="flex items-start justify-between gap-1.5">
                      <h4 className="font-bold text-white text-xs truncate leading-tight" title={tmpl.name_vn}>
                        {tmpl.name_vn}
                      </h4>
                      {tmpl.isCustom && (
                        <span className="shrink-0 text-[9px] px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-semibold">
                          Tự tạo
                        </span>
                      )}
                    </div>
                    {/* Prompt mode badges */}
                    <div className="flex items-center gap-1 mt-1">
                      {tmpl.promptPortrait?.trim() && tmpl.promptFullBody?.trim() ? (
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-purple-500/15 text-purple-300 border border-purple-500/30 font-medium">
                          ⚡ 2 Prompt: Chân dung & Toàn thân
                        </span>
                      ) : tmpl.promptFullBody?.trim() ? (
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 font-medium">
                          ⚡ 1 Prompt: Toàn thân
                        </span>
                      ) : (
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 font-medium">
                          ⚡ 1 Prompt: Mặc định
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions Footer */}
                  <div className="pt-2 border-t border-slate-800 flex items-center justify-between gap-1.5">
                    {/* Toggle Button */}
                    <button
                      type="button"
                      onClick={() => handleToggle(tmpl)}
                      title={isActive ? 'Bấm để ẩn khỏi giao diện khách' : 'Bấm để hiển thị lại'}
                      className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                        isActive
                          ? 'bg-emerald-950/40 border-emerald-800 text-emerald-400 hover:bg-emerald-900/60'
                          : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {isActive ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                    </button>

                    <div className="flex items-center gap-1.5">
                      {/* Clone Button */}
                      <button
                        type="button"
                        onClick={() => handleClone(tmpl)}
                        title="Tạo bản sao mẫu này"
                        className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg border border-slate-700 text-xs transition cursor-pointer"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>

                      {/* Edit Button - Icon only, no text */}
                      <button
                        type="button"
                        onClick={() => handleEdit(tmpl)}
                        title="Chỉnh sửa Master Prompt & thông tin mẫu"
                        className="p-1.5 bg-purple-600/30 hover:bg-purple-600/50 text-purple-200 border border-purple-500/40 rounded-lg text-xs transition cursor-pointer"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>

                      {/* Delete Button */}
                      <button
                        type="button"
                        onClick={() => handleDelete(tmpl)}
                        title="Xóa/Ẩn vĩnh viễn"
                        className="p-1.5 bg-slate-800 hover:bg-rose-900/50 text-slate-400 hover:text-rose-300 rounded-lg border border-slate-700 transition cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL 1: EDIT / CREATE TEMPLATE (100% FREE MASTER PROMPT EDITOR + BACKGROUND DESC EXTRACTOR) */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm overflow-y-auto animate-fadeIn">
          <div className="bg-slate-900 border border-slate-750 rounded-2xl max-w-5xl w-full p-4 sm:p-6 shadow-2xl my-auto space-y-4">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-400" />
                <div>
                  <h3 className="font-bold text-sm sm:text-base text-white">
                    {isEditingNew ? 'Thêm Mới Mẫu Phông Nền AI' : `Chỉnh Sửa Mẫu: ${editingTemplate.name_vn}`}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Soạn thảo Master Prompt tự do hoàn toàn, giữ nguyên phần mô tả bối cảnh cũ để copy bất cứ lúc nào.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveTemplate} className="space-y-4">
              {/* Top basic info row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Left col */}
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Mã Định Danh (ID) <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="vd: modern-minimalist-arch"
                      value={editingTemplate.id || ''}
                      onChange={(e) => setEditingTemplate((prev) => ({ ...prev, id: e.target.value }))}
                      disabled={!isEditingNew}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 font-mono disabled:opacity-50"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Tên Tiếng Việt Hiển Thị <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="vd: Cổng Hoa Hồng Pastel Tối Giản"
                      value={editingTemplate.name_vn || ''}
                      onChange={(e) => setEditingTemplate((prev) => ({ ...prev, name_vn: e.target.value }))}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Tên Tiếng Anh (Tùy chọn)
                    </label>
                    <input
                      type="text"
                      placeholder="vd: Minimalist Pastel Floral Arch"
                      value={editingTemplate.name || ''}
                      onChange={(e) => setEditingTemplate((prev) => ({ ...prev, name: e.target.value }))}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Danh Mục Phân Loại
                    </label>
                    <select
                      value={editingTemplate.category || 'wedding-arch'}
                      onChange={(e) => setEditingTemplate((prev) => ({ ...prev, category: e.target.value as any }))}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-purple-500"
                    >
                      <option value="wedding-arch">Cổng Hoa & Sân Khấu Cưới</option>
                      <option value="indoor-studio">Indoor (Studio trong nhà)</option>
                      <option value="nature-outdoor">Ngoại cảnh & Thiên nhiên</option>
                      <option value="art-luxury">Nghệ thuật & Sang trọng</option>
                    </select>
                  </div>
                </div>

                {/* Right col: Thumbnail & Live Image Preview */}
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center justify-between">
                      <span>Đường Dẫn Ảnh Thumbnail (URL) <span className="text-rose-400">*</span></span>
                      <span className="text-[10px] text-slate-400 font-normal">Tỉ lệ 3:4 hoặc 9:16</span>
                    </label>
                    <input
                      type="url"
                      required
                      placeholder="https://www.photobookvietnam.net/app/images/background1.jpg"
                      value={editingTemplate.thumbnailUrl || ''}
                      onChange={(e) => setEditingTemplate((prev) => ({ ...prev, thumbnailUrl: e.target.value }))}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 font-mono"
                    />
                  </div>

                  {/* Thumbnail Preview Box */}
                  <div className="bg-slate-850 p-2.5 rounded-xl border border-slate-750 flex items-center gap-3">
                    <div className="w-20 h-28 rounded-lg overflow-hidden bg-slate-950 border border-slate-700 shrink-0 relative">
                      {editingTemplate.thumbnailUrl ? (
                        <img
                          src={editingTemplate.thumbnailUrl}
                          alt="Preview"
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).src =
                              'https://images.unsplash.com/photo-1519741497674-611481863552?w=500&auto=format&fit=crop&q=80';
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-slate-600 text-[10px]">
                          <ImageIcon className="w-5 h-5 mb-1" />
                          Chưa có ảnh
                        </div>
                      )}
                    </div>
                    <div className="text-xs text-slate-400 space-y-1">
                      <div className="font-semibold text-slate-200">Xem trước ảnh mẫu:</div>
                      <p className="text-[11px] leading-relaxed">
                        Hình ảnh này sẽ hiển thị trong ô chọn mẫu của khách hàng. Hãy sử dụng đường link ảnh trực tiếp từ Photobook Vietnam hoặc link CDN tốc độ cao.
                      </p>
                    </div>
                  </div>

                  {/* Status active toggle */}
                  <div className="pt-2">
                    <label className="flex items-center gap-2 cursor-pointer bg-slate-850 p-2.5 rounded-xl border border-slate-750">
                      <input
                        type="checkbox"
                        checked={editingTemplate.isActive !== false}
                        onChange={(e) => setEditingTemplate((prev) => ({ ...prev, isActive: e.target.checked }))}
                        className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500 border-slate-700 bg-slate-800"
                      />
                      <span className="text-xs font-semibold text-slate-200">
                        Kích hoạt hiển thị cho khách hàng (Active)
                      </span>
                    </label>
                  </div>
                </div>
              </div>

              {/* PHẦN MÔ TẢ BỐI CẢNH */}
              <div className="bg-gradient-to-r from-amber-950/40 via-amber-900/20 to-slate-900 border border-amber-500/40 rounded-xl p-3.5 space-y-2 shadow-inner">
                <div className="flex items-center justify-between gap-2 border-b border-amber-500/20 pb-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-amber-300">
                    <Wand2 className="w-4 h-4 text-amber-400" />
                    <span>Mô tả bối cảnh</span>
                  </div>
                  <span className="font-mono text-[11px] text-amber-400/90">{currentBgDesc.length} ký tự</span>
                </div>

                <textarea
                  rows={3}
                  value={currentBgDesc}
                  onChange={(e) => {
                    const val = e.target.value;
                    setCurrentBgDesc(val);
                    setEditingTemplate((prev) => ({ ...prev, bgDescription: val }));
                  }}
                  placeholder="Mô tả bối cảnh..."
                  className="w-full p-2.5 bg-slate-950 border border-amber-500/30 rounded-lg text-xs font-mono text-amber-200 placeholder-slate-500 leading-relaxed resize-y focus:outline-none focus:border-amber-400 shadow-inner"
                />
              </div>

              {/* 2-SECTION DUAL PROMPT EDITOR: CHÂN DUNG & TOÀN THÂN */}
              <div className="bg-gradient-to-br from-purple-950/40 via-indigo-950/20 to-slate-900 p-4 rounded-2xl border border-purple-500/30 space-y-3 shadow-inner">
                {/* Tab Switcher */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-purple-500/20 pb-3">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setActivePromptTab('portrait')}
                      className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                        activePromptTab === 'portrait'
                          ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30 ring-2 ring-purple-400'
                          : 'bg-slate-800 text-slate-300 hover:bg-slate-750'
                      }`}
                    >
                      <User className="w-4 h-4 text-purple-300" />
                      <span>1. Prompt Chân Dung</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono ${
                        editingTemplate.promptPortrait?.trim()
                          ? 'bg-purple-950 text-purple-200 border border-purple-500/40'
                          : 'bg-slate-900 text-slate-400 border border-slate-700'
                      }`}>
                        {editingTemplate.promptPortrait?.trim() ? 'Đã nhập (f/1.2)' : 'Tùy chọn'}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setActivePromptTab('fullbody')}
                      className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                        activePromptTab === 'fullbody'
                          ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 ring-2 ring-indigo-400'
                          : 'bg-slate-800 text-slate-300 hover:bg-slate-750'
                      }`}
                    >
                      <Users className="w-4 h-4 text-indigo-300" />
                      <span>2. Prompt Toàn Thân</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono ${
                        editingTemplate.promptFullBody?.trim()
                          ? 'bg-indigo-950 text-indigo-200 border border-indigo-500/40'
                          : 'bg-slate-900 text-slate-400 border border-slate-700'
                      }`}>
                        {editingTemplate.promptFullBody?.trim() ? 'Đã nhập (f/4.0)' : 'Chính'}
                      </span>
                    </button>
                  </div>

                  <div className="flex items-center gap-2 self-start sm:self-center">
                    <span className="text-[11px] text-slate-400 hidden md:inline">
                      {editingTemplate.promptPortrait?.trim() && editingTemplate.promptFullBody?.trim()
                        ? '✅ Áp dụng cả 2 chế độ (Chân dung & Toàn thân)'
                        : editingTemplate.promptFullBody?.trim()
                        ? '⚡ Chỉ chạy 1 phần Prompt Toàn Thân'
                        : '⚡ Chỉ chạy 1 phần Prompt Chân Dung'}
                    </span>
                    <span className="text-[11px] font-mono text-purple-300 font-semibold bg-purple-500/20 px-2.5 py-1 rounded-full border border-purple-500/30">
                      {activePromptTab === 'portrait'
                        ? `${editingTemplate.promptPortrait?.length || 0} ký tự`
                        : `${editingTemplate.promptFullBody?.length || 0} ký tự`}
                    </span>
                  </div>
                </div>

                {/* Quick Helper Tools & Instructions for Active Tab */}
                {activePromptTab === 'portrait' ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-end gap-1.5 flex-wrap">
                      <button
                        type="button"
                        onClick={() => {
                          if (window.confirm('Chèn câu lệnh chuẩn Studio Chân Dung (Xóa Phông f/1.2) vào ô này?')) {
                            setEditingTemplate((prev) => ({
                              ...prev,
                              promptPortrait: createPortraitPrompt(currentBgDesc || 'A romantic wedding garden at golden hour'),
                            }));
                            showToast('🎯 Đã chèn Prompt Chân Dung chuẩn Studio f/1.2!');
                          }
                        }}
                        className="px-2 py-1 bg-purple-900/40 hover:bg-purple-800/60 text-purple-200 border border-purple-500/40 rounded-lg font-medium transition cursor-pointer"
                      >
                        🎯 Mẫu Chân Dung Chuẩn
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          if (editingTemplate.promptPortrait) {
                            navigator.clipboard.writeText(editingTemplate.promptPortrait);
                            showToast('📋 Đã sao chép Prompt Chân Dung vào bộ nhớ tạm!');
                          }
                        }}
                        className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-lg font-medium transition cursor-pointer"
                      >
                        📋 Sao Chép
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          if (window.confirm('Xóa trắng ô Prompt Chân Dung?')) {
                            setEditingTemplate((prev) => ({ ...prev, promptPortrait: '' }));
                          }
                        }}
                        className="px-2 py-1 bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-800/50 rounded-lg font-medium transition cursor-pointer"
                      >
                        🧹 Xóa Trắng
                      </button>
                    </div>

                    <textarea
                      rows={12}
                      value={editingTemplate.promptPortrait || ''}
                      onChange={(e) => setEditingTemplate((prev) => ({ ...prev, promptPortrait: e.target.value }))}
                      placeholder="Nhập câu lệnh Master Prompt chuyên cho ảnh Chân dung / Nửa người (tập trung ống kính 85mm f/1.2, phông nền tan chảy vào bokeh mờ ảo, không vẽ sắc nét kiến trúc/hoa lá, tôn chủ thể sắc nét)..."
                      className="w-full p-4 bg-slate-950 border border-purple-500/30 rounded-xl text-xs font-mono text-purple-200 placeholder-slate-600 focus:outline-none focus:border-purple-400 leading-relaxed resize-y shadow-inner"
                    />
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-center justify-end gap-1.5 flex-wrap">
                      <button
                        type="button"
                        onClick={() => {
                          if (window.confirm('Chèn câu lệnh chuẩn Studio Toàn Thân (Rõ Bối Cảnh f/4.0) vào ô này?')) {
                            setEditingTemplate((prev) => ({
                              ...prev,
                              promptFullBody: createFullBodyPrompt(currentBgDesc || 'A romantic wedding garden at golden hour'),
                            }));
                            showToast('🏛️ Đã chèn Prompt Toàn Thân chuẩn Studio f/4.0!');
                          }
                        }}
                        className="px-2 py-1 bg-indigo-900/40 hover:bg-indigo-800/60 text-indigo-200 border border-indigo-500/40 rounded-lg font-medium transition cursor-pointer"
                      >
                        🏛️ Mẫu Toàn Thân Chuẩn
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          if (editingTemplate.promptFullBody) {
                            navigator.clipboard.writeText(editingTemplate.promptFullBody);
                            showToast('📋 Đã sao chép Prompt Toàn Thân vào bộ nhớ tạm!');
                          }
                        }}
                        className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-lg font-medium transition cursor-pointer"
                      >
                        📋 Sao Chép
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          if (window.confirm('Xóa trắng ô Prompt Toàn Thân?')) {
                            setEditingTemplate((prev) => ({ ...prev, promptFullBody: '' }));
                          }
                        }}
                        className="px-2 py-1 bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-800/50 rounded-lg font-medium transition cursor-pointer"
                      >
                        🧹 Xóa Trắng
                      </button>
                    </div>

                    <textarea
                      rows={12}
                      value={editingTemplate.promptFullBody || ''}
                      onChange={(e) => setEditingTemplate((prev) => ({ ...prev, promptFullBody: e.target.value }))}
                      placeholder="Nhập câu lệnh Master Prompt chuyên cho ảnh Toàn thân (tập trung ống kính 50mm f/4.0, vẽ rõ kiến trúc, cổng hoa, bối cảnh rộng, mặt đất, bóng đổ tự nhiên dưới chân)..."
                      className="w-full p-4 bg-slate-950 border border-indigo-500/30 rounded-xl text-xs font-mono text-emerald-200 placeholder-slate-600 focus:outline-none focus:border-indigo-400 leading-relaxed resize-y shadow-inner"
                    />
                  </div>
                )}
              </div>

              {/* KHU VỰC TEST THỬ NGHIỆM PROMPT VỚI ẢNH (LIVE PROMPT TESTER) - CHỈ ÁP DỤNG KHI THÊM MỚI */}
              {isEditingNew && (
                <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950/40 p-4 rounded-2xl border border-indigo-500/40 space-y-4 shadow-xl">
                {/* Header with expand/collapse and badges */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-indigo-500/20 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-indigo-600/30 border border-indigo-500/50 text-indigo-300 shadow-inner">
                      <FlaskConical className="w-5 h-5 text-indigo-400" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-sm text-white flex items-center gap-1.5">
                          <span>Test Thử Nghiệm Prompt Với Ảnh (Xem Trước Kết Quả)</span>
                        </h4>
                        <span className="text-[10px] bg-gradient-to-r from-purple-500/30 to-indigo-500/30 text-purple-200 border border-purple-500/40 px-2 py-0.5 rounded-full font-semibold">
                          Thử Nghiệm
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400">
                        Upload ảnh cô dâu chú rể hoặc chọn ảnh mẫu, nhập prompt bằng tay để render thử với Gemini AI trước khi lưu mẫu.
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowTestSection((prev) => !prev)}
                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 self-start sm:self-center cursor-pointer transition shadow-xs"
                  >
                    <span>{showTestSection ? 'Thu Gọn Khu Vực Test' : 'Mở Khu Vực Test'}</span>
                    {showTestSection ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </button>
                </div>

                {showTestSection && (
                  <div className="space-y-4 pt-1 animate-fadeIn">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                      {/* Cột Trái (5/12): Upload ảnh & Chọn chế độ ảnh */}
                      <div className="lg:col-span-5 space-y-3 bg-slate-900/80 p-3.5 rounded-xl border border-slate-800">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                            <Upload className="w-3.5 h-3.5 text-indigo-400" />
                            <span>1. Ảnh Thử Nghiệm (Cô Dâu Chú Rể):</span>
                          </label>
                          {testImage && (
                            <button
                              type="button"
                              onClick={() => {
                                setTestImage(null);
                                setTestRenderResult(null);
                                setTestRenderError(null);
                              }}
                              className="text-[11px] text-rose-400 hover:text-rose-300 transition cursor-pointer"
                            >
                              Xóa ảnh
                            </button>
                          )}
                        </div>

                        {/* Dropzone / Upload Box */}
                        {!testImage ? (
                          <div
                            onDragOver={(e) => {
                              e.preventDefault();
                              setIsDraggingTestImage(true);
                            }}
                            onDragLeave={(e) => {
                              e.preventDefault();
                              setIsDraggingTestImage(false);
                            }}
                            onDrop={(e) => {
                              e.preventDefault();
                              setIsDraggingTestImage(false);
                              if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                                handleTestImageFile(e.dataTransfer.files[0]);
                              }
                            }}
                            className={`border-2 border-dashed rounded-xl p-4 text-center transition flex flex-col items-center justify-center gap-2 cursor-pointer ${
                              isDraggingTestImage
                                ? 'border-indigo-400 bg-indigo-950/40'
                                : 'border-slate-700 hover:border-indigo-500/60 bg-slate-950/60 hover:bg-slate-950'
                            }`}
                          >
                            <input
                              type="file"
                              id="admin-test-image-upload"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => {
                                if (e.target.files && e.target.files[0]) {
                                  handleTestImageFile(e.target.files[0]);
                                }
                              }}
                            />
                            <label
                              htmlFor="admin-test-image-upload"
                              className="w-full flex flex-col items-center justify-center cursor-pointer"
                            >
                              <div className="w-10 h-10 rounded-full bg-indigo-600/20 text-indigo-400 flex items-center justify-center mb-1">
                                <UploadCloud className="w-5 h-5" />
                              </div>
                              <span className="text-xs font-bold text-indigo-300">
                                Bấm để tải ảnh từ máy tính
                              </span>
                              <span className="text-[10px] text-slate-400 mt-0.5">
                                Hoặc kéo thả ảnh vào khung này (JPG, PNG, WEBP)
                              </span>
                            </label>

                            {/* Quick Sample Photos */}
                            <div className="w-full pt-2 border-t border-slate-800 mt-1">
                              <span className="text-[10px] text-slate-400 block mb-1.5 font-medium">
                                Hoặc chọn nhanh ảnh mẫu có sẵn để test:
                              </span>
                              <div className="flex items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setTestImage(SAMPLE_WEDDING_PHOTOS[0]);
                                    setTestFramingMode('portrait');
                                    setTestRenderResult(null);
                                    setTestRenderError(null);
                                    showToast('📸 Đã nạp ảnh mẫu chân dung để test!');
                                  }}
                                  className="flex-1 py-1.5 px-2 bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 rounded-lg text-[10px] font-semibold transition cursor-pointer flex items-center justify-center gap-1"
                                >
                                  <User className="w-3 h-3 text-purple-400" />
                                  <span>Mẫu Chân Dung</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setTestImage(SAMPLE_WEDDING_PHOTOS[1]);
                                    setTestFramingMode('fullbody');
                                    setTestRenderResult(null);
                                    setTestRenderError(null);
                                    showToast('📸 Đã nạp ảnh mẫu toàn thân để test!');
                                  }}
                                  className="flex-1 py-1.5 px-2 bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 rounded-lg text-[10px] font-semibold transition cursor-pointer flex items-center justify-center gap-1"
                                >
                                  <Users className="w-3 h-3 text-indigo-400" />
                                  <span>Mẫu Toàn Thân</span>
                                </button>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <div className="relative rounded-xl overflow-hidden bg-slate-950 border border-slate-700 aspect-[3/4] max-h-56 mx-auto flex items-center justify-center">
                              <img
                                src={testImage}
                                alt="Ảnh test"
                                className="w-full h-full object-cover"
                              />
                              <div className="absolute top-2 right-2 flex items-center gap-1">
                                <label
                                  htmlFor="admin-test-image-change"
                                  className="px-2 py-1 bg-black/70 hover:bg-black text-white text-[10px] font-semibold rounded-lg backdrop-blur-xs cursor-pointer border border-white/20 transition"
                                >
                                  Đổi ảnh
                                </label>
                                <input
                                  type="file"
                                  id="admin-test-image-change"
                                  accept="image/*"
                                  className="hidden"
                                  onChange={(e) => {
                                    if (e.target.files && e.target.files[0]) {
                                      handleTestImageFile(e.target.files[0]);
                                    }
                                  }}
                                />
                              </div>
                              <div className="absolute bottom-2 left-2 px-2 py-0.5 bg-black/75 rounded text-[10px] text-slate-300 font-mono">
                                Ảnh nguồn test
                              </div>
                            </div>

                            {/* Tùy chọn kiểu dáng ống kính khi test */}
                            <div className="bg-slate-950 p-2 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
                              <span className="text-[11px] text-slate-400 font-medium">Kiểu render:</span>
                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => setTestFramingMode('portrait')}
                                  className={`px-2 py-1 rounded-lg text-[10px] font-bold transition cursor-pointer ${
                                    testFramingMode === 'portrait'
                                      ? 'bg-purple-600 text-white shadow-xs'
                                      : 'bg-slate-800 text-slate-400 hover:text-white'
                                  }`}
                                >
                                  Chân dung (f/1.2)
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setTestFramingMode('fullbody')}
                                  className={`px-2 py-1 rounded-lg text-[10px] font-bold transition cursor-pointer ${
                                    testFramingMode === 'fullbody'
                                      ? 'bg-indigo-600 text-white shadow-xs'
                                      : 'bg-slate-800 text-slate-400 hover:text-white'
                                  }`}
                                >
                                  Toàn thân (f/4.0)
                                </button>
                              </div>
                            </div>

                            {/* Độ phân giải & chất lượng model */}
                            <div className="flex items-center justify-between pt-1 border-t border-slate-800/80">
                              <span className="text-[11px] text-slate-400 font-medium">Độ phân giải:</span>
                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => setTestResolution('2K')}
                                  className={`px-2 py-1 rounded-lg text-[10px] font-bold transition cursor-pointer ${
                                    testResolution === '2K'
                                      ? 'bg-emerald-600 text-white shadow-xs ring-1 ring-emerald-400/50'
                                      : 'bg-slate-800 text-slate-400 hover:text-white'
                                  }`}
                                  title="Độ phân giải 2K chất lượng cao với model Nano Banana 2.1, xóa phông chân thật và kết cấu cỏ tự nhiên như Gemini Web"
                                >
                                  2K (Bokeh & Cỏ thật ★)
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setTestResolution('1K')}
                                  className={`px-2 py-1 rounded-lg text-[10px] font-bold transition cursor-pointer ${
                                    testResolution === '1K'
                                      ? 'bg-blue-600 text-white shadow-xs'
                                      : 'bg-slate-800 text-slate-400 hover:text-white'
                                  }`}
                                  title="Độ phân giải 1K cơ bản, render nhanh hơn"
                                >
                                  1K (Nhanh)
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Cột Phải (7/12): Nhập Prompt Bằng Tay & Điều Khiển */}
                      <div className="lg:col-span-7 space-y-3 bg-slate-900/80 p-3.5 rounded-xl border border-slate-800 flex flex-col justify-between">
                        <div className="space-y-2">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                            <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                              <Wand2 className="w-3.5 h-3.5 text-purple-400" />
                              <span>2. Câu Prompt Test Thử (Nhập Bằng Tay):</span>
                            </label>

                            {/* Prompt source buttons */}
                            <div className="flex items-center gap-1 flex-wrap">
                              <button
                                type="button"
                                onClick={() => {
                                  setTestPromptMode('portrait');
                                  setManualTestPrompt(editingTemplate.promptPortrait || '');
                                  setTestFramingMode('portrait');
                                  showToast('📋 Đã nạp Prompt Chân Dung vào ô test!');
                                }}
                                className={`px-2 py-1 rounded-lg text-[10px] font-bold transition cursor-pointer flex items-center gap-1 ${
                                  testPromptMode === 'portrait'
                                    ? 'bg-purple-600 text-white shadow-xs'
                                    : 'bg-slate-800 text-slate-300 hover:bg-slate-750'
                                }`}
                              >
                                <User className="w-3 h-3" />
                                <span>Lấy Tab Chân Dung</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  setTestPromptMode('fullbody');
                                  setManualTestPrompt(editingTemplate.promptFullBody || editingTemplate.prompt || '');
                                  setTestFramingMode('fullbody');
                                  showToast('📋 Đã nạp Prompt Toàn Thân vào ô test!');
                                }}
                                className={`px-2 py-1 rounded-lg text-[10px] font-bold transition cursor-pointer flex items-center gap-1 ${
                                  testPromptMode === 'fullbody'
                                    ? 'bg-indigo-600 text-white shadow-xs'
                                    : 'bg-slate-800 text-slate-300 hover:bg-slate-750'
                                }`}
                              >
                                <Users className="w-3 h-3" />
                                <span>Lấy Tab Toàn Thân</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => setTestPromptMode('manual')}
                                className={`px-2 py-1 rounded-lg text-[10px] font-bold transition cursor-pointer ${
                                  testPromptMode === 'manual'
                                    ? 'bg-amber-600 text-white shadow-xs'
                                    : 'bg-slate-800 text-slate-300 hover:bg-slate-750'
                                }`}
                              >
                                ✍️ Gõ Tự Do
                              </button>
                            </div>
                          </div>

                          {/* Quick insert background helper */}
                          <div className="flex items-center justify-between text-[11px] text-slate-400">
                            <span>
                              {testPromptMode === 'manual'
                                ? '✍️ Đang chế độ nhập prompt bằng tay tự do'
                                : testPromptMode === 'portrait'
                                ? '👤 Đang dùng prompt Chân Dung (có thể sửa tự do bên dưới)'
                                : '👥 Đang dùng prompt Toàn Thân (có thể sửa tự do bên dưới)'}
                            </span>
                            {currentBgDesc && (
                              <button
                                type="button"
                                onClick={() => {
                                  const { newPrompt, replacedCount } = replaceBoiCanhPlaceholder(manualTestPrompt, currentBgDesc);
                                  if (replacedCount > 0) {
                                    setManualTestPrompt(newPrompt);
                                    showToast(`🎯 Đã thay thế ${replacedCount} vị trí [BỐI CẢNH] trong ô test!`);
                                  } else {
                                    setManualTestPrompt((prev) => (prev ? prev.trim() + '\n\n' : '') + currentBgDesc.trim());
                                    showToast('📥 Đã nối mô tả bối cảnh vào cuối prompt test!');
                                  }
                                }}
                                className="text-[10px] text-amber-300 hover:text-amber-200 font-semibold underline cursor-pointer"
                              >
                                Chèn [BỐI CẢNH] vào đây
                              </button>
                            )}
                          </div>

                          {/* Manual Prompt Textarea */}
                          <textarea
                            rows={7}
                            value={manualTestPrompt}
                            onChange={(e) => {
                              setManualTestPrompt(e.target.value);
                              setTestPromptMode('manual');
                            }}
                            placeholder="Nhập hoặc dán câu prompt bằng tay vào đây để test thử nghiệm..."
                            className="w-full p-3 bg-slate-950 border border-indigo-500/30 rounded-xl text-xs font-mono text-indigo-200 placeholder-slate-600 focus:outline-none focus:border-indigo-400 leading-relaxed resize-y shadow-inner"
                          />
                        </div>

                        {/* Test render action button */}
                        <div className="pt-2">
                          <button
                            type="button"
                            onClick={handleRunTestRender}
                            disabled={isTestRendering || !testImage || !manualTestPrompt.trim()}
                            className="w-full py-3 px-4 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:via-purple-500 hover:to-pink-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                          >
                            {isTestRendering ? (
                              <>
                                <RefreshCw className="w-4 h-4 animate-spin" />
                                <span>{testRenderStep || 'Đang render thử nghiệm...'}</span>
                              </>
                            ) : (
                              <>
                                <Sparkles className="w-4 h-4 text-amber-300" />
                                <span>Bắt Đầu Render Test Thử Nghiệm (Gemini AI)</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Error display if test failed */}
                    {testRenderError && (
                      <div className="p-3 bg-rose-950/60 border border-rose-800/60 rounded-xl text-xs text-rose-200 flex items-start gap-2.5 animate-fadeIn">
                        <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                        <div className="space-y-1">
                          <div className="font-bold text-rose-300">Không thể tạo ảnh render thử nghiệm:</div>
                          <p className="text-[11px] leading-relaxed text-rose-200/90 font-mono">{testRenderError}</p>
                        </div>
                      </div>
                    )}

                    {/* Result comparison view when generated */}
                    {testRenderResult && (
                      <div className="bg-slate-950 p-4 rounded-xl border border-indigo-500/40 space-y-3 animate-fadeIn">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-2.5">
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                            <h5 className="font-bold text-xs sm:text-sm text-emerald-300">
                              Kết Quả Render Thử Nghiệm Thành Công
                            </h5>
                          </div>

                          <div className="flex items-center gap-1.5 flex-wrap">
                            {/* Copy Prompt Button */}
                            <button
                              type="button"
                              onClick={() => {
                                if (lastTestPromptUsed) {
                                  navigator.clipboard.writeText(lastTestPromptUsed);
                                  showToast('📋 Đã sao chép prompt gốc đã render ra ảnh này!');
                                }
                              }}
                              className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 rounded-lg text-xs font-medium flex items-center gap-1 cursor-pointer transition"
                              title="Sao chép câu prompt gốc đã dùng để tạo bức ảnh này"
                            >
                              <Copy className="w-3.5 h-3.5 text-purple-300" />
                              <span>Copy Prompt</span>
                            </button>

                            {/* Download Image Button */}
                            <a
                              href={testRenderResult}
                              download={`test_render_${Date.now()}.png`}
                              target="_blank"
                              rel="noreferrer"
                              className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 rounded-lg text-xs font-medium flex items-center gap-1 cursor-pointer transition"
                            >
                              <Download className="w-3.5 h-3.5 text-indigo-300" />
                              <span>Tải Ảnh Về</span>
                            </a>

                            {/* Set As Template Thumbnail */}
                            <button
                              type="button"
                              onClick={() => {
                                setEditingTemplate((prev) => ({ ...prev, thumbnailUrl: testRenderResult }));
                                showToast('🌟 Đã đặt ảnh kết quả test làm ảnh Thumbnail cho mẫu này!');
                              }}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer transition shadow-md shadow-emerald-600/20"
                              title="Dùng ngay bức ảnh render này làm ảnh đại diện cho mẫu phông nền!"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>Lấy Làm Thumbnail Mẫu</span>
                            </button>
                          </div>
                        </div>

                        {/* Side by side: Original vs AI Result */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <span className="text-[11px] font-semibold text-slate-400 block">
                              Ảnh gốc đưa vào test:
                            </span>
                            <div className="rounded-xl overflow-hidden bg-slate-900 border border-slate-800 aspect-[3/4] flex items-center justify-center">
                              {testImage && (
                                <img
                                  src={testImage}
                                  alt="Ảnh gốc"
                                  className="w-full h-full object-cover"
                                />
                              )}
                            </div>
                          </div>

                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between text-[11px]">
                              <span className="font-semibold text-purple-300">
                                Kết quả AI ghép phông:
                              </span>
                              <span className="text-[10px] text-amber-300 font-medium">
                                💡 Shift + Click để copy prompt
                              </span>
                            </div>
                            <div
                              onClick={(e) => {
                                if (e.shiftKey) {
                                  e.preventDefault();
                                  if (lastTestPromptUsed) {
                                    navigator.clipboard.writeText(lastTestPromptUsed);
                                    showToast('📋 Đã sao chép prompt gốc đã render ra tấm ảnh này!');
                                  }
                                }
                              }}
                              title="Giữ phím Shift + Click vào ảnh để sao chép prompt gốc"
                              className="rounded-xl overflow-hidden bg-slate-900 border-2 border-indigo-500/50 hover:border-indigo-400 aspect-[3/4] flex items-center justify-center relative group cursor-pointer transition shadow-lg shadow-indigo-950"
                            >
                              <img
                                src={testRenderResult}
                                alt="Kết quả render"
                                className="w-full h-full object-cover"
                              />
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center p-3 text-center">
                                <span className="text-xs bg-black/80 text-white px-3 py-1.5 rounded-lg border border-white/20 backdrop-blur-xs font-semibold shadow-lg">
                                  Giữ Shift + Click để sao chép prompt
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
              )}

              {/* Submit Buttons */}
              <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-2.5">
                {isEditingNew ? (
                  <button
                    type="button"
                    onClick={() => setShowTestSection((prev) => !prev)}
                    className="px-3.5 py-2 rounded-xl bg-indigo-950/60 hover:bg-indigo-900/60 border border-indigo-500/40 text-indigo-300 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <FlaskConical className="w-3.5 h-3.5 text-indigo-400" />
                    <span>{showTestSection ? 'Thu Gọn Mục Test' : 'Mở Mục Test Render'}</span>
                  </button>
                ) : (
                  <div />
                )}

                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => setIsEditModalOpen(false)}
                    className="px-4 py-2.5 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 text-xs font-semibold transition"
                  >
                    Hủy Bỏ
                  </button>

                  <button
                    type="submit"
                    disabled={isSaving}
                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold shadow-md shadow-purple-600/20 flex items-center gap-1.5 transition disabled:opacity-50 cursor-pointer"
                  >
                    <Save className="w-4 h-4" />
                    <span>{isSaving ? 'Đang Lưu...' : 'Lưu Mẫu Phông & Master Prompt'}</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: FULL PROMPT & BACKGROUND DESCRIPTION VIEWER */}
      {viewPromptTemplate && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-750 text-white rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl space-y-4 p-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-purple-400" />
                <h3 className="font-bold text-sm text-white">
                  Chi Tiết Master Prompt: {viewPromptTemplate.name_vn}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setViewPromptTemplate(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Section: Extracted Background Description */}
            <div className="bg-amber-950/30 border border-amber-500/40 rounded-xl p-3.5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                  <Wand2 className="w-3.5 h-3.5 text-amber-400" />
                  Mô tả bối cảnh:
                </span>
                <button
                  type="button"
                  onClick={() => {
                    const desc = viewPromptTemplate.bgDescription || extractBackgroundDescription(viewPromptTemplate.promptPortrait || viewPromptTemplate.promptFullBody || viewPromptTemplate.prompt) || viewPromptTemplate.prompt;
                    navigator.clipboard.writeText(desc);
                    showToast('📋 Đã sao chép đoạn mô tả bối cảnh!');
                  }}
                  className="px-2.5 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-500/40 rounded-lg text-xs font-bold flex items-center gap-1 transition cursor-pointer"
                >
                  <Copy className="w-3 h-3" />
                  <span>Copy Riêng Đoạn Này</span>
                </button>
              </div>

              <div className="bg-slate-950 p-2.5 rounded-lg border border-amber-500/20 text-xs font-mono text-amber-200 max-h-32 overflow-y-auto whitespace-pre-wrap leading-relaxed">
                {viewPromptTemplate.bgDescription || extractBackgroundDescription(viewPromptTemplate.promptPortrait || viewPromptTemplate.promptFullBody || viewPromptTemplate.prompt) || 'Không phát hiện mô tả tách biệt (prompt dạng tự do).'}
              </div>
            </div>

            {/* Section: Dual Prompt Viewer */}
            <div className="space-y-2">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setViewDetailTab('portrait')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                      viewDetailTab === 'portrait'
                        ? 'bg-purple-600 text-white shadow-xs'
                        : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <User className="w-3.5 h-3.5" />
                    <span>Prompt Chân Dung (f/1.2)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setViewDetailTab('fullbody')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                      viewDetailTab === 'fullbody'
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Users className="w-3.5 h-3.5" />
                    <span>Prompt Toàn Thân (f/4.0)</span>
                  </button>
                </div>

                <span className="text-[11px] font-mono text-purple-400">
                  {viewDetailTab === 'portrait'
                    ? `${(viewPromptTemplate.promptPortrait || viewPromptTemplate.prompt || '').length} ký tự`
                    : `${(viewPromptTemplate.promptFullBody || viewPromptTemplate.prompt || '').length} ký tự`}
                </span>
              </div>

              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 max-h-[38vh] overflow-y-auto font-mono text-xs text-emerald-300 leading-relaxed whitespace-pre-wrap shadow-inner">
                {viewDetailTab === 'portrait'
                  ? viewPromptTemplate.promptPortrait || viewPromptTemplate.prompt
                  : viewPromptTemplate.promptFullBody || viewPromptTemplate.prompt}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => {
                  const textToCopy = viewDetailTab === 'portrait'
                    ? (viewPromptTemplate.promptPortrait || viewPromptTemplate.prompt)
                    : (viewPromptTemplate.promptFullBody || viewPromptTemplate.prompt);
                  if (textToCopy) {
                    navigator.clipboard.writeText(textToCopy);
                    setCopiedPromptId(viewPromptTemplate.id);
                    setTimeout(() => setCopiedPromptId(null), 2500);
                    showToast(`📋 Đã sao chép Prompt ${viewDetailTab === 'portrait' ? 'Chân Dung' : 'Toàn Thân'}!`);
                  }
                }}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer"
              >
                {copiedPromptId === viewPromptTemplate.id ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-300" />
                    <span>Đã Sao Chép!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Sao Chép Prompt {viewDetailTab === 'portrait' ? 'Chân Dung' : 'Toàn Thân'}</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  const target = viewPromptTemplate;
                  setViewPromptTemplate(null);
                  handleEdit(target);
                }}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer"
              >
                <Edit className="w-3.5 h-3.5" />
                <span>Chỉnh Sửa Mẫu Này</span>
              </button>

              <button
                type="button"
                onClick={() => setViewPromptTemplate(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs font-semibold rounded-xl"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-[100] flex items-center gap-3 px-5 py-3.5 bg-slate-900/95 text-white font-semibold text-xs rounded-2xl shadow-2xl shadow-purple-950/80 border border-purple-500/50 backdrop-blur-md animate-fade-in transition-all">
          <Sparkles className="w-4 h-4 text-purple-400 shrink-0 animate-pulse" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
};
