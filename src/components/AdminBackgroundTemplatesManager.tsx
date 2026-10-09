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
} from 'lucide-react';
import {
  useBackgroundTemplates,
  ExtendedBackgroundTemplate,
} from '../lib/backgroundTemplatesService';
import { BACKGROUND_CATEGORIES, MASTER_PROMPT_TEMPLATE } from '../data/backgroundTemplates';

// Helper to generate a slug ID from Vietnamese text
function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
}

// Intelligent helper to extract the specific background description from any prompt format
function extractBackgroundDescription(prompt?: string): string {
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

  // 4. If the prompt is just raw background description (doesn't contain ROLE: or TASK:)
  if (!prompt.includes('ROLE:') && !prompt.includes('TASK:') && !prompt.includes('FIRST: ANALYZE')) {
    return prompt.trim();
  }

  return '';
}

export const AdminBackgroundTemplatesManager: React.FC = () => {
  const {
    allTemplates,
    loading,
    saveTemplate,
    toggleTemplateActive,
    deleteTemplate,
    seedDefaultTemplates,
  } = useBackgroundTemplates();

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showOnlyInactive, setShowOnlyInactive] = useState<boolean>(false);

  // Edit / Add Modal state
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [isEditingNew, setIsEditingNew] = useState<boolean>(false);
  const [useMasterTemplate, setUseMasterTemplate] = useState<boolean>(true);
  const [bgDescriptionInput, setBgDescriptionInput] = useState<string>('');
  const [editingTemplate, setEditingTemplate] = useState<Partial<ExtendedBackgroundTemplate>>({
    id: '',
    name: '',
    name_vn: '',
    thumbnailUrl: '',
    prompt: '',
    category: 'wedding-arch',
    isActive: true,
  });

  // Action status states
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isSeeding, setIsSeeding] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [copiedPromptId, setCopiedPromptId] = useState<string | null>(null);
  const [viewPromptTemplate, setViewPromptTemplate] = useState<ExtendedBackgroundTemplate | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Helper to update background description and sync with master template
  const handleBgDescriptionChange = (desc: string) => {
    setBgDescriptionInput(desc);
    if (useMasterTemplate) {
      const formattedDesc = desc.trim() || '[INSERT BACKGROUND DESCRIPTION HERE]';
      const newPrompt = MASTER_PROMPT_TEMPLATE.replace(
        '[INSERT BACKGROUND DESCRIPTION HERE]',
        formattedDesc
      );
      setEditingTemplate((prev) => ({ ...prev, prompt: newPrompt }));
    }
  };

  // Toggle use master template option
  const handleToggleMasterTemplate = (enabled: boolean) => {
    setUseMasterTemplate(enabled);
    if (enabled) {
      let desc = bgDescriptionInput.trim();
      if (!desc) {
        desc = extractBackgroundDescription(editingTemplate.prompt);
        if (desc) setBgDescriptionInput(desc);
      }
      const formattedDesc = desc || '[INSERT BACKGROUND DESCRIPTION HERE]';
      const newPrompt = MASTER_PROMPT_TEMPLATE.replace(
        '[INSERT BACKGROUND DESCRIPTION HERE]',
        formattedDesc
      );
      setEditingTemplate((prev) => ({ ...prev, prompt: newPrompt }));
    }
  };

  // Open creation modal
  const handleAddNew = () => {
    setUseMasterTemplate(true);
    setBgDescriptionInput('');
    setEditingTemplate({
      id: `custom-template-${Date.now().toString().slice(-4)}`,
      name: 'New Custom Background',
      name_vn: 'Mẫu Phông Mới',
      thumbnailUrl: 'https://www.photobookvietnam.net/app/images/background1.jpg',
      prompt: MASTER_PROMPT_TEMPLATE,
      category: 'wedding-arch',
      isActive: true,
    });
    setIsEditingNew(true);
    setIsEditModalOpen(true);
  };

  // Open edit modal for an existing template
  const handleEdit = (tmpl: ExtendedBackgroundTemplate) => {
    // Extract description from existing template prompt
    const extractedDesc = extractBackgroundDescription(tmpl.prompt);
    setBgDescriptionInput(extractedDesc);
    setUseMasterTemplate(true);

    const formattedDesc = extractedDesc || '[INSERT BACKGROUND DESCRIPTION HERE]';
    const newPrompt = MASTER_PROMPT_TEMPLATE.replace(
      '[INSERT BACKGROUND DESCRIPTION HERE]',
      formattedDesc
    );

    setEditingTemplate({
      ...tmpl,
      prompt: newPrompt,
    });

    setIsEditingNew(false);
    setIsEditModalOpen(true);
  };

  // Duplicate / Clone template
  const handleClone = (tmpl: ExtendedBackgroundTemplate) => {
    const newId = `${tmpl.id}-copy-${Date.now().toString().slice(-4)}`;
    const extractedDesc = extractBackgroundDescription(tmpl.prompt);
    setBgDescriptionInput(extractedDesc);
    setUseMasterTemplate(true);

    const formattedDesc = extractedDesc || '[INSERT BACKGROUND DESCRIPTION HERE]';
    const newPrompt = MASTER_PROMPT_TEMPLATE.replace(
      '[INSERT BACKGROUND DESCRIPTION HERE]',
      formattedDesc
    );

    setEditingTemplate({
      ...tmpl,
      id: newId,
      name_vn: `${tmpl.name_vn} (Bản sao)`,
      name: `${tmpl.name} (Copy)`,
      prompt: newPrompt,
      isActive: true,
    });
    setIsEditingNew(true);
    setIsEditModalOpen(true);
  };

  // Save template handler
  const handleSaveTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTemplate.id || !editingTemplate.name_vn || !editingTemplate.thumbnailUrl || !editingTemplate.prompt) {
      showToast('⚠️ Vui lòng điền đầy đủ Mã ID, Tên tiếng Việt, Link ảnh và Prompt!');
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
      showToast(`🎉 Đã lưu mẫu "${editingTemplate.name_vn}" thành công!`);
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
  const handleCopyPrompt = (tmpl: ExtendedBackgroundTemplate) => {
    navigator.clipboard.writeText(tmpl.prompt);
    setCopiedPromptId(tmpl.id);
    setTimeout(() => setCopiedPromptId(null), 2500);
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
              <span>Quản Lý Kho Mẫu Phông Nền AI ({allTemplates.length} Mẫu)</span>
              <span className="text-[11px] font-semibold bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded-full border border-purple-500/30">
                {activeCount} Đang bật • {inactiveCount} Đã tắt
              </span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Thêm mới, chỉnh sửa tên, link ảnh thumbnail, cập nhật AI Prompt và phân loại danh mục phông nền cho người dùng.
            </p>
          </div>

          {/* Top Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
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
              title="Lưu toàn bộ mẫu mặc định lên Database Firestore"
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-xs rounded-xl flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSeeding ? 'animate-spin text-purple-400' : ''}`} />
              <span>{isSeeding ? 'Đang đồng bộ...' : 'Đồng Bộ 32+ Mẫu Lên DB'}</span>
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

                  {/* Hover Quick Background Description Preview Overlay */}
                  <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-xs opacity-0 group-hover:opacity-100 transition-opacity p-3 flex flex-col justify-between text-xs">
                    <div className="space-y-1.5 overflow-hidden">
                      <div className="text-[10px] font-bold uppercase text-amber-300 flex items-center gap-1">
                        <Wand2 className="w-3 h-3 text-amber-400" />
                        <span>Mô Tả Bối Cảnh Phông Nền:</span>
                      </div>
                      <p className="text-[11px] text-slate-200 line-clamp-6 leading-relaxed font-normal">
                        "{extractBackgroundDescription(tmpl.prompt) || tmpl.prompt}"
                      </p>
                    </div>

                    <div className="pt-2 border-t border-slate-800 flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => setViewPromptTemplate(tmpl)}
                        className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] rounded-lg font-medium flex items-center gap-1"
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
                            <span>Copy Prompt</span>
                          </>
                        )}
                      </button>
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
                    <p className="text-[10px] font-mono text-slate-500 truncate mt-0.5">
                      ID: {tmpl.id}
                    </p>
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
                        title="Chỉnh sửa mẫu này"
                        className="px-2.5 py-1.5 bg-purple-600/30 hover:bg-purple-600/50 text-purple-200 border border-purple-500/40 rounded-lg text-xs font-semibold flex items-center gap-1 transition cursor-pointer"
                      >
                        <Edit className="w-3 h-3" />
                        <span>Sửa</span>
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

      {/* MODAL 1: ADD / EDIT TEMPLATE MODAL */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md animate-fadeIn overflow-y-auto">
          <div className="bg-slate-900 border border-slate-750 text-white rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl max-h-[92vh] flex flex-col my-auto">
            {/* Modal Header */}
            <div className="px-5 py-3.5 border-b border-slate-800 bg-slate-850 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-purple-600 flex items-center justify-center text-white">
                  <Wand2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-white">
                    {isEditingNew ? 'Thêm Mẫu Phông Nền AI Mới' : `Chỉnh Sửa Mẫu: ${editingTemplate.name_vn}`}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Cấu hình tên hiển thị, ảnh thumbnail và prompt kỹ thuật cho AI Gemini
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form Body */}
            <form onSubmit={handleSaveTemplate} className="p-5 overflow-y-auto space-y-4 flex-1">
              {/* Grid 2 Columns for Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Left col */}
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Tên Tiếng Việt (Hiển thị khách) <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ví dụ: Cổng Hoa Hồng Cung Điện"
                      value={editingTemplate.name_vn || ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        setEditingTemplate((prev) => ({
                          ...prev,
                          name_vn: val,
                          id: isEditingNew && !prev.id?.includes('custom') ? slugify(val) : prev.id,
                        }));
                      }}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Tên Tiếng Anh (Mô tả phụ)
                    </label>
                    <input
                      type="text"
                      placeholder="Ví dụ: Royal Palace Floral Arch"
                      value={editingTemplate.name || ''}
                      onChange={(e) => setEditingTemplate((prev) => ({ ...prev, name: e.target.value }))}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Mã ID Định Danh (Slug) <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="cong-hoa-hong-cung-dien"
                      value={editingTemplate.id || ''}
                      disabled={!isEditingNew}
                      onChange={(e) => setEditingTemplate((prev) => ({ ...prev, id: slugify(e.target.value) }))}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs font-mono text-purple-300 placeholder-slate-500 focus:outline-none focus:border-purple-500 disabled:opacity-60"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Danh Mục Phân Loại <span className="text-rose-400">*</span>
                    </label>
                    <select
                      value={editingTemplate.category || 'wedding-arch'}
                      onChange={(e) => setEditingTemplate((prev) => ({ ...prev, category: e.target.value as any }))}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-purple-500 cursor-pointer"
                    >
                      <option value="wedding-arch">Cổng hoa & Tiệc cưới</option>
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

              {/* Master Template Toggle & Background Description Input */}
              <div className="bg-gradient-to-br from-purple-950/40 via-indigo-950/30 to-slate-900 p-4 rounded-2xl border border-purple-500/30 space-y-3 shadow-inner">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-purple-500/20 pb-3">
                  <label className="flex items-center gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={useMasterTemplate}
                      onChange={(e) => handleToggleMasterTemplate(e.target.checked)}
                      className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500 border-slate-700 bg-slate-800 cursor-pointer"
                    />
                    <span className="text-xs font-bold text-white flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-purple-400 animate-pulse" />
                      Sử dụng cấu trúc Prompt Chuẩn Studio Cao Cấp
                    </span>
                  </label>

                  <span className="text-[10px] bg-purple-500/20 text-purple-300 px-2.5 py-1 rounded-full border border-purple-500/40 font-semibold self-start sm:self-auto shrink-0">
                    {useMasterTemplate ? 'Đang kích hoạt Master Template' : 'Chế độ soạn thảo tự do'}
                  </span>
                </div>

                {/* Input for Background Description when Master Template is enabled */}
                {useMasterTemplate ? (
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                      <Wand2 className="w-3.5 h-3.5 text-amber-400" />
                      <span>Mô Tả Bối Cảnh Phông Nền (Background Description): <span className="text-rose-400">*</span></span>
                    </label>

                    <textarea
                      rows={4}
                      required
                      value={bgDescriptionInput}
                      onChange={(e) => handleBgDescriptionChange(e.target.value)}
                      placeholder="Ví dụ: A magnificent, romantic wedding floral archway with lush blush pink roses, creamy white peonies, and eucalyptus greenery. Soft golden sunlight entering from the left, delicate rose petals on the polished marble floor. Vertical 9:16 composition."
                      className="w-full p-3 bg-slate-950 border-2 border-amber-500/40 rounded-xl text-xs font-mono text-amber-200 placeholder-slate-500 focus:outline-none focus:border-amber-400 leading-relaxed resize-y"
                    />
                  </div>
                ) : null}
              </div>

              {/* Full Width Prompt Editor / Live Preview */}
              <div className="space-y-1.5 pt-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                    <span>
                      Lệnh Ghép Phông AI (Gemini Master Prompt)
                      <span className="text-rose-400">*</span>
                    </span>
                  </label>
                  <span className="text-[11px] font-mono text-purple-400 font-semibold">
                    {editingTemplate.prompt?.length || 0} ký tự (Có thể chỉnh sửa trực tiếp)
                  </span>
                </div>

                <textarea
                  rows={9}
                  required
                  value={editingTemplate.prompt || ''}
                  onChange={(e) => setEditingTemplate((prev) => ({ ...prev, prompt: e.target.value }))}
                  placeholder="Nhập câu lệnh hướng dẫn AI thay nền chi tiết tại đây..."
                  className="w-full p-3.5 bg-slate-950 border border-slate-750 rounded-xl text-xs font-mono text-emerald-300 placeholder-slate-600 focus:outline-none focus:border-purple-500 leading-relaxed resize-y shadow-inner"
                />
              </div>

              {/* Submit Buttons */}
              <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-2.5">
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
                  <span>{isSaving ? 'Đang Lưu...' : 'Lưu Mẫu Phông Nền'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: FULL PROMPT VIEWER */}
      {viewPromptTemplate && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-750 text-white rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl space-y-4 p-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-purple-400" />
                <h3 className="font-bold text-sm text-white">
                  Chi Tiết Prompt: {viewPromptTemplate.name_vn}
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

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 max-h-96 overflow-y-auto font-mono text-xs text-emerald-300 leading-relaxed whitespace-pre-wrap">
              {viewPromptTemplate.prompt}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => handleCopyPrompt(viewPromptTemplate)}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5"
              >
                {copiedPromptId === viewPromptTemplate.id ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-300" />
                    <span>Đã Sao Chép!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Sao Chép Toàn Bộ</span>
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => setViewPromptTemplate(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-[100] flex items-center gap-3 px-5 py-3.5 bg-slate-900/95 text-white font-semibold text-xs rounded-2xl shadow-2xl shadow-purple-950/80 border border-purple-500/50 backdrop-blur-md animate-fade-in transition-all">
          <Sparkles className="w-4 h-4 text-purple-400 shrink-0 animate-pulse" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
};
