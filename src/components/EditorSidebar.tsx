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
} from 'lucide-react';
import { TemplatePickerModal } from './TemplatePickerModal';

interface EditorSidebarProps {
  templateId: TemplateId;
  onChangeTemplate: (id: TemplateId) => void;
  textConfig: TextConfig;
  onChangeTextConfig: (updated: TextConfig) => void;
  posterSettings: PosterSettings;
  onChangePosterSettings: (updated: PosterSettings) => void;
}

export const TemplateThumbnail: React.FC<{ id: string }> = ({ id }) => {
  if (id === 'classic-10') {
    return (
      <div className="w-full h-full bg-stone-50 p-1 flex flex-col gap-[2px]">
        <div className="flex gap-[2px] h-1/3">
          <div className="bg-stone-200 w-1/3 rounded-sm"></div>
          <div className="bg-stone-200 w-1/3 rounded-sm"></div>
          <div className="bg-stone-200 w-1/3 rounded-sm"></div>
        </div>
        <div className="flex gap-[2px] h-1/3">
          <div className="bg-stone-200 w-1/3 rounded-sm"></div>
          <div className="bg-stone-100 w-1/3 flex flex-col items-center justify-center gap-1">
            <div className="w-4 h-[2px] bg-stone-300 rounded-full"></div>
            <div className="w-6 h-[2px] bg-stone-300 rounded-full"></div>
          </div>
          <div className="bg-stone-200 w-1/3 rounded-sm"></div>
        </div>
        <div className="flex gap-[2px] h-1/3">
          <div className="bg-stone-200 w-1/3 rounded-sm"></div>
          <div className="bg-stone-200 w-1/3 rounded-sm"></div>
          <div className="bg-stone-200 w-1/3 rounded-sm"></div>
        </div>
      </div>
    );
  }
  if (id === 'hero-mosaic-13') {
    return (
      <div className="w-full h-full bg-stone-50 p-1 flex flex-col gap-[2px]">
        {/* Top Hero Photo */}
        <div className="bg-stone-300 w-full h-[40%] rounded-xs"></div>
        {/* Middle 4x3 Grid (12 photos) */}
        <div className="grid grid-cols-4 grid-rows-3 gap-[1.5px] h-[40%]">
          {Array.from({ length: 12 }).map((_, idx) => (
            <div key={idx} className="bg-stone-200 rounded-[1px] w-full h-full"></div>
          ))}
        </div>
        {/* Bottom Typography Lines */}
        <div className="h-[20%] flex flex-col items-center justify-center gap-0.5 px-1">
          <div className="w-8 h-[2px] bg-stone-300 rounded-full"></div>
          <div className="w-12 h-[2px] bg-stone-400 rounded-full"></div>
        </div>
      </div>
    );
  }
  if (id === 'editorial-5') {
    return (
      <div className="w-full h-full bg-stone-50 p-1 flex gap-[2px]">
        {/* Left Column (2 photos) */}
        <div className="w-[58%] flex flex-col gap-[2px] h-full">
          <div className="bg-stone-300 h-[60%] rounded-xs relative p-0.5 flex flex-col justify-start">
            <div className="w-6 h-[1.5px] bg-white/80 rounded-full mb-0.5"></div>
            <div className="w-8 h-[1.5px] bg-white/80 rounded-full"></div>
          </div>
          <div className="bg-stone-200 h-[40%] rounded-xs"></div>
        </div>
        {/* Right Column (3 photos) */}
        <div className="w-[42%] flex flex-col gap-[2px] h-full">
          <div className="bg-stone-200 h-1/3 rounded-xs"></div>
          <div className="bg-stone-200 h-1/3 rounded-xs"></div>
          <div className="bg-stone-200 h-1/3 rounded-xs"></div>
        </div>
      </div>
    );
  }
  if (id === 'asymmetric-6') {
    return (
      <div className="w-full h-full bg-stone-50 p-1 flex gap-[2px]">
        <div className="flex flex-col gap-[2px] w-1/2">
          <div className="bg-stone-200 h-[40%] rounded-sm"></div>
          <div className="bg-stone-200 h-[30%] rounded-sm"></div>
          <div className="bg-stone-200 h-[30%] rounded-sm"></div>
        </div>
        <div className="flex flex-col gap-[2px] w-1/2 pt-2">
          <div className="bg-stone-200 h-[30%] rounded-sm"></div>
          <div className="bg-stone-200 h-[40%] rounded-sm"></div>
          <div className="bg-stone-200 h-[30%] rounded-sm"></div>
        </div>
      </div>
    );
  }
  if (id === 'love-banner-8') {
    return (
      <div className="w-full h-full bg-stone-50 p-1 flex flex-col gap-[2px]">
        <div className="flex gap-[2px] h-[40%]">
          <div className="bg-stone-200 w-1/4 rounded-sm"></div>
          <div className="bg-stone-200 w-1/4 rounded-sm"></div>
          <div className="bg-stone-200 w-1/4 rounded-sm"></div>
          <div className="bg-stone-200 w-1/4 rounded-sm"></div>
        </div>
        <div className="h-[20%] flex items-center justify-center gap-1">
           <div className="w-1.5 h-1.5 rounded-sm bg-sky-200"></div>
           <div className="w-1.5 h-1.5 rounded-sm bg-sky-200"></div>
           <div className="w-1.5 h-1.5 rounded-sm bg-sky-200"></div>
        </div>
        <div className="flex gap-[2px] h-[40%]">
          <div className="bg-stone-200 w-1/4 rounded-sm"></div>
          <div className="bg-stone-200 w-1/4 rounded-sm"></div>
          <div className="bg-stone-200 w-1/4 rounded-sm"></div>
          <div className="bg-stone-200 w-1/4 rounded-sm"></div>
        </div>
      </div>
    );
  }
  if (id === 'heart-mosaic-18') {
    return (
      <div className="w-full h-full bg-stone-50 p-1 flex items-center justify-center">
        <div className="grid grid-cols-5 grid-rows-5 gap-[1px] w-full h-[80%]">
          {/* row 1 */}
          <div/><div className="bg-stone-200 rounded-[1px]"/><div/><div className="bg-stone-200 rounded-[1px]"/><div/>
          {/* row 2 */}
          <div className="bg-stone-200 rounded-[1px]"/><div className="bg-stone-300 rounded-[1px] col-span-3 row-span-2"/><div className="bg-stone-200 rounded-[1px]"/>
          {/* row 3 */}
          <div className="bg-stone-200 rounded-[1px]"/><div className="bg-stone-200 rounded-[1px]"/>
          {/* row 4 */}
          <div/><div className="bg-stone-200 rounded-[1px]"/><div className="bg-stone-200 rounded-[1px]"/><div className="bg-stone-200 rounded-[1px]"/><div/>
          {/* row 5 */}
          <div/><div/><div className="bg-stone-200 rounded-[1px]"/><div/><div/>
        </div>
      </div>
    );
  }
  if (id === 'landscape-trio-10') {
    return (
      <div className="w-full h-full bg-stone-50 p-1 flex gap-[2px]">
        {/* Left Hero */}
        <div className="w-[32%] h-full bg-stone-300 rounded-xs relative p-0.5">
          <div className="w-4 h-[1px] bg-white/90 rounded-full"></div>
        </div>
        {/* Middle 2x4 Matrix */}
        <div className="w-[34%] h-full grid grid-cols-2 grid-rows-4 gap-[1px]">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="bg-stone-200 rounded-[1px] w-full h-full"></div>
          ))}
        </div>
        {/* Right Hero */}
        <div className="w-[34%] h-full bg-stone-300 rounded-xs"></div>
      </div>
    );
  }
  if (id === 'landscape-duo-6') {
    return (
      <div className="w-full h-full bg-stone-50 p-1 flex gap-[2px]">
        {/* Left 2 stacked photos */}
        <div className="w-[46%] h-full flex flex-col gap-[2px]">
          <div className="bg-stone-300 h-[42%] rounded-xs"></div>
          <div className="bg-stone-200 h-[58%] rounded-xs"></div>
        </div>
        {/* Right Typography + 2x2 grid */}
        <div className="w-[54%] h-full flex flex-col gap-[2px]">
          <div className="h-[34%] flex flex-col items-center justify-center gap-0.5">
            <div className="w-6 h-[1.5px] bg-stone-400 rounded-full"></div>
            <div className="w-4 h-[1px] bg-stone-300 rounded-full"></div>
          </div>
          <div className="h-[66%] grid grid-cols-2 grid-rows-2 gap-[1.5px]">
            <div className="bg-stone-200 rounded-[1px]"></div>
            <div className="bg-stone-200 rounded-[1px]"></div>
            <div className="bg-stone-200 rounded-[1px]"></div>
            <div className="bg-stone-200 rounded-[1px]"></div>
          </div>
        </div>
      </div>
    );
  }
  if (id === 'landscape-story-8') {
    return (
      <div className="w-full h-full bg-stone-50 p-1 flex gap-[2px]">
        {/* Left Header + Big Hero */}
        <div className="w-[63%] h-full flex flex-col gap-[2px]">
          <div className="h-[18%] flex flex-col justify-center px-0.5">
            <div className="w-8 h-[1.5px] bg-stone-400 rounded-full mb-0.5"></div>
          </div>
          <div className="h-[82%] bg-stone-300 rounded-xs"></div>
        </div>
        {/* Right 2x4 grid with badge */}
        <div className="w-[37%] h-full grid grid-cols-2 grid-rows-4 gap-[1px]">
          <div className="bg-stone-200 rounded-[1px]"></div>
          <div className="bg-stone-200 rounded-[1px]"></div>
          <div className="bg-stone-200 rounded-[1px]"></div>
          <div className="bg-stone-200 rounded-[1px]"></div>
          <div className="bg-stone-200 rounded-[1px]"></div>
          <div className="bg-stone-200 rounded-[1px]"></div>
          <div className="bg-red-50 border border-red-200 flex items-center justify-center rounded-[1px]">
            <div className="w-1.5 h-1.5 rounded-full bg-red-400"></div>
          </div>
          <div className="bg-stone-200 rounded-[1px]"></div>
        </div>
      </div>
    );
  }
  if (id === 'landscape-london-11') {
    return (
      <div className="w-full h-full bg-stone-50 p-1 flex gap-[2px]">
        {/* Left Column */}
        <div className="w-[30%] h-full flex flex-col gap-[1px]">
          <div className="bg-stone-200 h-[33%] rounded-[1px]"></div>
          <div className="h-[34%] flex gap-[1px]">
            <div className="bg-stone-200 w-1/2 rounded-[1px]"></div>
            <div className="bg-stone-200 w-1/2 rounded-[1px]"></div>
          </div>
          <div className="bg-stone-200 h-[33%] rounded-[1px]"></div>
        </div>
        {/* Center Column with tall middle */}
        <div className="w-[30%] h-full flex flex-col gap-[1px]">
          <div className="bg-stone-200 h-[25%] rounded-[1px]"></div>
          <div className="bg-stone-300 h-[50%] rounded-[1px] relative flex items-center justify-center">
            <div className="w-3 h-[1px] bg-white rounded-full"></div>
          </div>
          <div className="bg-stone-200 h-[25%] rounded-[1px]"></div>
        </div>
        {/* Right Column */}
        <div className="w-[40%] h-full flex flex-col gap-[1px]">
          <div className="bg-stone-200 h-[33%] rounded-[1px]"></div>
          <div className="h-[34%] flex gap-[1px]">
            <div className="bg-stone-200 w-1/2 rounded-[1px]"></div>
            <div className="bg-stone-200 w-1/2 rounded-[1px]"></div>
          </div>
          <div className="bg-stone-200 h-[33%] rounded-[1px]"></div>
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
}) => {
  const [activeTab, setActiveTab] = useState<'text' | 'style'>('text');
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
                tmpl.aspectRatio === '3:2' ? 'w-28 h-20' : 'w-20 h-28'
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
      <div className="grid grid-cols-2 border-b border-stone-200 bg-stone-50/80 p-1">
        <button
          onClick={() => setActiveTab('text')}
          className={`flex flex-col items-center justify-center py-2.5 px-1 text-[11px] font-semibold rounded-xl transition ${
            activeTab === 'text'
              ? 'bg-white text-sky-600 shadow-xs'
              : 'text-stone-500 hover:text-stone-800'
          }`}
        >
          <Type className="w-4 h-4 mb-1" />
          Tùy Chỉnh Chữ
        </button>

        <button
          onClick={() => setActiveTab('style')}
          className={`flex flex-col items-center justify-center py-2.5 px-1 text-[11px] font-semibold rounded-xl transition ${
            activeTab === 'style'
              ? 'bg-white text-sky-600 shadow-xs'
              : 'text-stone-500 hover:text-stone-800'
          }`}
        >
          <Palette className="w-4 h-4 mb-1" />
          Khung & Nền
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
                  { id: '3:2', label: '90 x 60 cm (Ngang)' },
                  { id: '2:3', label: '60 x 90 cm (Đứng)' },
                  { id: '3:4', label: '50 x 75 cm' },
                  { id: '1:1', label: '90 x 90 cm (Vuông)' },
                  { id: '9:16', label: '60 x 120 cm (Dọc)' },
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
      </div>
    </div>
  );
};
