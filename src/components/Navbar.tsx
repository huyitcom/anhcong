import React from 'react';
import { Download, RotateCcw, Heart, Images } from 'lucide-react';

interface NavbarProps {
  onExportPoster: () => void;
  onResetAll: () => void;
  onOpenBatchUpload: () => void;
  isExporting: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  onExportPoster,
  onResetAll,
  onOpenBatchUpload,
  isExporting,
}) => {
  return (
    <header className="w-full bg-white border-b border-stone-200 sticky top-0 z-40 px-3 sm:px-6 py-2.5 shadow-xs flex items-center justify-between gap-2 sm:gap-4">
      {/* Brand Title (Left) */}
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-tr from-sky-600 via-sky-500 to-cyan-400 text-white flex items-center justify-center shadow-xs shrink-0">
          <Heart className="w-4 h-4 sm:w-5 sm:h-5 fill-white" />
        </div>
        <div className="min-w-0">
          <h1 className="font-serif font-bold text-stone-900 text-sm sm:text-base leading-tight flex items-center gap-2 truncate">
            <span>Thiết Kế Ảnh Cổng Cưới</span>
            <span className="text-[10px] font-sans font-semibold bg-sky-100 text-sky-700 px-2 py-0.5 rounded-full hidden md:inline-block">
              Save The Date
            </span>
          </h1>
          <p className="text-[11px] text-stone-500 hidden xl:block truncate">
            Tùy chỉnh khung ảnh, ngày tháng, tên dâu rể & xuất file in
          </p>
        </div>
      </div>

      {/* Center Logo */}
      <div className="flex items-center justify-center shrink-0 px-2">
        <img
          src="https://www.photobookvietnam.net/images/logo_reve.png"
          alt="Photobook Vietnam"
          className="h-6 sm:h-7 md:h-8 w-auto object-contain max-w-[140px] sm:max-w-[200px]"
          referrerPolicy="no-referrer"
        />
      </div>

      {/* Action Buttons (Right) */}
      <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
        <button
          onClick={onOpenBatchUpload}
          className="hidden sm:flex items-center gap-1.5 bg-stone-100 hover:bg-sky-50 hover:text-sky-700 text-stone-800 text-xs font-semibold px-3 py-2 rounded-xl border border-stone-200 hover:border-sky-200 transition"
        >
          <Images className="w-3.5 h-3.5 text-sky-600" />
          <span>Upload Ảnh</span>
        </button>

        <button
          onClick={onExportPoster}
          disabled={isExporting}
          className="flex items-center gap-1.5 bg-sky-500 hover:bg-sky-600 active:bg-sky-700 text-white text-xs sm:text-sm font-semibold px-3 sm:px-4 py-2 rounded-xl shadow-xs hover:shadow transition disabled:opacity-50"
        >
          {isExporting ? (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <Download className="w-4 h-4" />
          )}
          <span>Tải File In PNG</span>
        </button>

        <button
          onClick={onResetAll}
          title="Làm mới lại từ đầu"
          className="p-2 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-xl transition"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
