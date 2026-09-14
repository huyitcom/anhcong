import React, { useState } from 'react';
import { LogIn, LogOut, Crown, ShieldCheck, User, ChevronDown } from 'lucide-react';
import { useAuth } from '../lib/AuthContext';

export const UserAuthMenu: React.FC = () => {
  const { currentUser, userProfile, loading, isVip, isAdmin, loginWithGoogle, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

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
        className="flex items-center gap-1.5 bg-white hover:bg-stone-50 active:bg-stone-100 text-stone-700 text-xs font-semibold px-3 py-2 rounded-xl border border-stone-200 shadow-xs transition"
        title="Đăng nhập tài khoản Photobook / Google"
      >
        <LogIn className="w-3.5 h-3.5 text-sky-600" />
        <span className="hidden sm:inline">Đăng nhập</span>
      </button>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 p-1 sm:px-2.5 sm:py-1.5 rounded-xl border border-stone-200 hover:bg-stone-50 transition bg-white shadow-xs"
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
              <span className="text-rose-600 font-bold flex items-center gap-0.5">
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
          <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-stone-200 py-2.5 z-50 text-xs">
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
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 font-bold text-[10px] border border-rose-200">
                    <ShieldCheck className="w-3 h-3 text-rose-600" /> Quản trị viên (Admin)
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

              {isVip ? (
                <p className="mt-2 text-[11px] text-emerald-600 font-medium flex items-center gap-1">
                  ✓ Quyền VIP: Tải ảnh gốc 300 DPI miễn phí, không cần nhập mật khẩu
                </p>
              ) : (
                <p className="mt-2 text-[11px] text-stone-500">
                  Tài khoản thường có thể xem và đặt in trực tiếp. Quyền tải file yêu cầu tài khoản VIP.
                </p>
              )}
            </div>

            {/* Logout button */}
            <button
              onClick={handleLogout}
              className="w-full text-left px-4 py-2 text-rose-600 hover:bg-rose-50 flex items-center gap-2 font-medium transition"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Đăng xuất</span>
            </button>
          </div>
        </>
      )}
    </div>
  );
};
