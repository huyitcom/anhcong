import React, { useState } from 'react';
import {
  TemplateId,
  TextConfig,
  PosterSettings,
  AspectRatioType,
} from '../types';
import {
  TEMPLATES,
  FONT_OPTIONS,
  COLOR_PRESETS,
  BG_PRESETS,
} from '../data/constants';
import {
  LayoutGrid,
  Type,
  Palette,
  Check,
  ChevronRight,
  Sparkles,
  Wand2,
  Eye,
  EyeOff,
} from 'lucide-react';
import { TemplatePickerModal } from './TemplatePickerModal';
import { useBackgroundTemplates } from '../lib/backgroundTemplatesService';

interface EditorSidebarProps {
  templateId: TemplateId;
  onChangeTemplate: (id: TemplateId) => void;
  textConfig: TextConfig;
  onChangeTextConfig: (updated: TextConfig) => void;
  posterSettings: PosterSettings;
  onChangePosterSettings: (updated: PosterSettings) => void;
  onOpenAIBackground?: (templateId?: string) => void;
}

const TEMPLATE_THUMBNAIL_IMAGES: Record<string, string> = {
  'ai-full-frame': 'https://www.photobookvietnam.net/app/images/background1.jpg',
  'classic-10': 'https://www.photobookvietnam.net/images/thiet-ke-anh-cong-mien-phi-1.jpg',
  'hero-mosaic-13': 'https://www.photobookvietnam.net/images/thiet-ke-anh-cong-mien-phi-2.jpg',
  'editorial-5': 'https://www.photobookvietnam.net/images/thiet-ke-anh-cong-mien-phi-3.jpg',
  'asymmetric-6': 'https://www.photobookvietnam.net/images/thiet-ke-anh-cong-mien-phi-4.jpg',
  'love-banner-8': 'https://www.photobookvietnam.net/images/thiet-ke-anh-cong-mien-phi-5.jpg',
  'heart-mosaic-18': 'https://www.photobookvietnam.net/images/thiet-ke-anh-cong-mien-phi-6.jpg',
  'landscape-trio-10': 'https://www.photobookvietnam.net/images/thiet-ke-anh-cong-mien-phi-7.jpg',
  'landscape-duo-6': 'https://www.photobookvietnam.net/images/thiet-ke-anh-cong-mien-phi-8.jpg',
  'landscape-story-8': 'https://www.photobookvietnam.net/images/thiet-ke-anh-cong-mien-phi-9.jpg',
  'landscape-london-11': 'https://www.photobookvietnam.net/images/thiet-ke-anh-cong-mien-phi-10.jpg',
  'grid-8-center-text': 'https://www.photobookvietnam.net/images/thiet-ke-anh-cong-mien-phi-11.jpg',
  'hero-trio-3': 'https://www.photobookvietnam.net/images/thiet-ke-anh-cong-mien-phi-12.jpg',
  'magazine-8': 'https://www.photobookvietnam.net/images/thiet-ke-anh-cong-mien-phi-13.jpg',
  'asymmetric-7': 'https://www.photobookvietnam.net/images/thiet-ke-anh-cong-mien-phi-14.jpg',
  'standee-sweet-8': 'https://www.photobookvietnam.net/images/thiet-ke-anh-cong-mien-phi-15.jpg',
  'standee-editorial-4': 'https://www.photobookvietnam.net/images/thiet-ke-anh-cong-mien-phi-16.jpg',
  'standee-arch-3': 'https://www.photobookvietnam.net/images/thiet-ke-anh-cong-mien-phi-17.jpg',
  'standee-love-story-5': 'https://www.photobookvietnam.net/images/thiet-ke-anh-cong-mien-phi-18.jpg',
  'standee-welcome-stacked-3': 'https://www.photobookvietnam.net/images/thiet-ke-anh-cong-mien-phi-19.jpg',
  'standee-welcome-grid-6': 'https://www.photobookvietnam.net/images/thiet-ke-anh-cong-mien-phi-20.jpg',
};

