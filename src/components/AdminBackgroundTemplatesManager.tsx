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
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Image as ImageIcon,
  Save,
  X,
  FileText,
  Sliders,
  RotateCcw,
} from 'lucide-react';
import {
  useBackgroundTemplates,
  ExtendedBackgroundTemplate,
} from '../lib/backgroundTemplatesService';
import { BACKGROUND_CATEGORIES, MASTER_PROMPT_TEMPLATE } from '../data/backgroundTemplates';

// Intelligent helper to extract the specific background description from any prompt format
export function extractBackgroundDescription(prompt?: string): string {
  if (!prompt) return '';

  // 1. Match Section 6: NEW BACKGROUND (in 12-section Master Prompt)
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

  // 2. Match Section 3: BACKGROUND REPLACEMENT (in 8-section Master Prompt)
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

  // 3. Match legacy Section 2: Place the isolated subject(s) into...
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

  // 4. Match "2. NEW ENVIRONMENT & BACKGROUND:"
  const matchEnv = prompt.match(/2\.\s*NEW\s*ENVIRONMENT\s*&\s*BACKGROUND:?\s*([\s\S]*?)(?=\n\s*(?:3\.|\n\s*Ensure|$))/i);
  if (matchEnv && matchEnv[1]) {
    const extracted = matchEnv[1].trim();
    if (extracted) return extracted;
  }

  // 5. If the prompt is just raw background description (doesn't contain ROLE: or TASK:)
  if (!prompt.includes('ROLE:') && !prompt.includes('TASK:') && !prompt.includes('FIRST: ANALYZE')) {
    return prompt.trim();
  }

  return '';
}

// Concise starter prompt template if admin wants a quick suggestion
const CONCISE_PROMPT_SUGGESTION = `ROLE: Professional High-End Wedding Photo Retouching Specialist.
TASK: Seamlessly replace ONLY the background with a luxurious, editorial wedding atmosphere.

1. SUBJECT INTEGRITY & FACE PRESERVATION (CRITICAL):
- Strictly preserve the original face, facial features, expressions, eye contact, and identity of the bride and groom 100% unchanged.
- Keep their wedding outfits, veil, jewelry, hairstyle, natural skin texture, and realistic skin tones completely razor-sharp and intact.
- Strictly preserve the original camera angle, subject distance, and photographic framing (do not crop or alter subject scale).

2. NEW ENVIRONMENT & BACKGROUND:
- An ultra-luxurious, romantic wedding background featuring elegant floral arrangements, soft architectural depth, and refined studio ambience.
- Perfectly harmonized lighting: color temperature, realistic shadows, depth of field bokeh, and natural edge blending around hair and veil.
- Final output must look like a high-end luxury editorial wedding photograph printed at master resolution.`;

