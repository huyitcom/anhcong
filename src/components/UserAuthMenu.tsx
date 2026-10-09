import React, { useState } from 'react';
import {
  LogIn,
  LogOut,
  Crown,
  ShieldCheck,
  User,
  ChevronDown,
  Zap,
  CreditCard,
  Settings,
  PlusCircle,
} from 'lucide-react';
import { useAuth } from '../lib/AuthContext';
import { TopupCreditsModal } from './TopupCreditsModal';
import { AdminCreditsManagerModal } from './AdminCreditsManagerModal';

export const UserAuthMenu: React.FC = () => {
  const { currentUser, userProfile, loading, isVip, isAdmin, loginWithGoogle, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isTopupOpen, setIsTopupOpen] = useState(false);
  const [isAdminManagerOpen, setIsAdminManagerOpen] = useState(false);

  const handleLogin = async () => {
    try {
      setIsLoggingIn(true);
      await loginWithGoogle();
    } catch {
      // Handled in context
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    setIsOpen(false);
    await logout();
  };

  if (loading) {
    return (
      <div className="h-8 w-8 rounded-full bg-stone-100 animate-pulse border border-stone-200" />
    );
  }

  if (!currentUser) {
    return (
      <button
        onClick={handleLogin}
        disabled={isLoggingIn}
        className="flex items-center gap-1.5 bg-white hover:bg-stone-50 active:bg-stone-100 text-stone-700 text-xs font-semibold px-3 py-2 rounded-xl border border-stone-200 shadow-xs transition cursor-pointer"
        title="Đăng nhập tài khoản Google để nhận 3 lượt render miễn phí"
      >
        <LogIn className="w-3.5 h-3.5 text-sky-600" />
        <span className="hidden sm:inline">Đăng nhập</span>
      </button>
    );
  }

  const credits = userProfile?.credits ?? 0;

  return (
    <>
      <div className="relative flex items-center gap-2">
        {/* Quick Render Credits Badge */}
        <div
          onClick={() => setIsTopupOpen(true)}
          className="flex items-center gap-1.5 bg-amber-50 hover:bg-amber-100/80 border border-amber-200/90 text-amber-900 px-2.5 py-1.5 rounded-xl cursor-pointer shadow-xs transition"
          title="Bấm để nạp thêm lượt render AI"
        >
          <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500 shrink-0" />
          <span className="text-xs font-bold leading-none">
            {credits} <span className="text-[10px] font-normal text-amber-700 hidden sm:inline">lượt</span>
          </span>
          <PlusCircle className="w-3 h-3 text-amber-600 ml-0.5" />
        </div>

        {/* User Profile Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-1.5 p-1 sm:px-2 sm:py-1.5 rounded-xl border border-stone-200 hover:bg-stone-50 transition bg-white shadow-xs cursor-pointer"
        >
          {userProfile?.photoURL ? (
            <img
              src={userProfile.photoURL}
              alt={userProfile.displayName || 'Avatar'}
              className="w-6 h-6 rounded-full object-cover border border-stone-200"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="w-6 h-6 rounded-full bg-sky-100 text-sky-700 flex items-center justify-center font-bold text-xs">
              {userProfile?.displayName?.charAt(0).toUpperCase() || 'U'}
            </div>
          )}

          <div className="hidden sm:flex flex-col items-start text-left max-w-[110px]">
            <span className="text-xs font-semibold text-stone-800 truncate w-full">
              {userProfile?.displayName || 'Thành viên'}
            </span>
            <span className="text-[10px] flex items-center gap-0.5">
              {isAdmin ? (
                <span className="text-purple-700 font-bold flex items-center gap-0.5">
                  <ShieldCheck className="w-2.5 h-2.5" /> Admin
                </span>
              ) : isVip ? (
                <span className="text-amber-600 font-bold flex items-center gap-0.5">
                  <Crown className="w-2.5 h-2.5 fill-amber-500 text-amber-500" /> VIP
                </span>
              ) : (
                <span className="text-stone-400 font-medium">Thành viên</span>
              )}
            </span>
          </div>

          <ChevronDown className="w-3.5 h-3.5 text-stone-400" />
        </button>

        {/* Dropdown Menu */}
        {isOpen && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />
            <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-2xl shadow-xl border border-stone-200 py-2.5 z-50 text-xs animate-fadeIn">
              {/* Header info */}
              <div className="px-4 py-2 border-b border-stone-100 mb-1">
                <p className="font-semibold text-stone-900 truncate">
                  {userProfile?.displayName || 'Thành viên'}
                </p>
                <p className="text-stone-500 text-[11px] truncate">
                  {userProfile?.email || currentUser.email}
                </p>
                
                <div className="mt-2 flex items-center gap-1.5">
                  {isAdmin ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 font-bold text-[10px] border border-purple-200">
                      <ShieldCheck className="w-3 h-3 text-purple-600" /> Quản trị viên (Admin)
                    </span>
                  ) : isVip ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 font-bold text-[10px] border border-amber-200">
                      <Crown className="w-3 h-3 text-amber-600 fill-amber-500" /> Thành viên VIP
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-stone-100 text-stone-600 font-medium text-[10px]">
                      <User className="w-3 h-3" /> Tài khoản thường
                    </span>
                  )}
                </div>

                {/* Credits summary card */}
                <div className="mt-3 bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200/80 rounded-xl p-2.5 flex items-center justify-between">
                  <div>
                    <div className="text-[10px] text-amber-800 font-medium">Hạn mức render AI</div>
                    <div className="text-sm font-bold text-amber-950 flex items-center gap-1">
                      <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                      <span>{credits} lượt khả dụng</span>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setIsOpen(false);
                      setIsTopupOpen(true);
                    }}
                    className="px-2.5 py-1.5 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-slate-950 font-bold text-[11px] rounded-lg shadow-xs flex items-center gap-1 cursor-pointer"
                  >
                    <PlusCircle className="w-3 h-3" />
                    <span>Nạp lượt</span>
                  </button>
                </div>
              </div>

              {/* Action: Open Topup */}
              <button
                onClick={() => {
                  setIsOpen(false);
                  setIsTopupOpen(true);
                }}
                className="w-full text-left px-4 py-2 hover:bg-stone-50 flex items-center gap-2 font-medium text-stone-700 transition"
              >
                <CreditCard className="w-3.5 h-3.5 text-amber-500" />
                <span>Nạp lượt qua mã VietQR</span>
              </button>

              {/* Admin Management Dashboard Button */}
              {isAdmin && (
                <button
                  onClick={() => {
                    setIsOpen(false);
                    setIsAdminManagerOpen(true);
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-purple-50 text-purple-700 flex items-center gap-2 font-semibold transition"
                >
                  <Settings className="w-3.5 h-3.5 text-purple-600" />
                  <span>⚙️ Quản trị Lượt Render (Admin)</span>
                </button>
              )}

              {/* VIP Benefits */}
              <div className="px-4 py-2 text-[11px] text-stone-500 border-t border-stone-100 mt-1">
                {isVip ? (
                  <span className="text-emerald-600 font-medium flex items-center gap-1">
                    ✓ VIP: Tải ảnh gốc 300 DPI miễn phí không cần mật khẩu
                  </span>
                ) : (
                  <span>Tài khoản thường: Đặt in ảnh cổng miễn phí, 3 lượt ghép phông AI tặng kèm.</span>
                )}
              </div>

              {/* Logout button */}
              <button
                onClick={handleLogout}
                className="w-full text-left px-4 py-2 text-rose-600 hover:bg-rose-50 flex items-center gap-2 font-medium transition border-t border-stone-100"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Đăng xuất</span>
              </button>
            </div>
          </>
        )}
      </div>

      {/* Topup Modal */}
      <TopupCreditsModal
        isOpen={isTopupOpen}
        onClose={() => setIsTopupOpen(false)}
      />

      {/* Admin Manager Modal */}
      {isAdmin && (
        <AdminCreditsManagerModal
          isOpen={isAdminManagerOpen}
          onClose={() => setIsAdminManagerOpen(false)}
        />
      )}
    </>
  );
};
