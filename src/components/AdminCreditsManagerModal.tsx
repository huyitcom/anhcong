import React, { useState, useEffect } from 'react';
import {
  X,
  Users,
  CreditCard,
  History,
  Search,
  Plus,
  Minus,
  Check,
  Shield,
  Crown,
  RefreshCw,
  CheckCircle2,
  Wand2,
} from 'lucide-react';
import {
  collection,
  query,
  orderBy,
  limit,
  getDocs,
  onSnapshot,
  doc,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth, UserProfile } from '../lib/AuthContext';
import { AdminBackgroundTemplatesManager } from './AdminBackgroundTemplatesManager';

interface AdminCreditsManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface TopupRequestItem {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  packageName: string;
  creditsAmount: number;
  amountVnd: number;
  transferCode: string;
  status: 'pending' | 'completed' | 'cancelled';
  createdAt?: any;
}

interface RenderLogItem {
  id: string;
  userId: string;
  userEmail: string;
  userName?: string;
  resolution: string;
  creditsDeducted: number;
  templateName: string;
  timestamp: string;
  status: string;
}

export const AdminCreditsManagerModal: React.FC<AdminCreditsManagerModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { isAdmin, adminAddCredits, adminSetRole } = useAuth();
  const [activeTab, setActiveTab] = useState<'users' | 'requests' | 'logs' | 'backgrounds'>('users');

  // Users data
  const [usersList, setUsersList] = useState<UserProfile[]>([]);
  const [loadingUsers, setLoadingUsers] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Topup requests data
  const [requestsList, setRequestsList] = useState<TopupRequestItem[]>([]);
  const [loadingRequests, setLoadingRequests] = useState<boolean>(true);

  // Render logs data
  const [logsList, setLogsList] = useState<RenderLogItem[]>([]);
  const [loadingLogs, setLoadingLogs] = useState<boolean>(true);

  // Custom modal for granting custom amount
  const [selectedUserForEdit, setSelectedUserForEdit] = useState<UserProfile | null>(null);
  const [customAmount, setCustomAmount] = useState<string>('10');
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);

  // Load users
  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const q = query(collection(db, 'users'), limit(100));
      const snap = await getDocs(q);
      const list: UserProfile[] = [];
      snap.forEach((docSnap) => {
        list.push({ uid: docSnap.id, ...(docSnap.data() as any) });
      });
      // Sort: highest credits first, or admin first
      list.sort((a, b) => (b.credits || 0) - (a.credits || 0));
      setUsersList(list);
    } catch (err) {
      console.error('[Admin] Error fetching users:', err);
    } finally {
      setLoadingUsers(false);
    }
  };

  // Subscribe to topup requests real-time
  useEffect(() => {
    if (!isOpen || !isAdmin) return;

    fetchUsers();

    // Requests listener
    const requestsQuery = query(
      collection(db, 'topupRequests'),
      orderBy('createdAt', 'desc'),
      limit(50)
    );
    const unsubReq = onSnapshot(requestsQuery, (snap) => {
      const list: TopupRequestItem[] = [];
      snap.forEach((docSnap) => {
        list.push({ id: docSnap.id, ...(docSnap.data() as any) });
      });
      setRequestsList(list);
      setLoadingRequests(false);
    }, (err) => {
      console.warn('[Admin] Topup requests listener error:', err);
      setLoadingRequests(false);
    });

    // Logs listener
    const logsQuery = query(
      collection(db, 'renderLogs'),
      orderBy('timestamp', 'desc'),
      limit(50)
    );
    const unsubLogs = onSnapshot(logsQuery, (snap) => {
      const list: RenderLogItem[] = [];
      snap.forEach((docSnap) => {
        list.push({ id: docSnap.id, ...(docSnap.data() as any) });
      });
      setLogsList(list);
      setLoadingLogs(false);
    }, (err) => {
      console.warn('[Admin] Render logs listener error:', err);
      setLoadingLogs(false);
    });

    return () => {
      unsubReq();
      unsubLogs();
    };
  }, [isOpen, isAdmin]);

  if (!isOpen || !isAdmin) return null;

  const showSuccessNotification = (msg: string) => {
    setActionSuccessMsg(msg);
    setTimeout(() => setActionSuccessMsg(null), 3000);
  };

  const handleQuickAdd = async (user: UserProfile, amount: number) => {
    const ok = await adminAddCredits(user.uid, amount);
    if (ok) {
      showSuccessNotification(`Đã cộng +${amount} lượt cho ${user.email || user.displayName}`);
      setUsersList((prev) =>
        prev.map((u) => (u.uid === user.uid ? { ...u, credits: (u.credits || 0) + amount } : u))
      );
    }
  };

  const handleApplyCustomAmount = async (isAdd: boolean) => {
    if (!selectedUserForEdit) return;
    const num = parseInt(customAmount, 10);
    if (isNaN(num) || num <= 0) return;

    const delta = isAdd ? num : -num;
    const ok = await adminAddCredits(selectedUserForEdit.uid, delta);
    if (ok) {
      showSuccessNotification(`Đã ${isAdd ? 'cộng' : 'trừ'} ${num} lượt cho ${selectedUserForEdit.email}`);
      setUsersList((prev) =>
        prev.map((u) =>
          u.uid === selectedUserForEdit.uid
            ? { ...u, credits: Math.max(0, (u.credits || 0) + delta) }
            : u
        )
      );
      setSelectedUserForEdit(null);
    }
  };

  const handleChangeRole = async (user: UserProfile, newRole: string) => {
    const ok = await adminSetRole(user.uid, newRole);
    if (ok) {
      showSuccessNotification(`Đã đổi vai trò của ${user.email} thành ${newRole.toUpperCase()}`);
      setUsersList((prev) =>
        prev.map((u) => (u.uid === user.uid ? { ...u, role: newRole } : u))
      );
    }
  };

  // Approve a pending topup request and automatically add credits
  const handleApproveRequest = async (req: TopupRequestItem) => {
    try {
      const reqRef = doc(db, 'topupRequests', req.id);
      await updateDoc(reqRef, {
        status: 'completed',
        approvedAt: serverTimestamp(),
      });
      // Add credits to user
      await adminAddCredits(req.userId, req.creditsAmount);
      showSuccessNotification(`Đã duyệt gói ${req.packageName} & cộng ${req.creditsAmount} lượt cho ${req.userEmail}!`);
    } catch (err) {
      console.error('[Admin] Error approving request:', err);
    }
  };

  const handleCancelRequest = async (req: TopupRequestItem) => {
    try {
      const reqRef = doc(db, 'topupRequests', req.id);
      await updateDoc(reqRef, {
        status: 'cancelled',
        updatedAt: serverTimestamp(),
      });
      showSuccessNotification(`Đã hủy yêu cầu nạp của ${req.userEmail}`);
    } catch (err) {
      console.error('[Admin] Error cancelling request:', err);
    }
  };

  // Filtered users
  const filteredUsers = usersList.filter((u) => {
    const queryStr = searchQuery.toLowerCase();
    return (
      u.email?.toLowerCase().includes(queryStr) ||
      u.displayName?.toLowerCase().includes(queryStr) ||
      u.uid?.toLowerCase().includes(queryStr)
    );
  });

  const pendingRequestsCount = requestsList.filter((r) => r.status === 'pending').length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-5 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-slate-900 border border-slate-750 text-white rounded-2xl w-full max-w-5xl overflow-hidden shadow-2xl max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 bg-slate-850 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-purple-500/20 text-white font-bold">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                Hệ Thống Quản Trị Lượt Render AI
                <span className="text-xs bg-purple-500/20 text-purple-300 border border-purple-500/30 px-2 py-0.5 rounded-full font-medium">
                  Admin Panel
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Quản lý thành viên, hạn mức credits, duyệt đơn nạp tiền VietQR và nhật ký AI
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="px-6 pt-3 border-b border-slate-800 bg-slate-900 flex items-center gap-4">
          <button
            onClick={() => setActiveTab('users')}
            className={`pb-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition-all ${
              activeTab === 'users'
                ? 'border-purple-500 text-purple-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Users className="w-4 h-4" />
            Thành Viên & Số Dư ({usersList.length})
          </button>

          <button
            onClick={() => setActiveTab('requests')}
            className={`pb-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition-all ${
              activeTab === 'requests'
                ? 'border-amber-500 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <CreditCard className="w-4 h-4" />
            Duyệt Nạp VietQR
            {pendingRequestsCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-amber-500 text-slate-950 font-bold text-xs">
                {pendingRequestsCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('logs')}
            className={`pb-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition-all ${
              activeTab === 'logs'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <History className="w-4 h-4" />
            Nhật Ký Render ({logsList.length})
          </button>

          <button
            onClick={() => setActiveTab('backgrounds')}
            className={`pb-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition-all ${
              activeTab === 'backgrounds'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Wand2 className="w-4 h-4" />
            Mẫu Phông AI (Backgrounds)
          </button>
        </div>

        {/* Notification Toast */}
        {actionSuccessMsg && (
          <div className="bg-emerald-500/20 border-b border-emerald-500/40 text-emerald-300 px-6 py-2 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{actionSuccessMsg}</span>
          </div>
        )}

        {/* Body Content */}
        <div className="p-6 overflow-y-auto flex-1">
          {/* TAB 1: USERS LIST */}
          {activeTab === 'users' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
                <div className="relative w-full sm:w-80">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Tìm theo email, tên, UID..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none focus:border-purple-500"
                  />
                </div>
                <button
                  onClick={fetchUsers}
                  className="px-3 py-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-xs text-slate-300 flex items-center gap-2 border border-slate-700"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Làm mới danh sách
                </button>
              </div>

              {loadingUsers ? (
                <div className="py-12 text-center text-slate-400 text-xs">
                  <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                  Đang tải danh sách người dùng...
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className="py-12 text-center text-slate-500 text-xs">
                  Không tìm thấy thành viên nào phù hợp.
                </div>
              ) : (
                <div className="overflow-x-auto border border-slate-800 rounded-xl">
                  <table className="w-full text-left text-xs text-slate-300">
                    <thead className="bg-slate-800/80 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-750">
                      <tr>
                        <th className="px-4 py-3">Người dùng</th>
                        <th className="px-4 py-3">Vai trò</th>
                        <th className="px-4 py-3 text-center">Số lượt khả dụng</th>
                        <th className="px-4 py-3 text-center">Đã render</th>
                        <th className="px-4 py-3 text-right">Thao tác cộng lượt</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {filteredUsers.map((user) => (
                        <tr key={user.uid} className="hover:bg-slate-800/40 transition-colors">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2.5">
                              {user.photoURL ? (
                                <img
                                  src={user.photoURL}
                                  alt={user.displayName}
                                  className="w-8 h-8 rounded-full border border-slate-700 object-cover"
                                />
                              ) : (
                                <div className="w-8 h-8 rounded-full bg-slate-700 text-slate-300 font-bold flex items-center justify-center text-xs">
                                  {(user.displayName || user.email || 'U')[0].toUpperCase()}
                                </div>
                              )}
                              <div>
                                <div className="font-semibold text-white flex items-center gap-1.5">
                                  {user.displayName || 'Chưa đặt tên'}
                                  {user.role === 'admin' && (
                                    <Crown className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                                  )}
                                </div>
                                <div className="text-[11px] text-slate-400">{user.email}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <select
                              value={user.role || 'user'}
                              onChange={(e) => handleChangeRole(user, e.target.value)}
                              className="bg-slate-800 border border-slate-700 text-slate-200 rounded-lg px-2 py-1 text-xs focus:outline-none focus:border-purple-500"
                            >
                              <option value="user">User (Chuẩn)</option>
                              <option value="vip">VIP (Ưu đãi)</option>
                              <option value="admin">Admin</option>
                            </select>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className="font-mono font-bold text-sm text-amber-400 bg-amber-400/10 px-2.5 py-1 rounded-lg border border-amber-400/20">
                              {user.credits ?? 3} lượt
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center text-slate-400">
                            {user.totalRendered || 0} lần
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="inline-flex items-center gap-1.5">
                              <button
                                onClick={() => handleQuickAdd(user, 5)}
                                className="px-2 py-1 bg-slate-800 hover:bg-emerald-600/30 text-emerald-400 hover:text-emerald-300 border border-slate-700 rounded-md font-semibold text-[11px] transition-colors"
                              >
                                +5
                              </button>
                              <button
                                onClick={() => handleQuickAdd(user, 10)}
                                className="px-2 py-1 bg-slate-800 hover:bg-emerald-600/30 text-emerald-400 hover:text-emerald-300 border border-slate-700 rounded-md font-semibold text-[11px] transition-colors"
                              >
                                +10
                              </button>
                              <button
                                onClick={() => handleQuickAdd(user, 25)}
                                className="px-2 py-1 bg-slate-800 hover:bg-emerald-600/30 text-emerald-400 hover:text-emerald-300 border border-slate-700 rounded-md font-semibold text-[11px] transition-colors"
                              >
                                +25
                              </button>
                              <button
                                onClick={() => setSelectedUserForEdit(user)}
                                className="px-2 py-1 bg-purple-600/20 hover:bg-purple-600/40 text-purple-300 border border-purple-500/40 rounded-md font-medium text-[11px] transition-colors"
                              >
                                Tùy chỉnh...
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: TOPUP REQUESTS */}
          {activeTab === 'requests' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Danh sách đơn khách quét mã VietQR và gửi thông báo chuyển khoản:</span>
                <span className="font-semibold text-amber-400">
                  {pendingRequestsCount} đơn đang chờ duyệt
                </span>
              </div>

              {loadingRequests ? (
                <div className="py-12 text-center text-slate-400 text-xs">
                  <div className="w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                  Đang tải danh sách yêu cầu nạp...
                </div>
              ) : requestsList.length === 0 ? (
                <div className="py-12 text-center text-slate-500 text-xs">
                  Chưa có yêu cầu nạp lượt nào được tạo.
                </div>
              ) : (
                <div className="space-y-3">
                  {requestsList.map((req) => (
                    <div
                      key={req.id}
                      className={`p-4 rounded-xl border flex flex-col md:flex-row md:items-center justify-between gap-3 ${
                        req.status === 'pending'
                          ? 'bg-amber-950/20 border-amber-500/40 shadow-sm'
                          : req.status === 'completed'
                          ? 'bg-slate-850 border-slate-750'
                          : 'bg-slate-900 border-slate-800 opacity-60'
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white text-sm">{req.packageName}</span>
                          <span className="font-mono font-bold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded text-xs">
                            +{req.creditsAmount} lượt
                          </span>
                          <span className="font-semibold text-slate-200 text-xs">
                            {req.amountVnd?.toLocaleString('vi-VN')} đ
                          </span>
                          {req.status === 'pending' && (
                            <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full text-[10px] font-bold">
                              Chờ duyệt
                            </span>
                          )}
                          {req.status === 'completed' && (
                            <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full text-[10px] font-bold">
                              Đã hoàn thành
                            </span>
                          )}
                          {req.status === 'cancelled' && (
                            <span className="bg-rose-500/20 text-rose-300 border border-rose-500/30 px-2 py-0.5 rounded-full text-[10px] font-bold">
                              Đã hủy
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-slate-400 flex flex-wrap gap-x-4">
                          <span>Khách: <strong className="text-slate-300">{req.userName}</strong> ({req.userEmail})</span>
                          <span>Nội dung CK: <strong className="font-mono text-amber-300">{req.transferCode}</strong></span>
                        </div>
                      </div>

                      {req.status === 'pending' && (
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            onClick={() => handleApproveRequest(req)}
                            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
                          >
                            <Check className="w-4 h-4" />
                            Duyệt & Cộng +{req.creditsAmount} Lượt
                          </button>
                          <button
                            onClick={() => handleCancelRequest(req)}
                            className="px-3 py-2 bg-slate-800 hover:bg-rose-900/40 text-slate-400 hover:text-rose-300 rounded-xl text-xs transition-colors"
                          >
                            Hủy
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: RENDER LOGS */}
          {activeTab === 'logs' && (
            <div className="space-y-4">
              <div className="text-xs text-slate-400">
                Nhật ký 50 lần ghép phông AI gần nhất của hệ thống:
              </div>

              {loadingLogs ? (
                <div className="py-12 text-center text-slate-400 text-xs">
                  <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                  Đang tải nhật ký...
                </div>
              ) : logsList.length === 0 ? (
                <div className="py-12 text-center text-slate-500 text-xs">
                  Chưa có lịch sử render nào được ghi lại.
                </div>
              ) : (
                <div className="overflow-x-auto border border-slate-800 rounded-xl">
                  <table className="w-full text-left text-xs text-slate-300">
                    <thead className="bg-slate-800/80 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-750">
                      <tr>
                        <th className="px-4 py-3">Thời gian</th>
                        <th className="px-4 py-3">Người dùng</th>
                        <th className="px-4 py-3">Mẫu phông nền</th>
                        <th className="px-4 py-3 text-center">Độ phân giải</th>
                        <th className="px-4 py-3 text-center">Lượt trừ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {logsList.map((log) => (
                        <tr key={log.id} className="hover:bg-slate-800/40">
                          <td className="px-4 py-2.5 text-slate-400">
                            {new Date(log.timestamp).toLocaleString('vi-VN')}
                          </td>
                          <td className="px-4 py-2.5 font-medium text-slate-200">
                            {log.userEmail}
                          </td>
                          <td className="px-4 py-2.5 text-white font-semibold">
                            {log.templateName}
                          </td>
                          <td className="px-4 py-2.5 text-center">
                            <span className="px-2 py-0.5 rounded bg-slate-800 text-purple-300 font-mono text-[11px] font-bold border border-slate-700">
                              {log.resolution}
                            </span>
                          </td>
                          <td className="px-4 py-2.5 text-center font-bold text-rose-400">
                            -{log.creditsDeducted} lượt
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: AI BACKGROUND TEMPLATES */}
          {activeTab === 'backgrounds' && (
            <AdminBackgroundTemplatesManager />
          )}
        </div>

        {/* Modal: Custom Amount Edit */}
        {selectedUserForEdit && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-slate-850 border border-slate-700 rounded-2xl p-5 max-w-sm w-full space-y-4 shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-750 pb-3">
                <h3 className="font-bold text-sm text-white">Điều chỉnh lượt render</h3>
                <button
                  onClick={() => setSelectedUserForEdit(null)}
                  className="text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="text-xs text-slate-300 space-y-1">
                <div>Người dùng: <strong className="text-white">{selectedUserForEdit.email}</strong></div>
                <div>Số dư hiện tại: <strong className="text-amber-400">{selectedUserForEdit.credits ?? 3} lượt</strong></div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                  Nhập số lượt muốn thay đổi:
                </label>
                <input
                  type="number"
                  min="1"
                  max="1000"
                  value={customAmount}
                  onChange={(e) => setCustomAmount(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white font-mono font-bold text-sm focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2">
                <button
                  onClick={() => handleApplyCustomAmount(true)}
                  className="py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1 shadow-md"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Cộng Thêm
                </button>
                <button
                  onClick={() => handleApplyCustomAmount(false)}
                  className="py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center justify-center gap-1 shadow-md"
                >
                  <Minus className="w-3.5 h-3.5" />
                  Trừ Bớt
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