export const AdminBackgroundTemplatesManager: React.FC = () => {
  const {
    allTemplates,
    loading,
    saveTemplate,
    toggleTemplateActive,
    deleteTemplate,
    seedDefaultTemplates,
    systemMasterPrompt,
    saveSystemMasterPrompt,
  } = useBackgroundTemplates();

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showOnlyInactive, setShowOnlyInactive] = useState<boolean>(false);

  // Edit / Add Modal state
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [isEditingNew, setIsEditingNew] = useState<boolean>(false);
  const [currentBgDesc, setCurrentBgDesc] = useState<string>('');
  const [editingTemplate, setEditingTemplate] = useState<Partial<ExtendedBackgroundTemplate>>({
    id: '',
    name: '',
    name_vn: '',
    thumbnailUrl: '',
    prompt: '',
    category: 'wedding-arch',
    isActive: true,
  });

  // Global System Master Prompt Modal state
  const [isSystemPromptModalOpen, setIsSystemPromptModalOpen] = useState<boolean>(false);
  const [systemPromptDraft, setSystemPromptDraft] = useState<string>('');
  const [isSavingSystemPrompt, setIsSavingSystemPrompt] = useState<boolean>(false);

  // Action status states
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isSeeding, setIsSeeding] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [copiedPromptId, setCopiedPromptId] = useState<string | null>(null);
  const [copiedDescId, setCopiedDescId] = useState<string | null>(null);
  const [viewPromptTemplate, setViewPromptTemplate] = useState<ExtendedBackgroundTemplate | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Open creation modal - 100% freeform, no forced mold
  const handleAddNew = () => {
    const starterPrompt = systemMasterPrompt || CONCISE_PROMPT_SUGGESTION;
    setCurrentBgDesc('');
    setEditingTemplate({
      id: `custom-template-${Date.now().toString().slice(-4)}`,
      name: 'New Custom Background',
      name_vn: 'Mẫu Phông Mới',
      thumbnailUrl: 'https://www.photobookvietnam.net/app/images/background1.jpg',
      prompt: starterPrompt,
      category: 'wedding-arch',
      isActive: true,
    });
    setIsEditingNew(true);
    setIsEditModalOpen(true);
  };

  // Open edit modal for an existing template - PRESERVES PROMPT 100% UNTOUCHED
  // ALSO extracts old background description for copying/reference
  const handleEdit = (tmpl: ExtendedBackgroundTemplate) => {
    const extractedDesc = extractBackgroundDescription(tmpl.prompt);
    setCurrentBgDesc(extractedDesc);
    setEditingTemplate({
      ...tmpl,
      prompt: tmpl.prompt || '',
    });
    setIsEditingNew(false);
    setIsEditModalOpen(true);
  };

  // Duplicate / Clone template - PRESERVES PROMPT 100% UNTOUCHED
  const handleClone = (tmpl: ExtendedBackgroundTemplate) => {
    const newId = `${tmpl.id}-copy-${Date.now().toString().slice(-4)}`;
    const extractedDesc = extractBackgroundDescription(tmpl.prompt);
    setCurrentBgDesc(extractedDesc);
    setEditingTemplate({
      ...tmpl,
      id: newId,
      name_vn: `${tmpl.name_vn} (Bản sao)`,
      name: `${tmpl.name} (Copy)`,
      prompt: tmpl.prompt || '',
      isActive: true,
    });
    setIsEditingNew(true);
    setIsEditModalOpen(true);
  };

  // Save template handler
  const handleSaveTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTemplate.id || !editingTemplate.name_vn || !editingTemplate.thumbnailUrl || !editingTemplate.prompt) {
      showToast('⚠️ Vui lòng điền đầy đủ Mã ID, Tên tiếng Việt, Link ảnh và Master Prompt!');
      return;
    }

    setIsSaving(true);
    try {
      await saveTemplate({
        id: editingTemplate.id.trim(),
        name: editingTemplate.name?.trim() || editingTemplate.name_vn.trim(),
        name_vn: editingTemplate.name_vn.trim(),
        thumbnailUrl: editingTemplate.thumbnailUrl.trim(),
        prompt: editingTemplate.prompt.trim(),
        category: (editingTemplate.category as any) || 'wedding-arch',
        isActive: editingTemplate.isActive !== false,
      });
      showToast(`🎉 Đã lưu Master Prompt & thông tin mẫu "${editingTemplate.name_vn}" thành công!`);
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

  // Seed / Sync all default templates
  const handleSeedDefaults = async () => {
    setIsSeeding(true);
    try {
      await seedDefaultTemplates();
      showToast('🎉 Đã đồng bộ & khôi phục thành công toàn bộ 32 mẫu lên Database!');
    } catch (err: any) {
      console.error('Error seeding templates:', err);
      showToast('❌ Lỗi đồng bộ: ' + (err.message || 'Không thể kết nối Firestore'));
    } finally {
      setIsSeeding(false);
    }
  };

  // Copy prompt to clipboard
  const handleCopyPrompt = (tmpl: ExtendedBackgroundTemplate | { id: string; prompt: string }) => {
    navigator.clipboard.writeText(tmpl.prompt);
    setCopiedPromptId(tmpl.id);
    setTimeout(() => setCopiedPromptId(null), 2500);
  };

  // Copy extracted background description
  const handleCopyBackgroundDesc = (tmpl: ExtendedBackgroundTemplate) => {
    const desc = extractBackgroundDescription(tmpl.prompt) || tmpl.prompt;
    navigator.clipboard.writeText(desc);
    setCopiedDescId(tmpl.id);
    showToast(`📋 Đã copy mô tả bối cảnh mẫu "${tmpl.name_vn}"!`);
    setTimeout(() => setCopiedDescId(null), 2500);
  };

  // Open Global System Master Prompt Modal
  const handleOpenSystemPromptModal = () => {
    setSystemPromptDraft(systemMasterPrompt || MASTER_PROMPT_TEMPLATE);
    setIsSystemPromptModalOpen(true);
  };

  // Save Global System Master Prompt to Firestore
  const handleSaveSystemPrompt = async () => {
    if (!systemPromptDraft.trim()) {
      showToast('⚠️ Vui lòng không để trống Master Prompt hệ thống!');
      return;
    }
    setIsSavingSystemPrompt(true);
    try {
      await saveSystemMasterPrompt(systemPromptDraft.trim());
      showToast('🎉 Đã cập nhật Master Prompt mặc định toàn hệ thống thành công!');
      setIsSystemPromptModalOpen(false);
    } catch (err: any) {
      showToast('❌ Lỗi lưu cấu hình: ' + err.message);
    } finally {
      setIsSavingSystemPrompt(false);
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

  const activeCount = allTemplates.filter((t) => t.isActive !== false).length;
  const inactiveCount = allTemplates.length - activeCount;

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
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div>
            <h3 className="font-bold text-white text-sm flex items-center gap-2">
              <Wand2 className="w-4 h-4 text-purple-400" />
              <span>Quản Lý Mẫu Phông & Master Prompt AI ({allTemplates.length} Mẫu)</span>
              <span className="text-[11px] font-semibold bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded-full border border-purple-500/30">
                {activeCount} Đang bật • {inactiveCount} Đã ẩn
              </span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Soạn thảo Master Prompt tự do theo ý, giữ nguyên vẹn phần mô tả bối cảnh cũ để copy và tham khảo bất cứ lúc nào.
            </p>
          </div>

          {/* Top Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleOpenSystemPromptModal}
              title="Xem và chỉnh sửa Master Prompt mặc định của toàn hệ thống"
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
            >
              <Sliders className="w-4 h-4 text-amber-400" />
              <span>Cấu Hình Master Prompt Hệ Thống</span>
            </button>

            <button
              type="button"
              onClick={handleAddNew}
              className="px-3.5 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs rounded-xl shadow-md shadow-purple-600/20 flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Thêm Mẫu Mới</span>
            </button>

            <button
              type="button"
              onClick={handleSeedDefaults}
              disabled={isSeeding}
              title="Khôi phục & lưu toàn bộ mẫu mặc định lên Database Firestore"
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-xs rounded-xl flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSeeding ? 'animate-spin text-purple-400' : ''}`} />
              <span>{isSeeding ? 'Đang đồng bộ...' : 'Đồng Bộ 32 Mẫu Mặc Định'}</span>
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
            const extractedDesc = extractBackgroundDescription(tmpl.prompt) || tmpl.prompt;

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
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
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

                  {/* Hover Quick Prompt & Background Description Preview Overlay */}
                  <div className="absolute inset-0 bg-slate-950/94 backdrop-blur-xs opacity-0 group-hover:opacity-100 transition-opacity p-3 flex flex-col justify-between text-xs">
                    <div className="space-y-1.5 overflow-hidden">
                      <div className="text-[10px] font-bold uppercase text-amber-300 flex items-center justify-between gap-1">
                        <span className="flex items-center gap-1">
                          <Wand2 className="w-3 h-3 text-amber-400" />
                          Mô Tả Bối Cảnh Cũ:
                        </span>
                        <span className="text-[9px] text-slate-400 lowercase font-normal">đã trích xuất</span>
                      </div>
                      <p className="text-[11px] font-mono text-amber-200/90 line-clamp-4 leading-relaxed font-normal whitespace-pre-wrap">
                        "{extractedDesc}"
                      </p>

                      <div className="pt-1 text-[10px] text-slate-400 line-clamp-2 font-mono">
                        <span className="text-purple-300">Prompt:</span> {tmpl.prompt.slice(0, 90)}...
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-800 flex flex-col gap-1.5">
                      <div className="flex items-center justify-between gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleCopyBackgroundDesc(tmpl)}
                          className="flex-1 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-[10px] rounded-lg font-bold flex items-center justify-center gap-1 border border-amber-500/30 transition cursor-pointer"
                        >
                          {copiedDescId === tmpl.id ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-300" />
                              <span>Đã copy mô tả</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              <span>Copy Mô Tả Bối Cảnh</span>
                            </>
                          )}
                        </button>
                      </div>

                      <div className="flex items-center justify-between gap-1.5">
                        <button
                          type="button"
                          onClick={() => setViewPromptTemplate(tmpl)}
                          className="px-2 py-1 bg-slate-800 hover:bg-slate-750 text-slate-200 text-[10px] rounded-lg font-medium flex items-center gap-1"
                        >
                          <FileText className="w-3 h-3" />
                          Đọc đầy đủ
                        </button>
                        <button
                          type="button"
                          onClick={() => handleCopyPrompt(tmpl)}
                          className="px-2 py-1 bg-purple-600 hover:bg-purple-500 text-white text-[10px] rounded-lg font-bold flex items-center gap-1"
                        >
                          {copiedPromptId === tmpl.id ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-300" />
                              <span>Đã copy</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              <span>Copy Toàn Bộ Prompt</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
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
                    <p className="text-[11px] text-slate-400 truncate mt-0.5" title={tmpl.name}>
                      {tmpl.name}
                    </p>
                    <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono mt-1">
                      <span>ID: {tmpl.id}</span>
                      <span className="text-purple-400 font-semibold">{tmpl.prompt?.length || 0} ký tự</span>
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

                      {/* Edit Button */}
                      <button
                        type="button"
                        onClick={() => handleEdit(tmpl)}
                        title="Chỉnh sửa tự do Master Prompt và thông tin mẫu"
                        className="px-2.5 py-1.5 bg-purple-600/30 hover:bg-purple-600/50 text-purple-200 border border-purple-500/40 rounded-lg text-xs font-semibold flex items-center gap-1 transition cursor-pointer"
                      >
                        <Edit className="w-3 h-3" />
                        <span>Sửa Prompt</span>
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
          <div className="bg-slate-900 border border-slate-750 rounded-2xl max-w-4xl w-full p-4 sm:p-6 shadow-2xl my-auto space-y-4">
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

              {/* PHẦN MÔ TẢ BỐI CẢNH CŨ (TRÍCH XUẤT ĐỂ COPY & THAM KHẢO) */}
              <div className="bg-gradient-to-r from-amber-950/40 via-amber-900/20 to-slate-900 border border-amber-500/40 rounded-xl p-3.5 space-y-2.5 shadow-inner">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-amber-500/20 pb-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-amber-300">
                    <Wand2 className="w-4 h-4 text-amber-400" />
                    <span>Mô Tả Bối Cảnh Phông Nền Cũ (Trích Xuất Để Bạn Copy):</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        if (currentBgDesc) {
                          navigator.clipboard.writeText(currentBgDesc);
                          showToast('📋 Đã sao chép mô tả bối cảnh cũ vào bộ nhớ tạm!');
                        } else {
                          showToast('⚠️ Chưa có nội dung mô tả bối cảnh để sao chép.');
                        }
                      }}
                      className="px-3 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-500/50 rounded-lg text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-xs"
                    >
                      <Copy className="w-3.5 h-3.5 text-amber-300" />
                      <span>Sao Chép Mô Tả Này</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        if (currentBgDesc) {
                          setEditingTemplate((prev) => ({
                            ...prev,
                            prompt: (prev.prompt ? prev.prompt.trim() + '\n\n' : '') + currentBgDesc.trim(),
                          }));
                          showToast('📥 Đã chèn mô tả vào cuối ô Master Prompt!');
                        }
                      }}
                      className="px-2.5 py-1 bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 rounded-lg text-xs font-medium flex items-center gap-1 transition cursor-pointer"
                    >
                      <span>Chèn Vào Prompt</span>
                    </button>
                  </div>
                </div>

                <textarea
                  rows={3}
                  value={currentBgDesc}
                  onChange={(e) => setCurrentBgDesc(e.target.value)}
                  placeholder="Mô tả bối cảnh phông nền cũ trích xuất từ prompt (Bấm 'Sao Chép Mô Tả Này' để copy và dán vào câu lệnh bên dưới)..."
                  className="w-full p-2.5 bg-slate-950 border border-amber-500/30 rounded-lg text-xs font-mono text-amber-200 placeholder-slate-500 leading-relaxed resize-y focus:outline-none focus:border-amber-400 shadow-inner"
                />

                <div className="flex items-center justify-between text-[11px] text-amber-300/80">
                  <span>💡 Bạn có thể bấm <b>"Sao Chép Mô Tả Này"</b> để copy nhanh và paste vào bất kỳ vị trí nào trong Master Prompt bên dưới.</span>
                  <span className="font-mono text-amber-400/90">{currentBgDesc.length} ký tự</span>
                </div>
              </div>

              {/* FREEFORM MASTER PROMPT EDITOR - NO RIGID MOLDS */}
              <div className="bg-gradient-to-br from-purple-950/40 via-indigo-950/20 to-slate-900 p-4 rounded-2xl border border-purple-500/30 space-y-3 shadow-inner">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-purple-500/20 pb-3">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-purple-400" />
                    <div>
                      <label className="text-xs font-bold text-white flex items-center gap-2">
                        <span>Câu Lệnh Ghép Phông AI (Gemini Master Prompt)</span>
                        <span className="text-rose-400">*</span>
                      </label>
                      <p className="text-[11px] text-purple-300/80">
                        Soạn thảo tự do 100% — AI sẽ nhận và xử lý chính xác toàn bộ câu lệnh này.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-mono text-purple-300 font-semibold bg-purple-500/20 px-2.5 py-1 rounded-full border border-purple-500/30">
                      {editingTemplate.prompt?.length || 0} ký tự • {editingTemplate.prompt ? editingTemplate.prompt.split('\n').length : 0} dòng
                    </span>
                  </div>
                </div>

                {/* Optional Quick Helper Buttons (Chỉ là gợi ý tùy chọn, không ép buộc) */}
                <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                  <span className="text-slate-400 font-medium mr-1 text-[11px]">Công cụ nhanh:</span>

                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm('Chèn cấu trúc gợi ý ngắn gọn vào ô Master Prompt?')) {
                        setEditingTemplate((prev) => ({ ...prev, prompt: CONCISE_PROMPT_SUGGESTION }));
                      }
                    }}
                    className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-purple-300 border border-purple-500/30 rounded-lg font-medium transition cursor-pointer"
                  >
                    🎯 Chèn Mẫu Ngắn Gọn
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm('Chèn cấu trúc gợi ý Studio 12 phần vào ô Master Prompt?')) {
                        setEditingTemplate((prev) => ({ ...prev, prompt: MASTER_PROMPT_TEMPLATE }));
                      }
                    }}
                    className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-indigo-300 border border-indigo-500/30 rounded-lg font-medium transition cursor-pointer"
                  >
                    ⚡ Chèn Mẫu Studio 12 Phần
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (editingTemplate.prompt) {
                        navigator.clipboard.writeText(editingTemplate.prompt);
                        showToast('📋 Đã sao chép Master Prompt vào bộ nhớ tạm!');
                      }
                    }}
                    className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-lg font-medium transition cursor-pointer"
                  >
                    📋 Sao Chép Toàn Bộ
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm('Bạn có chắc muốn xóa trắng ô Master Prompt để viết mới từ đầu?')) {
                        setEditingTemplate((prev) => ({ ...prev, prompt: '' }));
                      }
                    }}
                    className="px-2.5 py-1 bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-800/50 rounded-lg font-medium transition cursor-pointer"
                  >
                    🧹 Xóa Trắng
                  </button>
                </div>

                {/* Freeform Textarea */}
                <textarea
                  rows={13}
                  required
                  value={editingTemplate.prompt || ''}
                  onChange={(e) => setEditingTemplate((prev) => ({ ...prev, prompt: e.target.value }))}
                  placeholder="Nhập toàn bộ câu lệnh Master Prompt tùy ý tại đây (Tiếng Việt hoặc Tiếng Anh, chỉ dẫn bối cảnh, bảo toàn khuôn mặt, ánh sáng, góc máy, chiều sâu trường ảnh...)..."
                  className="w-full p-4 bg-slate-950 border border-slate-750 rounded-xl text-xs font-mono text-emerald-300 placeholder-slate-600 focus:outline-none focus:border-purple-500 leading-relaxed resize-y shadow-inner"
                />

                <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span>
                    Gợi ý: Bạn có thể viết câu lệnh bằng bất kỳ ngôn ngữ nào (Việt / Anh), dài ngắn tùy ý. Không cần tuân theo bất kỳ biến số hay thẻ khuôn mẫu cố định nào.
                  </span>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2.5">
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
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: GLOBAL SYSTEM MASTER PROMPT CONFIGURATION */}
      {isSystemPromptModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm overflow-y-auto animate-fadeIn">
          <div className="bg-slate-900 border border-amber-500/40 rounded-2xl max-w-4xl w-full p-4 sm:p-6 shadow-2xl my-auto space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Sliders className="w-5 h-5 text-amber-400" />
                <div>
                  <h3 className="font-bold text-sm sm:text-base text-white">
                    Cấu Hình Master Prompt Mặc Định Toàn Hệ Thống
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Cấu hình này được lưu trực tiếp trên Firestore database và áp dụng làm mẫu khởi tạo khi tạo phông nền mới.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsSystemPromptModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-amber-300 font-semibold flex items-center gap-1.5">
                  <Wand2 className="w-4 h-4 text-amber-400" />
                  Nội dung Master Prompt Hệ Thống
                </span>
                <span className="text-[11px] font-mono text-slate-400">
                  {systemPromptDraft.length} ký tự • {systemPromptDraft ? systemPromptDraft.split('\n').length : 0} dòng
                </span>
              </div>

              <textarea
                rows={16}
                value={systemPromptDraft}
                onChange={(e) => setSystemPromptDraft(e.target.value)}
                placeholder="Nhập Master Prompt mặc định của hệ thống..."
                className="w-full p-4 bg-slate-950 border border-slate-750 rounded-xl text-xs font-mono text-emerald-300 placeholder-slate-600 focus:outline-none focus:border-amber-400 leading-relaxed resize-y shadow-inner"
              />

              <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm('Khôi phục Master Prompt hệ thống về mẫu gốc chuẩn Studio?')) {
                        setSystemPromptDraft(MASTER_PROMPT_TEMPLATE);
                      }
                    }}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-750 text-slate-300 border border-slate-750 rounded-lg text-xs font-medium flex items-center gap-1 transition"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
                    <span>Mẫu Studio Gốc</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm('Chuyển Master Prompt hệ thống về mẫu súc tích ngắn gọn?')) {
                        setSystemPromptDraft(CONCISE_PROMPT_SUGGESTION);
                      }
                    }}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-750 text-slate-300 border border-slate-750 rounded-lg text-xs font-medium flex items-center gap-1 transition"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                    <span>Mẫu Súc Tích</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(systemPromptDraft);
                      showToast('📋 Đã sao chép Master Prompt hệ thống vào bộ nhớ tạm!');
                    }}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-750 text-slate-300 border border-slate-750 rounded-lg text-xs font-medium flex items-center gap-1 transition"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>Sao Chép</span>
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsSystemPromptModalOpen(false)}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs font-semibold rounded-xl"
                  >
                    Đóng
                  </button>

                  <button
                    type="button"
                    onClick={handleSaveSystemPrompt}
                    disabled={isSavingSystemPrompt}
                    className="px-5 py-2 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-md shadow-amber-600/20 disabled:opacity-50 cursor-pointer"
                  >
                    <Save className="w-4 h-4" />
                    <span>{isSavingSystemPrompt ? 'Đang Lưu...' : 'Lưu Master Prompt Hệ Thống'}</span>
                  </button>
                </div>
              </div>
            </div>
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
                  Mô Tả Bối Cảnh Phông Nền Cũ (Trích Xuất Để Copy):
                </span>
                <button
                  type="button"
                  onClick={() => {
                    const desc = extractBackgroundDescription(viewPromptTemplate.prompt) || viewPromptTemplate.prompt;
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
                {extractBackgroundDescription(viewPromptTemplate.prompt) || 'Không phát hiện mô tả tách biệt (prompt dạng tự do).'}
              </div>
            </div>

            {/* Section: Full Master Prompt */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs text-slate-300 font-semibold">
                <span>Toàn Bộ Master Prompt:</span>
                <span className="text-[11px] font-mono text-purple-400">
                  {viewPromptTemplate.prompt?.length || 0} ký tự • {viewPromptTemplate.prompt ? viewPromptTemplate.prompt.split('\n').length : 0} dòng
                </span>
              </div>
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 max-h-[40vh] overflow-y-auto font-mono text-xs text-emerald-300 leading-relaxed whitespace-pre-wrap shadow-inner">
                {viewPromptTemplate.prompt}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => {
                  handleCopyPrompt(viewPromptTemplate);
                  showToast('📋 Đã sao chép toàn bộ Master Prompt!');
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
                    <span>Sao Chép Toàn Bộ Prompt</span>
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
