import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  QrCode,
  CheckCircle2,
  Copy,
  Zap,
  Sparkles,
  PhoneCall,
  MessageCircle,
  ShieldCheck,
  RefreshCw,
  ExternalLink,
  AlertCircle,
  ArrowRight,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useAuth } from '../lib/AuthContext';

interface TopupCreditsModalProps {
  isOpen: boolean;
  onClose: () => void;
  requiredCredits?: number;
}

interface PricingPackage {
  id: string;
  name: string;
  badge?: string;
  credits: number;
  priceVnd: number;
  popular?: boolean;
  description: string;
}

const PACKAGES: PricingPackage[] = [
  {
    id: 'starter',
    name: 'Gói Trải Nghiệm',
    credits: 10,
    priceVnd: 35000,
    description: 'Chỉ 3.500đ/lượt',
  },
  {
    id: 'popular',
    name: 'Gói Tiết Kiệm',
    badge: 'Phổ Biến Nhất',
    credits: 30,
    priceVnd: 99000,
    popular: true,
    description: 'Chỉ 3.300đ/lượt',
  },
  {
    id: 'studio-pro',
    name: 'Gói Studio Pro',
    badge: 'Khuyên Dùng',
    credits: 70,
    priceVnd: 203000,
    description: 'Chỉ 2.900đ/lượt',
  },
  {
    id: 'agency-vip',
    name: 'Gói VIP Đại Lý',
    badge: 'Giá Siêu Rẻ',
    credits: 180,
    priceVnd: 450000,
    description: 'Chỉ 2.500đ/lượt',
  },
];

interface PayosPaymentData {
  orderCode: number;
  paymentLinkId?: string;
  checkoutUrl: string;
  qrCode: string;
  accountNumber: string;
  accountName: string;
  bin: string;
  amount: number;
  description: string;
  credits: number;
  packageName: string;
}

const SUPPORT_INFO = {
  hotline: '0938.023.079',
  zaloUrl: 'https://zalo.me/0938023079',
};