export const TemplateThumbnail: React.FC<{ id: string; className?: string }> = ({ id, className = '' }) => {
  const imageUrl = TEMPLATE_THUMBNAIL_IMAGES[id];
  if (imageUrl) {
    return (
      <div className={`w-full h-full bg-stone-100 overflow-hidden flex items-center justify-center ${className}`}>
        <img
          src={imageUrl}
          alt={`Mẫu ${id}`}
          className="w-full h-full object-cover select-none"
          loading="lazy"
          referrerPolicy="no-referrer"
        />
      </div>
    );
  }

  // Visual thumbnail mockups for Standee 80x180 templates
  if (id === 'standee-sweet-8') {
    return (
      <div className={`w-full h-full bg-white flex flex-col p-1 gap-0.5 border border-stone-200 select-none ${className}`}>
        <div className="text-[5px] text-center font-serif text-stone-700 font-bold tracking-tight">SWEET MOMENTS</div>
        <div className="w-full h-[28%] bg-stone-200 rounded-xs flex items-center justify-center text-[7px] text-stone-400">1</div>
        <div className="w-full flex-1 flex flex-col gap-0.5">
          <div className="w-full h-[33%] flex gap-0.5">
            <div className="w-[45%] h-full bg-stone-200 rounded-xs"></div>
            <div className="w-[55%] h-full flex flex-col gap-0.5">
              <div className="w-full h-1/2 bg-stone-200 rounded-xs"></div>
              <div className="w-full h-1/2 bg-stone-200 rounded-xs"></div>
            </div>
          </div>
          <div className="w-full h-[33%] flex gap-0.5">
            <div className="w-[60%] h-full bg-stone-200 rounded-xs"></div>
            <div className="w-[40%] h-full bg-stone-200 rounded-xs"></div>
          </div>
          <div className="w-full h-[34%] flex gap-0.5">
            <div className="w-1/2 h-full bg-stone-200 rounded-xs"></div>
            <div className="w-1/2 h-full bg-stone-200 rounded-xs"></div>
          </div>
        </div>
      </div>
    );
  }

  if (id === 'standee-editorial-4') {
    return (
      <div className={`w-full h-full bg-white flex flex-col p-1 gap-0.5 border border-stone-200 select-none ${className}`}>
        <div className="text-[5px] text-center font-serif text-stone-800 font-bold tracking-widest">SAVE THE DATE</div>
        <div className="w-full h-[25%] bg-stone-200 rounded-xs"></div>
        <div className="w-full h-[35%] flex gap-0.5">
          <div className="w-1/2 h-full flex flex-col justify-between">
            <div className="text-[4px] text-stone-600 font-serif leading-none pt-0.5">Groom<br/><span className="font-bold">HOÀNG ANH</span></div>
            <div className="w-full h-[58%] bg-stone-200 rounded-xs"></div>
          </div>
          <div className="w-1/2 h-full flex flex-col justify-between">
            <div className="w-full h-[58%] bg-stone-200 rounded-xs"></div>
            <div className="text-[4px] text-stone-600 font-serif leading-none pb-0.5">Bride<br/><span className="font-bold">THU HÀ</span></div>
          </div>
        </div>
        <div className="w-full flex-1 bg-stone-200 rounded-xs"></div>
      </div>
    );
  }

  if (id === 'standee-arch-3') {
    return (
      <div className={`w-full h-full bg-white flex flex-col p-1 gap-0.5 border border-stone-200 select-none ${className}`}>
        <div className="flex justify-between items-center px-0.5 text-[4px] text-stone-700">
          <span className="italic font-serif">save the date</span>
          <span>30.04.2026</span>
        </div>
        <div className="w-full h-[40%] flex items-center justify-center p-0.5">
          <div className="w-[85%] h-full rounded-t-full border border-stone-300 p-0.5 flex items-center justify-center">
            <div className="w-full h-full bg-stone-200 rounded-t-full"></div>
          </div>
        </div>
        <div className="text-[3.5px] italic text-center text-stone-500 line-clamp-1 px-0.5 py-0.5">
          Từ khoảnh khắc nhìn thấy nhau...
        </div>
        <div className="w-full flex-1 flex flex-col gap-0.5">
          <div className="w-full h-1/2 bg-stone-200 rounded-xs"></div>
          <div className="w-full h-1/2 bg-stone-200 rounded-xs"></div>
        </div>
      </div>
    );
  }

  if (id === 'standee-welcome-stacked-3') {
    return (
      <div className={`w-full h-full bg-white flex flex-col p-1 border border-stone-200 select-none ${className}`}>
        <div className="w-full flex flex-col items-center justify-center text-center mt-1 mb-1.5">
          <div className="text-[3.5px] font-sans font-bold uppercase leading-[1.3] mb-1">WELCOME TO<br/>THE WEDDING OF</div>
          <div className="w-[8px] h-[0.5px] bg-stone-800 mb-1"></div>
          <div className="text-[3px] font-sans font-bold mb-[3px] tracking-widest">30 - 06 - 2026</div>
          <div className="text-[7px] font-serif uppercase leading-none">HOÀNG ANH</div>
          <div className="text-[3.5px] my-[1px]">*</div>
          <div className="text-[7px] font-serif uppercase leading-none">HÀ VY</div>
        </div>
        <div className="w-full flex-1 flex flex-col gap-[2.5px] px-0.5 pb-0.5">
          <div className="w-full flex-1 bg-stone-200"></div>
          <div className="w-full flex-1 bg-stone-200"></div>
          <div className="w-full flex-1 bg-stone-200"></div>
        </div>
      </div>
    );
  }

  return <div className="w-full h-full bg-stone-100"></div>;
};

