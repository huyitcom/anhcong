import React from 'react';
import { FrameSlot, PosterSettings, TemplateId, TextConfig } from '../types';
import { PHOTO_FILTERS } from '../data/constants';
import { Upload, Sliders, Plus } from 'lucide-react';

interface PosterCanvasProps {
  templateId: TemplateId;
  slots: FrameSlot[];
  textConfig: TextConfig;
  posterSettings: PosterSettings;
  activeSlotIndex: number | null;
  onSelectSlot: (index: number) => void;
  onSlotImageChange: (index: number, imageUri: string) => void;
  onOpenCropModal: (slot: FrameSlot, index: number) => void;
  posterRef: React.RefObject<HTMLDivElement | null>;
}

export const PosterCanvas: React.FC<PosterCanvasProps> = ({
  templateId,
  slots,
  textConfig,
  posterSettings,
  activeSlotIndex,
  onSelectSlot,
  onSlotImageChange,
  onOpenCropModal,
  posterRef,
}) => {
  const getFilterStyle = (filterId: string) => {
    const f = PHOTO_FILTERS.find((item) => item.id === filterId);
    return f ? f.css : 'none';
  };

  const handleSingleFileInput = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          onSlotImageChange(index, event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const renderSlot = (index: number, className: string = '') => {
    const slot = slots[index] || {
      id: `slot-${index}`,
      imageUri: null,
      zoom: 1,
      offsetX: 0,
      offsetY: 0,
      filter: 'none',
    };

    const isFilled = Boolean(slot.imageUri);
    const filterCss = getFilterStyle(slot.filter);

    return (
      <div
        key={slot.id || index}
        onClick={() => onSelectSlot(index)}
        className={`relative group overflow-hidden transition-all duration-200 cursor-pointer ${activeSlotIndex === index ? 'ring-2 ring-sky-500 ring-offset-1' : ''} ${className}`}
        style={{
          borderRadius: `${posterSettings.cornerRadius}px`,
          backgroundColor: '#f5f5f4',
        }}
      >
        <input
          type="file"
          accept="image/*"
          id={`file-input-${index}`}
          className="hidden"
          onChange={(e) => handleSingleFileInput(index, e)}
        />

        {isFilled ? (
          <>
            <img
              src={slot.imageUri!}
              alt={`Frame ${index + 1}`}
              className="w-full h-full object-cover transition-transform duration-100 pointer-events-none"
              style={{
                transform: `scale(${slot.zoom}) translate(${slot.offsetX}%, ${slot.offsetY}%) rotate(${slot.rotation || 0}deg)`,
                filter: filterCss,
              }}
            />

            {/* Hover Actions Bar */}
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-2 p-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenCropModal(slot, index);
                }}
                className="flex items-center gap-1 bg-white/95 hover:bg-white text-stone-900 text-xs font-medium px-2.5 py-1.5 rounded-lg shadow-md transition scale-95 hover:scale-100"
              >
                <Sliders className="w-3.5 h-3.5 text-sky-600" />
                Sửa Ảnh
              </button>
              <label
                htmlFor={`file-input-${index}`}
                onClick={(e) => e.stopPropagation()}
                className="flex items-center gap-1 bg-stone-900/90 hover:bg-black text-white text-xs font-medium px-2.5 py-1.5 rounded-lg shadow-md transition cursor-pointer scale-95 hover:scale-100"
              >
                <Upload className="w-3.5 h-3.5" />
                Đổi Ảnh
              </label>
            </div>
          </>
        ) : (
          <label
            htmlFor={`file-input-${index}`}
            className="w-full h-full flex flex-col items-center justify-center p-3 text-stone-400 hover:text-stone-600 hover:bg-stone-200/60 transition cursor-pointer border border-dashed border-stone-300 rounded-lg group/placeholder"
          >
            <div className="w-8 h-8 rounded-full bg-white shadow-xs flex items-center justify-center mb-1 group-hover/placeholder:scale-110 transition">
              <Plus className="w-4 h-4 text-stone-500" />
            </div>
            <span className="text-[11px] font-medium text-stone-500 text-center">
              Khung #{index + 1}
            </span>
            <span className="text-[9px] text-stone-400 text-center">Bấm để tải ảnh</span>
          </label>
        )}
      </div>
    );
  };

  const renderTypographyBlock = () => {
    return (
      <div className="flex flex-col items-center justify-center text-center p-1 sm:p-2 h-full select-none">
        {/* Tagline */}
        {textConfig.tagline && (
          <p
            style={{
              fontFamily: textConfig.taglineFont,
              fontSize: `${textConfig.taglineFontSize}px`,
              color: textConfig.taglineColor,
              letterSpacing: `${textConfig.taglineLetterSpacing}px`,
              textTransform: textConfig.textUppercase ? 'uppercase' : 'none',
            }}
            className="font-semibold mb-2 leading-tight tracking-widest"
          >
            {textConfig.tagline}
          </p>
        )}

        {/* Date Display */}
        {textConfig.dateText && (
          <div
            style={{
              fontFamily: textConfig.dateFont,
              fontSize: `${textConfig.dateFontSize}px`,
              color: textConfig.dateColor,
              letterSpacing: `${textConfig.dateLetterSpacing}px`,
            }}
            className="font-extrabold my-2 leading-[0.95] whitespace-pre-line tracking-tight"
          >
            {textConfig.dateText}
          </div>
        )}

        {/* Couple Names Block */}
        <div className="mt-3 mb-2 flex flex-col items-center">
          <span
            style={{
              fontFamily: textConfig.namesFont,
              fontSize: `${textConfig.namesFontSize}px`,
              color: textConfig.namesColor,
              textTransform: textConfig.textUppercase ? 'uppercase' : 'none',
            }}
            className="font-bold tracking-wider leading-snug"
          >
            {textConfig.groomName}
          </span>

          <span
            style={{
              fontFamily: textConfig.connectorFont,
              fontSize: `${Math.round(textConfig.namesFontSize * 0.95)}px`,
              color: textConfig.namesColor,
            }}
            className="my-0.5 font-normal italic"
          >
            {textConfig.connector}
          </span>

          <span
            style={{
              fontFamily: textConfig.namesFont,
              fontSize: `${textConfig.namesFontSize}px`,
              color: textConfig.namesColor,
              textTransform: textConfig.textUppercase ? 'uppercase' : 'none',
            }}
            className="font-bold tracking-wider leading-snug"
          >
            {textConfig.brideName}
          </span>
        </div>

        {/* Subtext */}
        {textConfig.subtext && (
          <p
            style={{
              fontFamily: textConfig.subtextFont,
              fontSize: `${textConfig.subtextFontSize}px`,
              color: textConfig.subtextColor,
            }}
            className="mt-2 text-stone-600 tracking-wide font-light max-w-xs"
          >
            {textConfig.subtext}
          </p>
        )}
      </div>
    );
  };

  return (
    <div className="w-full flex justify-center items-center py-4 px-2">
      <div
        id="poster-root"
        ref={posterRef}
        className="relative bg-white shadow-2xl transition-all duration-300 overflow-hidden flex flex-col"
        style={{
          width: '100%',
          maxWidth: '560px',
          aspectRatio:
            posterSettings.aspectRatio === '2:3'
              ? '2 / 3'
              : posterSettings.aspectRatio === '3:4'
              ? '3 / 4'
              : posterSettings.aspectRatio === '1:1'
              ? '1 / 1'
              : '9 / 16',
          backgroundColor: posterSettings.bgColor,
          padding: `${posterSettings.outerMargin}px`,
          border:
            posterSettings.borderStyle === 'thin-line'
              ? `1px solid ${posterSettings.borderColor}`
              : posterSettings.borderStyle === 'gold-border'
              ? `3px double #d97706`
              : 'none',
        }}
      >
        {/* Decorative inner line frame if gold border style */}
        {posterSettings.borderStyle === 'double-frame' && (
          <div
            className="absolute inset-3 border border-amber-500/40 pointer-events-none rounded-xs"
            style={{ margin: `${posterSettings.outerMargin - 8}px` }}
          />
        )}

        {/* Layout Template 1: Classic 10-Grid (Exact layout from user's sample) */}
        {templateId === 'classic-10' && (
          <div
            className="w-full h-full grid grid-cols-3 grid-rows-4"
            style={{ gap: `${posterSettings.gap}px` }}
          >
            {/* Row 1: Top 3 photos */}
            {renderSlot(0, 'col-start-1 row-start-1 w-full h-full')}
            {renderSlot(1, 'col-start-2 row-start-1 w-full h-full')}
            {renderSlot(2, 'col-start-3 row-start-1 w-full h-full')}

            {/* Row 2: Left & Right photos */}
            {renderSlot(3, 'col-start-1 row-start-2 w-full h-full')}

            {/* Center Typography Block spanning row 2 and row 3 in column 2 */}
            <div className="col-start-2 row-start-2 row-span-2 w-full h-full flex items-center justify-center overflow-hidden">
              {renderTypographyBlock()}
            </div>

            {renderSlot(4, 'col-start-3 row-start-2 w-full h-full')}

            {/* Row 3: Left & Right photos */}
            {renderSlot(5, 'col-start-1 row-start-3 w-full h-full')}
            {renderSlot(6, 'col-start-3 row-start-3 w-full h-full')}

            {/* Row 4: Bottom 3 photos */}
            {renderSlot(7, 'col-start-1 row-start-4 w-full h-full')}
            {renderSlot(8, 'col-start-2 row-start-4 w-full h-full')}
            {renderSlot(9, 'col-start-3 row-start-4 w-full h-full')}
          </div>
        )}

        {/* Layout Template 2: Asymmetric 6 Photo Grid with Bottom Typography */}
        {templateId === 'asymmetric-6' && (
          <div className="w-full h-full flex flex-col justify-between overflow-hidden" style={{ gap: `${posterSettings.gap}px` }}>
            {/* Top 6-Photo Asymmetric Wall (approx 72% height) */}
            <div className="flex-1 flex flex-col justify-between min-h-0" style={{ gap: `${posterSettings.gap}px` }}>
              {/* Row 1: Left 42%, Right 58% */}
              <div className="flex-1 flex min-h-0" style={{ gap: `${posterSettings.gap}px` }}>
                {renderSlot(0, 'w-[42%] h-full')}
                {renderSlot(1, 'w-[58%] h-full')}
              </div>

              {/* Row 2: Left 58%, Right 42% (Inverted) */}
              <div className="flex-1 flex min-h-0" style={{ gap: `${posterSettings.gap}px` }}>
                {renderSlot(2, 'w-[58%] h-full')}
                {renderSlot(3, 'w-[42%] h-full')}
              </div>

              {/* Row 3: Left 42%, Right 58% */}
              <div className="flex-1 flex min-h-0" style={{ gap: `${posterSettings.gap}px` }}>
                {renderSlot(4, 'w-[42%] h-full')}
                {renderSlot(5, 'w-[58%] h-full')}
              </div>
            </div>

            {/* Bottom Elegant Typography Banner */}
            <div className="pt-2 pb-1 px-2 flex flex-col items-center justify-center text-center relative shrink-0">
              {/* Custom Save the Date with Cursive 'the' */}
              <div className="flex items-center justify-center gap-2 mb-0.5">
                <span
                  style={{
                    fontFamily: textConfig.taglineFont,
                    color: textConfig.taglineColor,
                    letterSpacing: '3px',
                  }}
                  className="font-bold text-xs sm:text-sm uppercase"
                >
                  SAVE
                </span>
                <span
                  style={{
                    fontFamily: 'Great Vibes',
                    color: textConfig.taglineColor,
                  }}
                  className="text-lg sm:text-xl italic font-normal -my-1"
                >
                  the
                </span>
                <span
                  style={{
                    fontFamily: textConfig.taglineFont,
                    color: textConfig.taglineColor,
                    letterSpacing: '3px',
                  }}
                  className="font-bold text-xs sm:text-sm uppercase"
                >
                  DATE
                </span>
              </div>

              {/* Names */}
              <div className="my-0.5">
                <span
                  style={{
                    fontFamily: textConfig.namesFont,
                    fontSize: `${Math.max(textConfig.namesFontSize, 20)}px`,
                    color: textConfig.namesColor,
                  }}
                  className="font-extrabold tracking-wider uppercase"
                >
                  {textConfig.groomName} {textConfig.connector} {textConfig.brideName}
                </span>
              </div>

              {/* Quote / Subtext */}
              {textConfig.subtext && (
                <p
                  style={{
                    fontFamily: textConfig.subtextFont,
                    color: textConfig.subtextColor,
                  }}
                  className="text-[11px] italic tracking-wide text-stone-600 mt-0.5"
                >
                  “{textConfig.subtext}”
                </p>
              )}
            </div>
          </div>
        )}

        {/* Layout Template 3: LOVE Banner 8 (L-O-V-E Cutout Overlay Layout) */}
        {templateId === 'love-banner-8' && (
          <div className="w-full h-full flex flex-col justify-between overflow-hidden" style={{ gap: `${posterSettings.gap}px` }}>
            {/* Top 8-Photo Wall with L-O-V-E Cutouts */}
            <div className="flex-1 flex flex-col justify-between min-h-0" style={{ gap: `${posterSettings.gap}px` }}>
              {/* Row 1: 2 Photos with Letter "L" Cutout Overlay */}
              <div className="flex-1 flex min-h-0 relative" style={{ gap: `${posterSettings.gap}px` }}>
                {renderSlot(0, 'w-1/2 h-full')}
                {renderSlot(1, 'w-1/2 h-full')}
                {/* Center Letter L Overlay */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                  <svg className="h-[98%] w-auto overflow-visible" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet">
                    <text
                      x="50"
                      y="52"
                      textAnchor="middle"
                      dominantBaseline="central"
                      fill={posterSettings.bgColor || '#ffffff'}
                      fontFamily="Bodoni Moda, Georgia, serif"
                      fontWeight="900"
                      fontSize="110"
                    >
                      L
                    </text>
                  </svg>
                </div>
              </div>

              {/* Row 2: 2 Photos with Letter "O" Cutout Overlay */}
              <div className="flex-1 flex min-h-0 relative" style={{ gap: `${posterSettings.gap}px` }}>
                {renderSlot(2, 'w-1/2 h-full')}
                {renderSlot(3, 'w-1/2 h-full')}
                {/* Center Letter O Overlay */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                  <svg className="h-[98%] w-auto overflow-visible" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet">
                    <text
                      x="50"
                      y="52"
                      textAnchor="middle"
                      dominantBaseline="central"
                      fill={posterSettings.bgColor || '#ffffff'}
                      fontFamily="Bodoni Moda, Georgia, serif"
                      fontWeight="900"
                      fontSize="110"
                    >
                      O
                    </text>
                  </svg>
                </div>
              </div>

              {/* Row 3: 2 Photos with Letter "V" Cutout Overlay */}
              <div className="flex-1 flex min-h-0 relative" style={{ gap: `${posterSettings.gap}px` }}>
                {renderSlot(4, 'w-1/2 h-full')}
                {renderSlot(5, 'w-1/2 h-full')}
                {/* Center Letter V Overlay */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                  <svg className="h-[98%] w-auto overflow-visible" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet">
                    <text
                      x="50"
                      y="52"
                      textAnchor="middle"
                      dominantBaseline="central"
                      fill={posterSettings.bgColor || '#ffffff'}
                      fontFamily="Bodoni Moda, Georgia, serif"
                      fontWeight="900"
                      fontSize="110"
                    >
                      V
                    </text>
                  </svg>
                </div>
              </div>

              {/* Row 4: 2 Photos with Letter "E" Cutout Overlay */}
              <div className="flex-1 flex min-h-0 relative" style={{ gap: `${posterSettings.gap}px` }}>
                {renderSlot(6, 'w-1/2 h-full')}
                {renderSlot(7, 'w-1/2 h-full')}
                {/* Center Letter E Overlay */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                  <svg className="h-[98%] w-auto overflow-visible" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet">
                    <text
                      x="50"
                      y="52"
                      textAnchor="middle"
                      dominantBaseline="central"
                      fill={posterSettings.bgColor || '#ffffff'}
                      fontFamily="Bodoni Moda, Georgia, serif"
                      fontWeight="900"
                      fontSize="110"
                    >
                      E
                    </text>
                  </svg>
                </div>
              </div>
            </div>

            {/* Bottom Elegant Typography */}
            <div className="pt-2 pb-1.5 px-2 flex flex-col items-center justify-center text-center shrink-0">
              {/* Save the Date */}
              <div
                style={{
                  fontFamily: textConfig.taglineFont,
                  color: textConfig.taglineColor,
                  letterSpacing: '4px',
                }}
                className="text-[11px] sm:text-xs tracking-[0.3em] uppercase font-semibold text-stone-700 mb-1"
              >
                {textConfig.tagline || 'SAVE THE DATE'}
              </div>

              {/* Names with Connector */}
              <div className="flex items-center justify-center gap-1.5 my-0.5">
                <span
                  style={{
                    fontFamily: textConfig.namesFont,
                    color: textConfig.namesColor,
                  }}
                  className="font-bold text-sm sm:text-base uppercase tracking-wider"
                >
                  {textConfig.groomName}
                </span>
                <span
                  style={{
                    fontFamily: 'Great Vibes',
                    color: textConfig.namesColor,
                  }}
                  className="text-base sm:text-lg italic font-normal px-0.5"
                >
                  {textConfig.connector || 'and'}
                </span>
                <span
                  style={{
                    fontFamily: textConfig.namesFont,
                    color: textConfig.namesColor,
                  }}
                  className="font-bold text-sm sm:text-base uppercase tracking-wider"
                >
                  {textConfig.brideName}
                </span>
              </div>

              {/* Date */}
              <div
                style={{
                  fontFamily: textConfig.dateFont,
                  color: textConfig.dateColor,
                  letterSpacing: '2px',
                }}
                className="text-xs sm:text-sm font-bold tracking-widest text-stone-800 mt-1"
              >
                {textConfig.dateText ? textConfig.dateText.replace(/\n/g, ' . ') : '10.08.2024'}
              </div>
            </div>
          </div>
        )}

        {/* Layout Template 4: Heart Mosaic 18 (Dear Love... Layout) */}
        {templateId === 'heart-mosaic-18' && (
          <div className="w-full h-full flex flex-col justify-between overflow-hidden" style={{ gap: `${posterSettings.gap}px` }}>
            {/* Top Tagline Header: Dear love... */}
            <div className="pt-2 pb-1 text-center shrink-0">
              <span
                style={{
                  fontFamily: textConfig.taglineFont === 'Montserrat' ? 'Great Vibes, cursive' : textConfig.taglineFont,
                  color: textConfig.taglineColor || '#1c1917',
                }}
                className="text-2xl sm:text-3xl italic font-normal tracking-wide"
              >
                {textConfig.tagline || 'Dear love...'}
              </span>
            </div>

            {/* Heart Collage Wall (Grid of 7 Cols x 7 Rows) */}
            <div className="flex-1 min-h-0 grid grid-cols-7 grid-rows-7 p-1 items-center justify-center" style={{ gap: `${Math.max(2, posterSettings.gap - 2)}px` }}>
              {/* Row 1: Top Lobes (4 photos) */}
              <div className="col-start-2 row-start-1 w-full h-full">{renderSlot(1, 'w-full h-full')}</div>
              <div className="col-start-3 row-start-1 w-full h-full">{renderSlot(2, 'w-full h-full')}</div>
              <div className="col-start-5 row-start-1 w-full h-full">{renderSlot(3, 'w-full h-full')}</div>
              <div className="col-start-6 row-start-1 w-full h-full">{renderSlot(4, 'w-full h-full')}</div>

              {/* Row 2: Upper Arch (6 photos) */}
              <div className="col-start-1 row-start-2 w-full h-full">{renderSlot(5, 'w-full h-full')}</div>
              <div className="col-start-2 row-start-2 w-full h-full">{renderSlot(6, 'w-full h-full')}</div>
              <div className="col-start-3 row-start-2 w-full h-full">{renderSlot(7, 'w-full h-full')}</div>
              <div className="col-start-5 row-start-2 w-full h-full">{renderSlot(8, 'w-full h-full')}</div>
              <div className="col-start-6 row-start-2 w-full h-full">{renderSlot(9, 'w-full h-full')}</div>
              <div className="col-start-7 row-start-2 w-full h-full">{renderSlot(10, 'w-full h-full')}</div>

              {/* Center Main Featured Photo (Spans cols 3 to 5, rows 3 to 5) */}
              <div className="col-start-3 col-span-3 row-start-3 row-span-3 w-full h-full z-10 shadow-sm rounded-sm overflow-hidden">
                {renderSlot(0, 'w-full h-full')}
              </div>

              {/* Left Side Main Portrait Frame (Spans cols 1 to 2, rows 3 to 4) */}
              <div className="col-start-1 col-span-2 row-start-3 row-span-2 w-full h-full rounded-sm overflow-hidden">
                {renderSlot(11, 'w-full h-full')}
              </div>

              {/* Right Side Main Portrait Frame (Spans cols 6 to 7, rows 3 to 4) */}
              <div className="col-start-6 col-span-2 row-start-3 row-span-2 w-full h-full rounded-sm overflow-hidden">
                {renderSlot(12, 'w-full h-full')}
              </div>

              {/* Row 5 Lower Taper Left & Right Side */}
              <div className="col-start-2 row-start-5 w-full h-full">{renderSlot(13, 'w-full h-full')}</div>
              <div className="col-start-6 row-start-5 w-full h-full">{renderSlot(14, 'w-full h-full')}</div>

              {/* Row 6 Bottom Taper (3 photos under center photo) */}
              <div className="col-start-3 row-start-6 w-full h-full">{renderSlot(15, 'w-full h-full')}</div>
              <div className="col-start-4 row-start-6 w-full h-full">{renderSlot(16, 'w-full h-full')}</div>
              <div className="col-start-5 row-start-6 w-full h-full">{renderSlot(17, 'w-full h-full')}</div>

              {/* Row 7 Pointed Bottom Tip */}
              <div className="col-start-4 row-start-7 w-full h-full">{renderSlot(18, 'w-full h-full')}</div>
            </div>

            {/* Bottom Section: Floral Branch Ornament + Names + Date */}
            <div className="pt-1 pb-2 px-2 flex flex-col items-center justify-center text-center shrink-0">
              {/* Floral Branch Line Art SVG */}
              <div className="my-1 opacity-75 text-stone-700">
                <svg width="120" height="28" viewBox="0 0 120 28" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
                  {/* Stem */}
                  <path d="M10 14 C35 12, 85 16, 110 14" />
                  {/* Leaves & Flower Buds */}
                  <path d="M30 13 C25 6, 38 4, 30 13" fill="currentColor" fillOpacity="0.1" />
                  <path d="M45 14 C40 22, 52 24, 45 14" fill="currentColor" fillOpacity="0.1" />
                  <path d="M60 13 C55 5, 68 3, 60 13" fill="currentColor" fillOpacity="0.15" />
                  <path d="M75 15 C70 23, 82 25, 75 15" fill="currentColor" fillOpacity="0.1" />
                  <path d="M90 13 C85 6, 98 4, 90 13" fill="currentColor" fillOpacity="0.1" />
                  {/* Small Petal Circles */}
                  <circle cx="60" cy="4" r="2.5" fill="currentColor" fillOpacity="0.2" />
                  <circle cx="45" cy="24" r="2" fill="currentColor" fillOpacity="0.2" />
                  <circle cx="75" cy="25" r="2" fill="currentColor" fillOpacity="0.2" />
                </svg>
              </div>

              {/* Groom & Bride Names */}
              <div className="flex items-center justify-center gap-2 my-0.5">
                <span
                  style={{
                    fontFamily: textConfig.namesFont,
                    color: textConfig.namesColor,
                  }}
                  className="font-bold text-base sm:text-lg uppercase tracking-[0.15em]"
                >
                  {textConfig.groomName}
                </span>
                <span
                  style={{
                    fontFamily: 'Great Vibes, cursive',
                    color: textConfig.namesColor,
                  }}
                  className="text-lg sm:text-xl italic font-normal px-1"
                >
                  {textConfig.connector || '&'}
                </span>
                <span
                  style={{
                    fontFamily: textConfig.namesFont,
                    color: textConfig.namesColor,
                  }}
                  className="font-bold text-base sm:text-lg uppercase tracking-[0.15em]"
                >
                  {textConfig.brideName}
                </span>
              </div>

              {/* Date */}
              <div
                style={{
                  fontFamily: textConfig.dateFont,
                  color: textConfig.dateColor,
                }}
                className="text-xs sm:text-sm font-medium tracking-[0.3em] text-stone-700 mt-0.5"
              >
                {textConfig.dateText ? textConfig.dateText.replace(/\n/g, ' / ') : '15 / 05 / 2025'}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
