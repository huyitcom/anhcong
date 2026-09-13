import React, { useState } from 'react';
import { X, Check, LayoutGrid } from 'lucide-react';
import { TemplateId, TemplateDefinition } from '../types';
import { TEMPLATES } from '../data/constants';
import { TemplateThumbnail } from './EditorSidebar';

interface TemplatePickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTemplateId: TemplateId;
  onSelectTemplate: (id: TemplateId) => void;
}

export const TemplatePickerModal: React.FC<TemplatePickerModalProps> = ({
  isOpen,
  onClose,
  currentTemplateId,
  onSelectTemplate,
}) => {
  const [filter, setFilter] = useState<'all' | 'anh-cong' | 'hop-album' | 'standee'>('all');

  if (!isOpen) return null;

  const filteredTemplates = TEMPLATES.filter((tmpl) => {
    if (filter === 'anh-cong') return tmpl.category === 'anh-cong';
    if (filter === 'hop-album') return tmpl.category === 'hop-album';
    if (filter === 'standee') return tmpl.category === 'standee';
    return true;
  });

  const handleSelect = (tmpl: TemplateDefinition) => {
    onSelectTemplate(tmpl.id);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stone-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-4xl max-h-[92vh] sm:max-h-[90vh] bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-stone-200 flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 sm:px-6 sm:py-4 border-b border-stone-100 bg-stone-50/80">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-sky-100 text-sky-600 flex items-center justify-center shadow-xs shrink-0">
              <LayoutGrid className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-stone-900 flex items-center gap-2">
                <span className="sm:hidden">Mẫu Layout</span>
                <span className="hidden sm:inline">Kho Mẫu Layout Cổng Cưới</span>
                <span className="hidden sm:inline-block text-xs px-2 py-0.5 rounded-full bg-sky-100 text-sky-700 font-semibold">
                  {TEMPLATES.length} Mẫu
                </span>
              </h2>
              <p className="hidden sm:block text-xs text-stone-500">
                Chọn mẫu bố cục phù hợp với ý thích và số lượng ảnh của bạn
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 sm:p-2 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-full transition cursor-pointer"
            aria-label="Đóng"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter Categories: Ảnh cổng (1-10) | Hộp đựng album (11-14) | Standee (15-17) */}
        <div className="flex px-3 sm:px-6 py-2.5 sm:py-3 border-b border-stone-100 bg-white items-center justify-between overflow-x-auto hide-scrollbar gap-2">
          <div className="flex items-center gap-1.5 p-1 bg-stone-100 rounded-xl shrink-0">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition cursor-pointer whitespace-nowrap ${
                filter === 'all'
                  ? 'bg-white text-sky-600 shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Tất Cả ({TEMPLATES.length})
            </button>
            <button
              onClick={() => setFilter('anh-cong')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition cursor-pointer whitespace-nowrap ${
                filter === 'anh-cong'
                  ? 'bg-white text-sky-600 shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Ảnh cổng ({TEMPLATES.filter((t) => t.category === 'anh-cong').length})
            </button>
            <button
              onClick={() => setFilter('hop-album')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition cursor-pointer whitespace-nowrap ${
                filter === 'hop-album'
                  ? 'bg-white text-sky-600 shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Hộp đựng album ({TEMPLATES.filter((t) => t.category === 'hop-album').length})
            </button>
            <button
              onClick={() => setFilter('standee')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition cursor-pointer whitespace-nowrap ${
                filter === 'standee'
                  ? 'bg-white text-sky-600 shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Standee ({TEMPLATES.filter((t) => t.category === 'standee').length})
            </button>
          </div>

          <span className="hidden md:inline-block text-xs text-stone-400 italic shrink-0">
            * Bấm vào mẫu để áp dụng ngay lên bản thiết kế
          </span>
        </div>

        {/* Templates Grid Content */}
        <div className="flex-1 overflow-y-auto p-3.5 sm:p-6 bg-stone-50/50">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
            {filteredTemplates.map((tmpl) => {
              const isSelected = currentTemplateId === tmpl.id;
              const isLandscape = tmpl.aspectRatio === '3:2';
              const isStandee = tmpl.aspectRatio === '80:180';

              return (
                <div
                  key={tmpl.id}
                  onClick={() => handleSelect(tmpl)}
                  className={`group relative flex flex-col bg-white rounded-2xl border-2 transition-all duration-200 cursor-pointer overflow-hidden p-3 ${
                    isLandscape && filter === 'all' ? 'col-span-2 sm:col-span-2' : ''
                  } ${
                    isSelected
                      ? 'border-sky-500 ring-4 ring-sky-500/15 shadow-md bg-sky-50/20'
                      : 'border-stone-200 hover:border-sky-400 hover:shadow-md'
                  }`}
                >
                  {/* Selected Badge */}
                  {isSelected && (
                    <div className="absolute top-3.5 right-3.5 z-20 flex items-center justify-center w-6 h-6 bg-sky-500 text-white rounded-full shadow-md">
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </div>
                  )}

                  {/* Thumbnail Container */}
                  <div
                    className={`w-full flex items-center justify-center bg-stone-100/80 rounded-xl overflow-hidden p-2.5 transition-colors group-hover:bg-stone-100 ${
                      isLandscape
                        ? 'aspect-[3/2]'
                        : tmpl.aspectRatio === '22:30'
                        ? 'aspect-[22/30]'
                        : isStandee
                        ? 'aspect-[80/180]'
                        : 'aspect-[2/3]'
                    }`}
                  >
                    <div
                      className={`shadow-sm border border-stone-200/90 rounded-md overflow-hidden transition-transform duration-200 group-hover:scale-[1.02] ${
                        isLandscape
                          ? 'w-full h-full aspect-[3/2]'
                          : tmpl.aspectRatio === '22:30'
                          ? 'w-full h-full aspect-[22/30]'
                          : isStandee
                          ? 'w-full h-full aspect-[80/180]'
                          : 'w-full h-full aspect-[2/3]'
                      }`}
                    >
                      <TemplateThumbnail id={tmpl.id} />
                    </div>
                  </div>

                  {/* Compact Header Info */}
                  <div className="pt-2.5 px-0.5 flex items-center justify-between gap-1.5">
                    <h3 className="font-bold text-stone-800 text-xs truncate group-hover:text-sky-600 transition">
                      {tmpl.name}
                    </h3>
                    <span
                      className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md shrink-0 ${
                        tmpl.category === 'anh-cong'
                          ? isLandscape ? 'bg-amber-100 text-amber-800' : 'bg-sky-100 text-sky-800'
                          : tmpl.category === 'hop-album'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {tmpl.category === 'anh-cong'
                        ? isLandscape ? 'Ảnh cổng • 90x60' : 'Ảnh cổng • 60x90'
                        : tmpl.category === 'hop-album'
                        ? 'Hộp album • 22x30'
                        : 'Standee • 80x180'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 py-3 sm:px-6 sm:py-3.5 border-t border-stone-100 bg-white flex items-center justify-between">
          <span className="text-xs text-stone-500">
            <span className="hidden sm:inline">Tổng cộng: </span>
            <strong className="text-stone-800">{TEMPLATES.length} mẫu</strong>
            <span className="hidden sm:inline"> thiết kế (Đã tối ưu hóa bố cục in ấn)</span>
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 sm:px-5 sm:py-2 text-xs font-semibold text-white bg-stone-900 hover:bg-stone-800 rounded-xl transition shadow-xs cursor-pointer"
          >
            Hoàn tất
          </button>
        </div>
      </div>
    </div>
  );
};