export const EditorSidebar: React.FC<EditorSidebarProps> = ({
  templateId,
  onChangeTemplate,
  textConfig,
  onChangeTextConfig,
  posterSettings,
  onChangePosterSettings,
  onOpenAIBackground,
}) => {
  const { activeTemplates } = useBackgroundTemplates();
  const [activeTab, setActiveTab] = useState<'text' | 'style' | 'ai-bg'>('text');
  const [isPickerModalOpen, setIsPickerModalOpen] = useState(false);

  const updateText = (key: keyof TextConfig, value: any) => {
    onChangeTextConfig({ ...textConfig, [key]: value });
  };

  const updateSettings = (key: keyof PosterSettings, value: any) => {
    onChangePosterSettings({ ...posterSettings, [key]: value });
  };

  // Visible quick-access templates (4 items, ensuring active template is visible)
  const visibleTemplates = (() => {
    const firstFour = TEMPLATES.slice(0, 4);
    const isSelectedInFirstFour = firstFour.some((t) => t.id === templateId);
    if (isSelectedInFirstFour) {
      return firstFour;
    }
    const currentTmpl = TEMPLATES.find((t) => t.id === templateId);
    if (currentTmpl) {
      return [...TEMPLATES.slice(0, 3), currentTmpl];
    }
    return firstFour;
  })();

  return (
    <div className="w-full lg:w-96 bg-white border-l border-stone-200 flex flex-col h-full shadow-sm">
      {/* Top row: Layout Templates */}
      <div className="p-3 border-b border-stone-200 bg-stone-50/50">
        <div className="flex items-center justify-between mb-2.5">
          <h3 className="font-semibold text-stone-800 text-[11px] uppercase tracking-wider flex items-center gap-1.5">
            <LayoutGrid className="w-3.5 h-3.5 text-sky-500" />
            Mẫu Layout
          </h3>
          <button
            onClick={() => setIsPickerModalOpen(true)}
            className="text-[11px] font-semibold text-sky-600 hover:text-sky-700 hover:underline flex items-center gap-0.5 transition cursor-pointer"
          >
            <span>Xem tất cả ({TEMPLATES.length})</span>
            <ChevronRight className="w-3 h-3" />
          </button>
        </div>

        <div className="flex items-center gap-2.5 overflow-x-auto pb-1 hide-scrollbar min-h-[116px]">
          {visibleTemplates.map((tmpl) => (
            <button
              key={tmpl.id}
              onClick={() => onChangeTemplate(tmpl.id)}
              title={`${tmpl.name} (${tmpl.slotCount} ảnh)`}
              className={`flex-shrink-0 rounded-xl border-2 transition overflow-hidden relative group cursor-pointer ${
                tmpl.aspectRatio === '3:2' ? 'w-28 h-20' : tmpl.aspectRatio === '80:180' ? 'w-14 h-32' : 'w-20 h-28'
              } ${
                templateId === tmpl.id
                  ? 'border-sky-500 ring-2 ring-sky-500/20 shadow-xs'
                  : 'border-stone-200 hover:border-stone-300 bg-white'
              }`}
            >
              <TemplateThumbnail id={tmpl.id} />
              {templateId === tmpl.id && (
                <div className="absolute top-1 right-1 w-4 h-4 bg-sky-500 rounded-full flex items-center justify-center shadow-sm">
                  <Check className="w-2.5 h-2.5 text-white" />
                </div>
              )}
            </button>
          ))}

          {/* "Xem thêm" Card Button */}
          <button
            onClick={() => setIsPickerModalOpen(true)}
            className="flex-shrink-0 w-20 h-28 rounded-xl border-2 border-dashed border-stone-300 hover:border-sky-500 bg-stone-50 hover:bg-sky-50/50 flex flex-col items-center justify-center p-2 text-stone-600 hover:text-sky-600 transition group cursor-pointer"
            title="Xem toàn bộ kho mẫu layout"
          >
            <div className="w-8 h-8 rounded-full bg-white group-hover:bg-sky-500 group-hover:text-white border border-stone-200 group-hover:border-sky-500 flex items-center justify-center mb-1.5 transition shadow-2xs">
              <LayoutGrid className="w-4 h-4" />
            </div>
            <span className="text-[11px] font-bold text-center leading-tight">
              Xem Thêm
            </span>
            <span className="text-[9px] text-stone-400 group-hover:text-sky-500 mt-0.5 font-medium">
              +{TEMPLATES.length - 4} Mẫu
            </span>
          </button>
        </div>
      </div>

      {/* Template Picker Popup Modal */}
      <TemplatePickerModal
        isOpen={isPickerModalOpen}
        onClose={() => setIsPickerModalOpen(false)}
        currentTemplateId={templateId}
        onSelectTemplate={(id) => {
          onChangeTemplate(id);
          setIsPickerModalOpen(false);
        }}
      />

      {/* Sidebar Navigation Tabs */}
      <div className="grid grid-cols-3 border-b border-stone-200 bg-stone-50/80 p-1 gap-1">
        <button
          onClick={() => setActiveTab('text')}
          className={`flex flex-col items-center justify-center py-2 px-1 text-[11px] font-semibold rounded-xl transition cursor-pointer ${
            activeTab === 'text'
              ? 'bg-white text-sky-600 shadow-xs'
              : 'text-stone-500 hover:text-stone-800'
          }`}
        >
          <Type className="w-4 h-4 mb-0.5" />
          <span>Tùy Chữ</span>
        </button>

        <button
          onClick={() => setActiveTab('style')}
          className={`flex flex-col items-center justify-center py-2 px-1 text-[11px] font-semibold rounded-xl transition cursor-pointer ${
            activeTab === 'style'
              ? 'bg-white text-sky-600 shadow-xs'
              : 'text-stone-500 hover:text-stone-800'
          }`}
        >
          <Palette className="w-4 h-4 mb-0.5" />
          <span>Khung & Nền</span>
        </button>

        <button
          onClick={() => setActiveTab('ai-bg')}
          className={`flex flex-col items-center justify-center py-2 px-1 text-[11px] font-semibold rounded-xl transition relative cursor-pointer ${
            activeTab === 'ai-bg'
              ? 'bg-white text-indigo-600 shadow-xs'
              : 'text-stone-500 hover:text-stone-800'
          }`}
        >
          <Sparkles className="w-4 h-4 mb-0.5 text-indigo-500 animate-pulse" />
          <span className="flex items-center gap-1">
            Thay Nền AI
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
          </span>
        </button>
      </div>

      {/* Sidebar Content Area */}
      <div className="flex-1 overflow-y-auto p-5 space-y-6">
        {/* TAB 1: TEXT & TYPOGRAPHY */}
        {activeTab === 'text' && (
          <div className="space-y-5 animate-fade-in">
            <div className="flex items-center justify-between pb-2 border-b border-stone-100">
              <h3 className="font-semibold text-stone-800 text-sm flex items-center gap-2">
                <Type className="w-4 h-4 text-sky-600" />
                Nội Dung & Phông Chữ
              </h3>
              <span className="text-[11px] text-stone-400">Xem trực tiếp trên bảng</span>
            </div>


            {/* Toggle Show/Hide Text Switch */}
            <div className="bg-stone-50 p-3 rounded-2xl border border-stone-200/80 flex items-center justify-between shadow-2xs">
              <div className="flex items-center gap-2.5">
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors ${
                    textConfig.showText !== false
                      ? 'bg-sky-100 text-sky-600'
                      : 'bg-stone-200 text-stone-500'
                  }`}
                >
                  {textConfig.showText !== false ? (
                    <Eye className="w-4 h-4" />
                  ) : (
                    <EyeOff className="w-4 h-4" />
                  )}
                </div>
                <div>
                  <span className="text-xs font-bold text-stone-800 block">
                    Hiển Thị Chữ Trên Khung
                  </span>
                  <span className="text-[11px] text-stone-500">
                    {textConfig.showText !== false
                      ? 'Đang bật (hiển thị tên dâu rể & ngày cưới)'
                      : 'Đang tắt (ảnh sạch 100% không chữ)'}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => updateText('showText', !(textConfig.showText !== false))}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  textConfig.showText !== false ? 'bg-sky-500' : 'bg-stone-300'
                }`}
                role="switch"
                aria-checked={textConfig.showText !== false}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    textConfig.showText !== false ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Quick Text Color Presets */}
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-2">
                Tone Màu Chữ Nhanh
              </label>
              <div className="flex flex-wrap gap-2">
                {COLOR_PRESETS.map((color) => (
                  <button
                    key={color.value}
                    onClick={() => {
                      updateText('taglineColor', color.value);
                      updateText('dateColor', color.value);
                      updateText('namesColor', color.value);
                    }}
                    title={color.name}
                    className="w-7 h-7 rounded-full border border-stone-300 shadow-xs hover:scale-110 transition flex items-center justify-center"
                    style={{ backgroundColor: color.value }}
                  >
                    {textConfig.namesColor === color.value && (
                      <Check className="w-3.5 h-3.5 text-white drop-shadow-md" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Groom & Bride Names */}
            <div className="bg-stone-50 p-3.5 rounded-2xl border border-stone-200/80 space-y-3">
              <span className="text-xs font-bold text-stone-800 uppercase tracking-wider block">
                Tên Chú Rể & Cô Dâu
              </span>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] text-stone-500 mb-1">Tên Chú Rể</label>
                  <input
                    type="text"
                    value={textConfig.groomName}
                    onChange={(e) => updateText('groomName', e.target.value)}
                    placeholder="TUẤN ANH"
                    className="w-full px-2.5 py-1.5 text-xs border border-stone-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:outline-none bg-white font-medium"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-stone-500 mb-1">Tên Cô Dâu</label>
                  <input
                    type="text"
                    value={textConfig.brideName}
                    onChange={(e) => updateText('brideName', e.target.value)}
                    placeholder="BẢO NGỌC"
                    className="w-full px-2.5 py-1.5 text-xs border border-stone-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:outline-none bg-white font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <div>
                  <label className="block text-[11px] text-stone-500 mb-1">Từ nối (Connector)</label>
                  <input
                    type="text"
                    value={textConfig.connector}
                    onChange={(e) => updateText('connector', e.target.value)}
                    placeholder="and / & / ♥"
                    className="w-full px-2.5 py-1.5 text-xs border border-stone-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:outline-none bg-white font-serif italic"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-stone-500 mb-1">Cỡ Chữ Tên</label>
                  <input
                    type="range"
                    min="16"
                    max="42"
                    value={textConfig.namesFontSize}
                    onChange={(e) => updateText('namesFontSize', parseInt(e.target.value))}
                    className="w-full accent-sky-600 mt-2"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] text-stone-500 mb-1">Phông Chữ Tên Nổi Bật</label>
                <select
                  value={textConfig.namesFont}
                  onChange={(e) => updateText('namesFont', e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs border border-stone-300 rounded-lg bg-white focus:outline-none"
                >
                  {FONT_OPTIONS.map((f) => (
                    <option key={f.family} value={f.family}>
                      {f.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Date Section */}
            <div className="bg-stone-50 p-3.5 rounded-2xl border border-stone-200/80 space-y-3">
              <span className="text-xs font-bold text-stone-800 uppercase tracking-wider block">
                Ngày Cưới (Big Date)
              </span>

              <div>
                <label className="block text-[11px] text-stone-500 mb-1">
                  Chuỗi Ngày (Xuống dòng nếu muốn)
                </label>
                <textarea
                  rows={2}
                  value={textConfig.dateText}
                  onChange={(e) => updateText('dateText', e.target.value)}
                  placeholder="10.06&#10;2024"
                  className="w-full px-2.5 py-1.5 text-xs border border-stone-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:outline-none bg-white font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] text-stone-500 mb-1">Phông Ngày Cưới</label>
                  <select
                    value={textConfig.dateFont}
                    onChange={(e) => updateText('dateFont', e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs border border-stone-300 rounded-lg bg-white"
                  >
                    {FONT_OPTIONS.map((f) => (
                      <option key={f.family} value={f.family}>
                        {f.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] text-stone-500 mb-1">Cỡ Chữ Ngày</label>
                  <input
                    type="range"
                    min="28"
                    max="80"
                    value={textConfig.dateFontSize}
                    onChange={(e) => updateText('dateFontSize', parseInt(e.target.value))}
                    className="w-full accent-sky-600 mt-2"
                  />
                </div>
              </div>
            </div>

            {/* Header Tagline */}
            <div className="bg-stone-50 p-3.5 rounded-2xl border border-stone-200/80 space-y-3">
              <span className="text-xs font-bold text-stone-800 uppercase tracking-wider block">
                Tiêu Đề Đầu (Tagline)
              </span>

              <input
                type="text"
                value={textConfig.tagline}
                onChange={(e) => updateText('tagline', e.target.value)}
                placeholder="SAVE THE DATE"
                className="w-full px-2.5 py-1.5 text-xs border border-stone-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:outline-none bg-white font-medium"
              />

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] text-stone-500 mb-1">Phông Tiêu Đề</label>
                  <select
                    value={textConfig.taglineFont}
                    onChange={(e) => updateText('taglineFont', e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs border border-stone-300 rounded-lg bg-white"
                  >
                    {FONT_OPTIONS.map((f) => (
                      <option key={f.family} value={f.family}>
                        {f.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] text-stone-500 mb-1">Khoảng Cách Chữ</label>
                  <input
                    type="range"
                    min="0"
                    max="10"
                    value={textConfig.taglineLetterSpacing}
                    onChange={(e) => updateText('taglineLetterSpacing', parseInt(e.target.value))}
                    className="w-full accent-sky-600 mt-2"
                  />
                </div>
              </div>
            </div>

            {/* Subtext Footer Note */}
            <div className="bg-stone-50 p-3.5 rounded-2xl border border-stone-200/80 space-y-3">
              <span className="text-xs font-bold text-stone-800 uppercase tracking-wider block">
                Lời Chào / Địa Điểm (Subtext)
              </span>

              <input
                type="text"
                value={textConfig.subtext}
                onChange={(e) => updateText('subtext', e.target.value)}
                placeholder="Rất hân hạnh được đón tiếp quý khách"
                className="w-full px-2.5 py-1.5 text-xs border border-stone-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:outline-none bg-white"
              />
            </div>
          </div>
        )}

        {/* TAB 4: FRAME & BACKGROUND STYLE */}
        {activeTab === 'style' && (
          <div className="space-y-5 animate-fade-in">
            <div className="flex items-center justify-between pb-2 border-b border-stone-100">
              <h3 className="font-semibold text-stone-800 text-sm flex items-center gap-2">
                <Palette className="w-4 h-4 text-sky-600" />
                Màu Nền & Lề Khung
              </h3>
            </div>

            {/* Aspect Ratio Selector */}
            <div className="bg-stone-50 p-3.5 rounded-2xl border border-stone-200/80 space-y-2">
              <span className="text-xs font-bold text-stone-800 uppercase tracking-wider block">
                Kích Thước Ảnh In Cổng Cưới
              </span>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: '2:3', label: '60x90' },
                  { id: '3:2', label: '90x60' },
                  { id: '3:4', label: '50x75' },
                  { id: '22:30', label: '22x30' },
                  { id: '1:1', label: '90x90' },
                  { id: '9:16', label: '60x120' },
                  { id: '80:180', label: '80x180' },
                ].map((ratio) => (
                  <button
                    key={ratio.id}
                    onClick={() => updateSettings('aspectRatio', ratio.id as AspectRatioType)}
                    className={`p-2 text-xs rounded-xl border text-center transition ${
                      posterSettings.aspectRatio === ratio.id
                        ? 'border-sky-600 bg-sky-50 font-semibold text-sky-900'
                        : 'border-stone-200 bg-white hover:bg-stone-100 text-stone-700'
                    }`}
                  >
                    {ratio.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Background Color Presets */}
            <div className="bg-stone-50 p-3.5 rounded-2xl border border-stone-200/80 space-y-2">
              <span className="text-xs font-bold text-stone-800 uppercase tracking-wider block">
                Màu Nền Phông Cưới
              </span>
              <div className="grid grid-cols-3 gap-2">
                {BG_PRESETS.map((preset) => (
                  <button
                    key={preset.value}
                    onClick={() => updateSettings('bgColor', preset.value)}
                    className={`flex flex-col items-center p-2 rounded-xl border text-center transition ${
                      posterSettings.bgColor === preset.value
                        ? 'border-sky-600 ring-2 ring-sky-600/20 bg-white font-medium'
                        : 'border-stone-200 bg-white hover:bg-stone-100'
                    }`}
                  >
                    <span
                      className="w-5 h-5 rounded-full border border-stone-300 mb-1 shadow-xs"
                      style={{ backgroundColor: preset.value }}
                    />
                    <span className="text-[10px] text-stone-700 truncate w-full">
                      {preset.name.split(' ')[0]}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Center Block Bg Color */}
            <div className="bg-stone-50 p-3.5 rounded-2xl border border-stone-200/80 space-y-2">
              <span className="text-xs font-bold text-stone-800 uppercase tracking-wider block">
                Màu Nền Khối Chữ (Nếu Có)
              </span>
              <div className="flex items-center gap-3">
                <div className="relative w-8 h-8 rounded-full border border-stone-300 overflow-hidden shadow-xs cursor-pointer">
                  <input
                    type="color"
                    value={posterSettings.blockBgColor || '#8b988f'}
                    onChange={(e) => updateSettings('blockBgColor', e.target.value)}
                    className="absolute inset-[-10px] w-12 h-12 cursor-pointer"
                  />
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-semibold text-stone-700">Tùy chỉnh màu</span>
                  <span className="text-[10px] text-stone-500 uppercase">{posterSettings.blockBgColor || '#8b988f'}</span>
                </div>
              </div>
            </div>

            {/* Gap Spacing Slider */}
            <div className="bg-stone-50 p-3.5 rounded-2xl border border-stone-200/80 space-y-3">
              <div>
                <div className="flex justify-between text-xs font-semibold text-stone-700 mb-1.5">
                  <span>Khoảng Cách Giữa Các Khung</span>
                  <span className="text-sky-600 font-bold">{posterSettings.gap}px</span>
                </div>

                {/* Quick Gap Preset Buttons */}
                <div className="grid grid-cols-4 gap-1.5 mb-2">
                  {[
                    { label: 'Siêu khít (3px)', value: 3 },
                    { label: 'Chuẩn mẫu (6px)', value: 6 },
                    { label: 'Vừa (10px)', value: 10 },
                    { label: 'Rộng (16px)', value: 16 },
                  ].map((preset) => (
                    <button
                      key={preset.value}
                      onClick={() => updateSettings('gap', preset.value)}
                      className={`py-1 px-1.5 text-[10px] rounded-lg border text-center transition ${
                        posterSettings.gap === preset.value
                          ? 'border-sky-600 bg-sky-50 font-bold text-sky-700'
                          : 'border-stone-200 bg-white hover:bg-stone-100 text-stone-600'
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>

                <input
                  type="range"
                  min="1"
                  max="28"
                  value={posterSettings.gap}
                  onChange={(e) => updateSettings('gap', parseInt(e.target.value))}
                  className="w-full accent-sky-600 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold text-stone-700 mb-1">
                  <span>Khoảng Lề Viền Ngoài (Outer Margin)</span>
                  <span>{posterSettings.outerMargin}px</span>
                </div>
                <input
                  type="range"
                  min="12"
                  max="60"
                  value={posterSettings.outerMargin}
                  onChange={(e) => updateSettings('outerMargin', parseInt(e.target.value))}
                  className="w-full accent-sky-600"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold text-stone-700 mb-1">
                  <span>Bo Góc Khung Ảnh</span>
                  <span>{posterSettings.cornerRadius}px</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="24"
                  value={posterSettings.cornerRadius}
                  onChange={(e) => updateSettings('cornerRadius', parseInt(e.target.value))}
                  className="w-full accent-sky-600"
                />
              </div>
            </div>

            {/* Border Style */}
            <div className="bg-stone-50 p-3.5 rounded-2xl border border-stone-200/80 space-y-2">
              <span className="text-xs font-bold text-stone-800 uppercase tracking-wider block">
                Họa Tiết Viền Bảng Cổng
              </span>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'none', label: 'Không Viền' },
                  { id: 'thin-line', label: 'Viền Mảnh' },
                  { id: 'gold-border', label: 'Viền Vàng Đôi' },
                ].map((style) => (
                  <button
                    key={style.id}
                    onClick={() => updateSettings('borderStyle', style.id)}
                    className={`p-2 text-xs rounded-xl border text-center transition ${
                      posterSettings.borderStyle === style.id
                        ? 'border-sky-600 bg-sky-50 text-sky-900 font-semibold'
                        : 'border-stone-200 bg-white hover:bg-stone-100 text-stone-700'
                    }`}
                  >
                    {style.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: AI BACKGROUNDS */}
        {activeTab === 'ai-bg' && (
          <div className="space-y-4 animate-fade-in">
            {/* Quick Templates Browser */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h5 className="font-bold text-xs text-stone-800 uppercase tracking-wider">
                  Kho Mẫu Phông Nền ({activeTemplates.length} Mẫu)
                </h5>
                <span className="text-[10px] text-stone-400">Bấm để áp dụng</span>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                {activeTemplates.map((tmpl) => (
                  <button
                    key={tmpl.id}
                    type="button"
                    onClick={() => onOpenAIBackground?.(tmpl.id)}
                    className="group text-left rounded-xl overflow-hidden border border-stone-200 hover:border-sky-500 bg-white hover:shadow-xs transition flex flex-col cursor-pointer"
                  >
                    <div className="w-full aspect-[3/4] bg-stone-100 overflow-hidden relative">
                      <img
                        src={tmpl.thumbnailUrl}
                        alt={tmpl.name_vn}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                        loading="lazy"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).src =
                            'https://images.unsplash.com/photo-1519741497674-611481863552?w=500&auto=format&fit=crop&q=80';
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition flex items-end p-2">
                        <span className="text-[10px] text-white font-bold flex items-center gap-1">
                          <Wand2 className="w-3 h-3 text-sky-400" />
                          Chọn mẫu này
                        </span>
                      </div>
                    </div>
                    <div className="p-2">
                      <p className="font-semibold text-xs text-stone-800 truncate group-hover:text-sky-600 transition">
                        {tmpl.name_vn}
                      </p>
                      <p className="text-[10px] text-stone-400 truncate">
                        {tmpl.name}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
