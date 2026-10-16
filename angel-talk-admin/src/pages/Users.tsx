import React, { useState, useEffect, useCallback } from "react";
import {
  Search,
  UserCheck,
  UserX,
  Shield,
  Trash2,
  RefreshCw,
  LogOut,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
} from "lucide-react";
import { api } from "../api/client";
import { User, UserRole } from "../types";
import { Badge } from "../components/common/Badge";
import { Modal } from "../components/common/Modal";
import { useAuth } from "../context/AuthContext";
import { ErrorNotice } from "../components/common/ErrorNotice";
import { errorMessage } from "../api/errors";

export const UsersPage: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [search, setSearch] = useState("");
  const [selectedRole, setSelectedRole] = useState<string>("");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: "10",
        ...(search ? { search } : {}),
        ...(selectedRole ? { role: selectedRole } : {}),
      });

      const response = await api.get(`/admin/users?${params.toString()}`);
      if (response.data?.data) {
        setUsers(response.data.data.users);
        setTotalPages(response.data.data.totalPages || 1);
        setTotalCount(response.data.data.total || response.data.data.users.length);
      }
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [page, search, selectedRole]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleToggleStatus = async (user: User) => {
    setActionLoading(true);
    const newStatus = user.status === "active" ? "suspended" : "active";
    try {
      await api.patch(`/admin/users/${user._id}/status`, { status: newStatus });
      await fetchUsers();
    } catch (err: unknown) {
      alert(errorMessage(err));
    } finally {
      setActionLoading(false);
    }
  };

  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    setActionLoading(true);
    try {
      await api.patch(`/admin/users/${userId}/role`, { role: newRole });
      await fetchUsers();
    } catch (err: unknown) {
      alert(errorMessage(err));
    } finally {
      setActionLoading(false);
    }
  };

  const handleRevokeSessions = async (userId: string) => {
    if (!confirm("Are you sure you want to revoke all active sessions for this user?")) return;
    setActionLoading(true);
    try {
      await api.post(`/admin/users/${userId}/revoke-sessions`);
      alert("All sessions successfully revoked.");
    } catch (err: unknown) {
      alert(errorMessage(err));
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;
    setActionLoading(true);
    try {
      await api.delete(`/admin/users/${selectedUser._id}`);
      setIsDeleteModalOpen(false);
      setSelectedUser(null);
      await fetchUsers();
    } catch (err: unknown) {
      alert(errorMessage(err));
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">User Management</h1>
          <p className="text-sm text-slate-500 mt-1">
            {totalCount} accounts. Every family that uses the app online gets one automatically.
          </p>
        </div>
        <button
          onClick={() => fetchUsers()}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 transition-colors shadow-sm"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh List</span>
        </button>
      </div>

      {error && <ErrorNotice message={error} onRetry={fetchUsers} />}

      {/* Filters and Search Bar */}
      <div className="bg-white p-4 rounded-2xl ring-1 ring-slate-200/80 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search by full name or email address..."
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <select
            value={selectedRole}
            onChange={(e) => {
              setSelectedRole(e.target.value);
              setPage(1);
            }}
            className="px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-slate-700"
          >
            <option value="">All Roles</option>
            <option value="parent">Parent</option>
            <option value="slp">Speech Therapist (SLP)</option>
            <option value="educator">Special Educator</option>
            <option value="admin">Administrator</option>
            <option value="superadmin">Superadmin</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-2xl ring-1 ring-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 text-xs uppercase tracking-wider font-semibold">
                <th className="py-3.5 px-6">User / Contact</th>
                <th className="py-3.5 px-6">Role</th>
                <th className="py-3.5 px-6">Status</th>
                <th className="py-3.5 px-6">Security (MFA)</th>
                <th className="py-3.5 px-6">Last Active</th>
                <th className="py-3.5 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    Loading accounts...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    No accounts match the selected filters.
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u._id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-4 px-6">
                      <div className="font-bold text-slate-900">{u.fullName}</div>
                      <div className="text-xs text-slate-500 font-mono">{u.email}</div>
                      {u.email.endsWith("@devices.angeltalk.app") && (
                        <div className="mt-0.5 text-[10px] font-semibold text-emerald-600">Family using the app (account made automatically)</div>
                      )}
                    </td>
                    <td className="py-4 px-6">
                      {currentUser?.role === "superadmin" ? (
                        <select
                          value={u.role}
                          disabled={actionLoading}
                          onChange={(e) => handleRoleChange(u._id, e.target.value as UserRole)}
                          className="px-2.5 py-1 text-xs rounded-lg border border-slate-200 bg-white font-medium text-slate-700"
                        >
                          <option value="parent">Parent</option>
                          <option value="slp">SLP</option>
                          <option value="educator">Educator</option>
                          <option value="admin">Admin</option>
                          <option value="superadmin">Superadmin</option>
                        </select>
                      ) : (
                        <Badge
                          variant={
                            u.role === "superadmin"
                              ? "purple"
                              : u.role === "admin"
                              ? "primary"
                              : "neutral"
                          }
                        >
                          {u.role}
                        </Badge>
                      )}
                    </td>
                    <td className="py-4 px-6">
                      <Badge variant={u.status === "active" ? "success" : "danger"}>
                        {u.status}
                      </Badge>
                    </td>
                    <td className="py-4 px-6">
                      {u.mfaEnabled ? (
                        <span className="inline-flex items-center gap-1 text-xs text-emerald-600 font-semibold">
                          <Shield className="w-3.5 h-3.5" />
                          Enabled
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400">Standard</span>
                      )}
                    </td>
                    <td className="py-4 px-6 text-xs text-slate-500">
                      {u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleDateString() : "Never"}
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleToggleStatus(u)}
                          disabled={actionLoading || u._id === currentUser?._id}
                          title={u.status === "active" ? "Suspend Account" : "Activate Account"}
                          className={`p-2 rounded-lg transition-colors ${
                            u.status === "active"
                              ? "text-slate-400 hover:text-amber-600 hover:bg-amber-50"
                              : "text-emerald-600 hover:bg-emerald-50"
                          } disabled:opacity-30`}
                        >
                          {u.status === "active" ? (
                            <UserX className="w-4 h-4" />
                          ) : (
                            <UserCheck className="w-4 h-4" />
                          )}
                        </button>

                        <button
                          onClick={() => handleRevokeSessions(u._id)}
                          disabled={actionLoading}
                          title="Revoke All Sessions"
                          className="p-2 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                        >
                          <LogOut className="w-4 h-4" />
                        </button>

                        {currentUser?.role === "superadmin" && (
                          <button
                            onClick={() => {
                              setSelectedUser(u);
                              setIsDeleteModalOpen(true);
                            }}
                            disabled={actionLoading || u._id === currentUser?._id}
                            title="GDPR / PDPL Permanent Erasure"
                            className="p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors disabled:opacity-30"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <div>
            Page <span className="font-semibold text-slate-900">{page}</span> of{" "}
            <span className="font-semibold text-slate-900">{totalPages}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Confirm PDPL Account Erasure"
      >
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div className="text-xs text-rose-800 leading-relaxed">
              <strong>Permanent Destruction Warning:</strong> This will execute a full Saudi PDPL
              Right-to-Erasure cascade. All owned children, shelves, custom vocabulary cards, and
              recorded voice notes will be permanently purged.
            </div>
          </div>
          <p className="text-sm text-slate-600">
            Are you sure you want to permanently delete the account for{" "}
            <strong className="text-slate-900">{selectedUser?.fullName}</strong> (
            {selectedUser?.email})?
          </p>
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              onClick={() => setIsDeleteModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Cancel
            </button>
            <button
              onClick={handleDeleteUser}
              disabled={actionLoading}
              className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-md shadow-rose-600/30"
            >
              {actionLoading ? "Purging..." : "Confirm & Permanently Delete"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