export const TopupCreditsModal: React.FC<TopupCreditsModalProps> = ({
  isOpen,
  onClose,
  requiredCredits,
}) => {
  const { currentUser, userProfile, claimPayosCredits } = useAuth();
  const [selectedPkg, setSelectedPkg] = useState<PricingPackage>(PACKAGES[1]);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // PayOS states
  const [payosData, setPayosData] = useState<PayosPaymentData | null>(null);
  const [isLoadingPayos, setIsLoadingPayos] = useState<boolean>(false);
  const [payosError, setPayosError] = useState<string | null>(null);
  const [isPaidSuccess, setIsPaidSuccess] = useState<boolean>(false);

  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  // Function to create PayOS payment request
  const createPaymentRequest = async (pkg: PricingPackage) => {
    if (!currentUser) return;
    setIsLoadingPayos(true);
    setPayosError(null);
    setIsPaidSuccess(false);

    try {
      const res = await fetch('/api/payos/create-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser.uid,
          userEmail: currentUser.email || '',
          packageName: pkg.name,
          creditsAmount: pkg.credits,
          amount: pkg.priceVnd,
          amountVnd: pkg.priceVnd,
        }),
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || 'Không thể tạo mã thanh toán PayOS');
      }

      setPayosData({
        ...data,
        credits: data.credits || pkg.credits,
        packageName: data.packageName || pkg.name,
      });
    } catch (err: any) {
      console.error('[TopupCreditsModal] PayOS error:', err);
      setPayosError(err.message || 'Lỗi kết nối cổng thanh toán PayOS');
    } finally {
      setIsLoadingPayos(false);
    }
  };

  // Create payment when modal opens or package changes
  useEffect(() => {
    if (isOpen && currentUser) {
      createPaymentRequest(selectedPkg);
    }
    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };
  }, [isOpen, selectedPkg.id, currentUser]);

  // Handle successful payment: claim credits and celebrate
  const handlePaymentCompleted = async (order: PayosPaymentData) => {
    if (isPaidSuccess) return;
    setIsPaidSuccess(true);
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }

    try {
      await claimPayosCredits(
        order.orderCode,
        order.credits,
        order.amount,
        order.packageName
      );
    } catch (e) {
      console.warn('claim error:', e);
    }

    // Trigger celebration confetti
    try {
      confetti({
        particleCount: 120,
        spread: 70,
        origin: { y: 0.6 },
      });
    } catch (_) {}
  };

  // Real-time polling to verify payment status
  useEffect(() => {
    if (!isOpen || !payosData || isPaidSuccess) return;

    const checkStatus = async () => {
      try {
        const res = await fetch(`/api/payos/check-status/${payosData.orderCode}`);
        const result = await res.json();
        if (result.success && result.isPaid) {
          handlePaymentCompleted(payosData);
        }
      } catch (err) {
        // silently ignore poll errors
      }
    };

    pollingRef.current = setInterval(checkStatus, 2500);

    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };
  }, [isOpen, payosData, isPaidSuccess]);

  if (!isOpen) return null;

  const handleCopy = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2500);
  };

  // Dynamic VietQR image generator URL from PayOS data
  const qrDisplayUrl = payosData
    ? `https://img.vietqr.io/image/${payosData.bin || '970422'}-${payosData.accountNumber}-compact2.png?amount=${payosData.amount}&addInfo=${encodeURIComponent(payosData.description)}&accountName=${encodeURIComponent(payosData.accountName)}`
    : '';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-750 text-white rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 bg-slate-850 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-yellow-400 flex items-center justify-center shadow-lg shadow-amber-500/20 text-slate-950 font-bold">
              <Zap className="w-5 h-5 fill-current" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                Nạp Lượt Render AI (PayOS VietQR)
                <span className="text-[11px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded-full font-semibold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  Cộng lượt tự động 24/7
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Tài khoản: <span className="text-slate-200 font-medium">{userProfile?.email}</span> • Số dư hiện tại:{' '}
                <strong className="text-amber-400 font-bold">{userProfile?.credits ?? 0} lượt</strong>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto flex-1 space-y-6">
          {requiredCredits && (userProfile?.credits ?? 0) < requiredCredits && !isPaidSuccess && (
            <div className="bg-amber-950/40 border border-amber-600/40 text-amber-200 px-4 py-3 rounded-xl flex items-center gap-3 text-xs md:text-sm">
              <Sparkles className="w-5 h-5 text-amber-400 shrink-0" />
              <div>
                Bạn đang cần <strong>{requiredCredits} lượt</strong> để thực hiện render ảnh này (Hiện còn {userProfile?.credits ?? 0} lượt). Vui lòng quét mã bên dưới để nạp nhanh!
              </div>
            </div>
          )}

          {/* SUCCESS SCREEN */}
          {isPaidSuccess ? (
            <div className="py-10 text-center space-y-5 animate-fadeIn">
              <div className="relative w-20 h-20 bg-emerald-500/20 border-2 border-emerald-500 text-emerald-400 rounded-full flex items-center justify-center mx-auto shadow-xl shadow-emerald-500/20">
                <CheckCircle2 className="w-12 h-12" />
                <span className="absolute -top-1 -right-1 flex h-4 w-4">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500"></span>
                </span>
              </div>
              <div>
                <h3 className="text-2xl font-black text-white tracking-tight">
                  Thanh Toán Thành Công!
                </h3>
                <p className="text-emerald-400 font-bold text-sm mt-1">
                  Đã cộng +{payosData?.credits || selectedPkg.credits} lượt render vào tài khoản
                </p>
              </div>
              <div className="bg-slate-800/80 border border-slate-700 max-w-md mx-auto p-4 rounded-xl text-left space-y-2 text-xs">
                <div className="flex justify-between text-slate-300">
                  <span>Gói đã mua:</span>
                  <span className="font-bold text-white">{selectedPkg.name}</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Số tiền:</span>
                  <span className="font-bold text-amber-400">{selectedPkg.priceVnd.toLocaleString('vi-VN')} đ</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Số dư mới:</span>
                  <span className="font-extrabold text-emerald-400 text-sm">
                    {userProfile?.credits ?? 0} lượt
                  </span>
                </div>
              </div>
              <div className="flex justify-center gap-3 pt-2">
                <button
                  onClick={onClose}
                  className="px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-sm shadow-lg shadow-emerald-500/20 flex items-center gap-2 cursor-pointer transition-all transform active:scale-95"
                >
                  <span>Tiếp Tục Ghép Phông AI</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Package Selector */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    1. Chọn Gói Nạp Lượt Render
                  </span>
                  <span className="text-xs text-slate-400">
                    1K = 1 lượt • 2K = 2 lượt • 4K = 3 lượt
                  </span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {PACKAGES.map((pkg) => {
                    const isSelected = selectedPkg.id === pkg.id;
                    return (
                      <div
                        key={pkg.id}
                        onClick={() => setSelectedPkg(pkg)}
                        className={`relative p-3.5 rounded-xl cursor-pointer border transition-all flex flex-col justify-between ${
                          isSelected
                            ? 'bg-amber-500/10 border-amber-400 shadow-md shadow-amber-500/10 ring-1 ring-amber-400'
                            : 'bg-slate-800/60 border-slate-700/80 hover:border-slate-600 hover:bg-slate-800'
                        }`}
                      >
                        {pkg.badge && (
                          <span className="absolute -top-2.5 right-2 px-2 py-0.5 bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 font-bold text-[10px] rounded-full shadow">
                            {pkg.badge}
                          </span>
                        )}
                        <div>
                          <div className="font-semibold text-sm text-slate-200 mb-1">{pkg.name}</div>
                          <div className="text-xl font-extrabold text-amber-400 mb-1">
                            +{pkg.credits} <span className="text-xs font-normal text-slate-300">lượt</span>
                          </div>
                          <div className="text-xs text-slate-400 mb-2">{pkg.description}</div>
                        </div>
                        <div className="pt-2 border-t border-slate-750 flex items-center justify-between">
                          <span className="text-xs font-bold text-white">
                            {pkg.priceVnd.toLocaleString('vi-VN')} đ
                          </span>
                          {isSelected && <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* VietQR PayOS Section */}
              <div className="bg-slate-850 border border-slate-750 rounded-2xl p-4 md:p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    <QrCode className="w-4 h-4 text-amber-400" />
                    2. Quét Mã VietQR PayOS (Tự Động Xác Nhận Tức Thì)
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px] text-emerald-400">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span>Hệ thống đang lắng nghe giao dịch...</span>
                  </div>
                </div>

                {isLoadingPayos ? (
                  <div className="py-12 flex flex-col items-center justify-center space-y-3">
                    <RefreshCw className="w-8 h-8 text-amber-400 animate-spin" />
                    <p className="text-xs text-slate-300">Đang khởi tạo mã thanh toán VietQR từ PayOS...</p>
                  </div>
                ) : payosError ? (
                  <div className="p-4 bg-red-950/40 border border-red-800 rounded-xl space-y-3">
                    <div className="flex items-center gap-2 text-red-400 text-xs font-semibold">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{payosError}</span>
                    </div>
                    <button
                      onClick={() => createPaymentRequest(selectedPkg)}
                      className="px-3 py-1.5 bg-red-800 hover:bg-red-700 text-white rounded-lg text-xs font-semibold"
                    >
                      Thử lại kết nối PayOS
                    </button>
                  </div>
                ) : payosData ? (
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
                    {/* QR Code Container */}
                    <div className="md:col-span-5 flex flex-col items-center justify-center p-3.5 bg-white rounded-2xl shadow-xl border border-slate-200">
                      <img
                        src={qrDisplayUrl}
                        alt="PayOS VietQR Code"
                        className="w-full max-w-[210px] aspect-square object-contain"
                      />
                      <div className="text-[11px] font-bold text-slate-800 mt-2 flex items-center gap-1.5">
                        <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                        Quét mã bằng bất kỳ App Ngân Hàng nào
                      </div>
                    </div>

                    {/* Transfer Details Form */}
                    <div className="md:col-span-7 space-y-2.5">
                      <div className="space-y-2 text-xs">
                        {/* Ngân hàng */}
                        <div className="flex items-center justify-between bg-slate-800/80 px-3 py-2 rounded-lg border border-slate-700/60">
                          <span className="text-slate-400">Ngân hàng thụ hưởng:</span>
                          <span className="font-semibold text-slate-100">MB Bank (Quân Đội)</span>
                        </div>

                        {/* Số tài khoản */}
                        <div className="flex items-center justify-between bg-slate-800/80 px-3 py-2 rounded-lg border border-slate-700/60">
                          <span className="text-slate-400">Số tài khoản:</span>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-amber-300 text-sm">
                              {payosData.accountNumber}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleCopy(payosData.accountNumber, 'acc')}
                              className="p-1 hover:bg-slate-700 rounded text-slate-400 hover:text-white cursor-pointer"
                              title="Sao chép"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                            {copiedField === 'acc' && <span className="text-[10px] text-emerald-400">Đã chép</span>}
                          </div>
                        </div>

                        {/* Chủ tài khoản */}
                        <div className="flex items-center justify-between bg-slate-800/80 px-3 py-2 rounded-lg border border-slate-700/60">
                          <span className="text-slate-400">Tên người nhận:</span>
                          <span className="font-bold text-slate-200">{payosData.accountName}</span>
                        </div>

                        {/* Số tiền */}
                        <div className="flex items-center justify-between bg-slate-800/80 px-3 py-2 rounded-lg border border-slate-700/60">
                          <span className="text-slate-400">Số tiền chính xác:</span>
                          <div className="flex items-center gap-2">
                            <span className="font-extrabold text-amber-400 text-base">
                              {payosData.amount.toLocaleString('vi-VN')} đ
                            </span>
                            <button
                              type="button"
                              onClick={() => handleCopy(String(payosData.amount), 'amount')}
                              className="p-1 hover:bg-slate-700 rounded text-slate-400 hover:text-white cursor-pointer"
                              title="Sao chép"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Nội dung chuyển khoản định danh */}
                        <div className="bg-amber-500/10 border border-amber-500/30 p-2.5 rounded-lg flex items-center justify-between">
                          <div>
                            <div className="text-[11px] text-amber-300 font-medium">Nội dung chuyển khoản (bắt buộc):</div>
                            <div className="font-mono font-bold text-sm text-amber-200">{payosData.description}</div>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleCopy(payosData.description, 'code')}
                              className="px-2.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-xs flex items-center gap-1 transition-colors cursor-pointer"
                            >
                              <Copy className="w-3.5 h-3.5" />
                              Sao chép
                            </button>
                            {copiedField === 'code' && <span className="text-[10px] text-emerald-400 font-bold">OK!</span>}
                          </div>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="pt-2 flex flex-col sm:flex-row gap-2">
                        {payosData.checkoutUrl && (
                          <a
                            href={payosData.checkoutUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white font-bold text-xs shadow-md shadow-sky-600/20 flex items-center justify-center gap-1.5 transition-all"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                            <span>Mở giao diện thanh toán của PayOS</span>
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>

              {/* Support & Hotline Banner */}
              <div className="flex flex-wrap items-center justify-between text-xs text-slate-400 bg-slate-850 p-3 rounded-xl border border-slate-750 gap-2">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Xác nhận giao dịch an toàn 100% bởi PayOS VietQR</span>
                </div>
                <div className="flex items-center gap-3">
                  <a
                    href={`tel:${SUPPORT_INFO.hotline}`}
                    className="flex items-center gap-1 text-slate-300 hover:text-white"
                  >
                    <PhoneCall className="w-3.5 h-3.5 text-amber-400" />
                    Hotline: {SUPPORT_INFO.hotline}
                  </a>
                  <a
                    href={SUPPORT_INFO.zaloUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-blue-400 hover:text-blue-300 font-medium"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    Zalo Hỗ Trợ
                  </a>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
