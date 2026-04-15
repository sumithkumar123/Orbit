import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Loader2,
  RefreshCw,
  ShieldCheck,
  UserPlus,
  ShieldOff,
  Trash2,
  KeyRound,
  Radio,
  Users as UsersIcon,
} from "lucide-react";
import {
  fetchSystemState,
  adminSetSystem,
  adminFetchUsers,
  adminCreateUser,
  adminDeleteUser,
  adminResetPassword,
} from "../api/admin";
import http from "../api/http";

// Cloudinary constants removed

const initialCreateForm = {
  name: "",
  email: "",
  mobile: "",
  address: "",
  tag: "",
  imageUrl: "",
};

const initialResetForm = {
  name: "",
  email: "",
  newPassword: "orbit123",
};

export default function AdminPortal() {
  const [systemState, setSystemState] = useState({ running: true, reason: "" });
  const [reason, setReason] = useState("");
  const [systemLoading, setSystemLoading] = useState(false);
  const [systemMessage, setSystemMessage] = useState("");

  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [usersError, setUsersError] = useState("");
  const [deletingId, setDeletingId] = useState("");

  const [createForm, setCreateForm] = useState(initialCreateForm);
  const [createImageFile, setCreateImageFile] = useState(null);
  const [createPreview, setCreatePreview] = useState("");
  const [createLoading, setCreateLoading] = useState(false);
  const [createMessage, setCreateMessage] = useState("");

  const [resetForm, setResetForm] = useState(initialResetForm);
  const [resetLoading, setResetLoading] = useState(false);
  const [resetMessage, setResetMessage] = useState("");

  // UI: which panel is active in the admin portal
  const [activeTab, setActiveTab] = useState("system");

  const loadUsers = useCallback(async () => {
    setUsersLoading(true);
    setUsersError("");
    try {
      const res = await adminFetchUsers();
      setUsers(res?.users || []);
    } catch (error) {
      console.error("adminFetchUsers error:", error);
      setUsersError(
        error?.response?.data?.message || "Failed to load users. Try again."
      );
    } finally {
      setUsersLoading(false);
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    const init = async () => {
      try {
        const current = await fetchSystemState();
        if (mounted) {
          setSystemState(current);
          setReason(current?.reason || "");
        }
      } catch (error) {
        console.error("fetchSystemState error:", error);
      }
    };
    init();
    loadUsers();
    return () => {
      mounted = false;
    };
  }, [loadUsers]);

  // Use local upload
  const uploadImageIfNeeded = async () => {
    if (!createImageFile) return createForm.imageUrl?.trim() || "";
    const formData = new FormData();
    formData.append("file", createImageFile);

    try {
      const res = await http.post("/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return res.data.url || res.data.secure_url || "";
    } catch (e) {
      console.error("Upload failed", e);
      return "";
    }
  };

  const handleToggleSystem = async () => {
    setSystemLoading(true);
    setSystemMessage("");
    try {
      const next = await adminSetSystem(!systemState.running, reason);
      setSystemState(next);
      setSystemMessage(
        next.running ? "System resumed successfully." : "System paused."
      );
    } catch (error) {
      console.error("adminSetSystem error:", error);
      setSystemMessage(
        error?.response?.data?.message ||
        "Failed to update system state. Please try again."
      );
    } finally {
      setSystemLoading(false);
    }
  };

  const handleCreateChange = (e) => {
    const { name, value } = e.target;
    setCreateForm((prev) => ({ ...prev, [name]: value }));
    setCreateMessage("");
  };

  const handleCreateImageChange = (e) => {
    const file = e.target.files?.[0];
    setCreateImageFile(file || null);
    setCreatePreview(file ? URL.createObjectURL(file) : "");
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setCreateLoading(true);
    setCreateMessage("");
    try {
      let imageUrl = await uploadImageIfNeeded();
      // Offline fallback: if no image, we just leave it empty.
      // The <Avatar /> component handles initials automatically.
      if (!imageUrl && createForm.name) {
        imageUrl = "";
      }

      const payload = {
        ...createForm,
        image: imageUrl,
        password: "orbit123",
      };

      await adminCreateUser(payload);
      setCreateMessage("User created successfully (password: orbit123).");
      setCreateForm(initialCreateForm);
      setCreateImageFile(null);
      setCreatePreview("");
      loadUsers();
    } catch (error) {
      console.error("adminCreateUser error:", error);
      setCreateMessage(
        error?.response?.data?.message || "Failed to create user."
      );
    } finally {
      setCreateLoading(false);
    }
  };

  const handleResetChange = (e) => {
    const { name, value } = e.target;
    setResetForm((prev) => ({ ...prev, [name]: value }));
    setResetMessage("");
  };

  const handleResetSubmit = async (e) => {
    e.preventDefault();
    setResetLoading(true);
    setResetMessage("");
    try {
      const res = await adminResetPassword(resetForm);
      setResetMessage(
        `Password reset. Temporary password: ${res?.temporaryPassword || resetForm.newPassword
        }.`
      );
      setResetForm(initialResetForm);
    } catch (error) {
      console.error("adminResetPassword error:", error);
      setResetMessage(
        error?.response?.data?.message || "Failed to reset password."
      );
    } finally {
      setResetLoading(false);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!userId) return;
    const confirmed = window.confirm(
      "Are you sure you want to delete this user? This action cannot be undone."
    );
    if (!confirmed) return;
    setDeletingId(userId);
    try {
      await adminDeleteUser(userId);
      await loadUsers();
    } catch (error) {
      console.error("adminDeleteUser error:", error);
      setUsersError(
        error?.response?.data?.message || "Failed to delete the user."
      );
    } finally {
      setDeletingId("");
    }
  };

  const sortedUsers = useMemo(
    () =>
      [...users].sort((a, b) =>
        (a?.name || "").localeCompare(b?.name || "", undefined, {
          sensitivity: "base",
        })
      ),
    [users]
  );

  const tabs = [
    {
      id: "system",
      label: "System Control",
      description: "Pause / resume OfflineOrbit and set reason.",
      icon: ShieldCheck,
    },
    {
      id: "create",
      label: "Create User",
      description: "Add a new member to the LAN.",
      icon: UserPlus,
    },
    {
      id: "reset",
      label: "Reset Password",
      description: "Issue a temporary password.",
      icon: KeyRound,
    },
    {
      id: "users",
      label: "Users",
      description: "Review and delete users.",
      icon: UsersIcon,
    },
  ];

  return (
    <div className="min-h-screen bg-ink-950 text-paper-50 flex flex-col">
      {/* Top bar */}
      <header className="border-b border-ink-800 bg-ink-900/80 backdrop-blur">
        <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-brand/15 text-brand">
              <Radio className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold tracking-tight">
                OfflineOrbit
              </p>
              <p className="text-[11px] text-paper-400">
                Admin control center
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs sm:text-sm">
            <span className="inline-flex items-center gap-1 rounded-full border border-ink-700 bg-ink-800 px-3 py-1">
              <span
                className={`h-2 w-2 rounded-full ${systemState.running ? "bg-emerald-400" : "bg-red-400"
                  } animate-pulse`}
              />
              <span className="font-medium">
                {systemState.running ? "System online" : "System paused"}
              </span>
            </span>
            <span className="hidden sm:inline text-paper-400">
              Users:{" "}
              <span className="font-semibold text-paper-100">
                {users.length}
              </span>
            </span>
          </div>
        </div>
      </header>

      {/* Main layout */}
      <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-6 md:flex-row md:py-8">
        {/* Sidebar / tab nav */}
        <aside className="md:w-64">
          <nav className="flex rounded-2xl border border-ink-800 bg-ink-900/80 p-2 md:flex-col">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex flex-1 items-center gap-3 rounded-xl px-3 py-2 text-left text-xs md:text-sm transition
                    ${isActive
                      ? "bg-brand text-paper-50 shadow-elev-2"
                      : "bg-transparent text-paper-300 hover:bg-ink-800"
                    }`}
                >
                  <span
                    className={`flex h-8 w-8 items-center justify-center rounded-xl ${isActive ? "bg-black/15" : "bg-ink-800"
                      }`}
                  >
                    <Icon className="h-4 w-4" />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate font-medium">{tab.label}</p>
                    <p className="hidden text-[11px] text-paper-400 md:block">
                      {tab.description}
                    </p>
                  </div>
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Content area */}
        <main className="flex-1 space-y-5">
          {/* System control */}
          {activeTab === "system" && (
            <section className="rounded-2xl border border-ink-800 bg-ink-900/80 p-5 space-y-4 shadow-elev-2">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-brand-300">
                    System
                  </p>
                  <h2 className="text-lg font-semibold">Availability</h2>
                  <p className="text-sm text-paper-400">
                    Toggle OfflineOrbit for maintenance and internal updates.
                  </p>
                </div>
                <button
                  onClick={handleToggleSystem}
                  disabled={systemLoading}
                  className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition
                    ${systemState.running
                      ? "bg-brand hover:bg-brand-500"
                      : "bg-emerald-600 hover:bg-emerald-500"
                    } disabled:opacity-60`}
                >
                  {systemLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Updating...
                    </>
                  ) : systemState.running ? (
                    <>
                      <ShieldOff className="h-4 w-4" />
                      Pause system
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="h-4 w-4" />
                      Start system
                    </>
                  )}
                </button>
              </div>

              <div className="space-y-2">
                <label className="text-sm text-paper-300">
                  Reason (optional)
                </label>
                <input
                  className="w-full rounded-xl border border-ink-700 bg-ink-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Maintenance window, release train, etc."
                />
              </div>

              {systemMessage && (
                <p className="text-sm text-paper-300">{systemMessage}</p>
              )}
            </section>
          )}

          {/* Create user */}
          {activeTab === "create" && (
            <section className="rounded-2xl border border-ink-800 bg-ink-900/80 p-5 space-y-5 shadow-elev-2">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-brand/15 text-brand">
                  <UserPlus className="h-4 w-4" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold">Create user</h2>
                  <p className="text-xs text-paper-400">
                    Default password:{" "}
                    <span className="font-semibold text-paper-100">
                      orbit123
                    </span>
                  </p>
                </div>
              </div>

              <form
                className="space-y-4"
                onSubmit={handleCreateSubmit}
                autoComplete="off"
              >
                {/* Profile image */}
                <div className="space-y-2">
                  <p className="text-sm text-paper-300">Profile image</p>
                  <div className="flex flex-wrap items-center gap-4">
                    <div className="h-16 w-16 rounded-full bg-ink-800 border border-ink-700 overflow-hidden flex items-center justify-center">
                      {createPreview ? (
                        <img
                          src={createPreview}
                          alt="Preview"
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <span className="text-[11px] text-paper-400">
                          No image
                        </span>
                      )}
                    </div>

                    <div className="space-y-2 text-xs text-paper-400">
                      <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-ink-700 bg-ink-800 px-3 py-2 text-xs font-medium hover:bg-ink-700">
                        <span>Upload image</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleCreateImageChange}
                          className="hidden"
                        />
                      </label>
                      <p className="text-[11px]">
                        Or paste an image URL below. A default avatar will be
                        generated from the name if left empty.
                      </p>
                    </div>
                  </div>
                  <input
                    name="imageUrl"
                    value={createForm.imageUrl}
                    onChange={handleCreateChange}
                    placeholder="Image URL (optional)"
                    className="mt-2 w-full rounded-xl border border-ink-700 bg-ink-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
                  />
                </div>

                {/* Basic details */}
                <div className="grid gap-3 sm:grid-cols-2">
                  <input
                    name="name"
                    value={createForm.name}
                    onChange={handleCreateChange}
                    placeholder="Full name"
                    required
                    className="rounded-xl border border-ink-700 bg-ink-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
                  />
                  <input
                    name="email"
                    type="email"
                    value={createForm.email}
                    onChange={handleCreateChange}
                    placeholder="Email"
                    required
                    className="rounded-xl border border-ink-700 bg-ink-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
                  />
                  <input
                    name="mobile"
                    value={createForm.mobile}
                    onChange={handleCreateChange}
                    placeholder="Mobile"
                    required
                    className="rounded-xl border border-ink-700 bg-ink-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
                  />
                  <input
                    name="tag"
                    value={createForm.tag}
                    onChange={handleCreateChange}
                    placeholder="User tag / handle"
                    required
                    className="rounded-xl border border-ink-700 bg-ink-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
                  />
                </div>

                <input
                  name="address"
                  value={createForm.address}
                  onChange={handleCreateChange}
                  placeholder="Address"
                  required
                  className="w-full rounded-xl border border-ink-700 bg-ink-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
                />

                <button
                  type="submit"
                  disabled={createLoading}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand px-4 py-2 text-sm font-medium shadow-elev-2 transition hover:bg-brand-500 disabled:opacity-60"
                >
                  {createLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <UserPlus className="h-4 w-4" />
                      Create user
                    </>
                  )}
                </button>

                {createMessage && (
                  <p className="text-center text-sm text-paper-300">
                    {createMessage}
                  </p>
                )}
              </form>
            </section>
          )}

          {/* Reset password */}
          {activeTab === "reset" && (
            <section className="rounded-2xl border border-ink-800 bg-ink-900/80 p-5 space-y-5 shadow-elev-2">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-brand/15 text-brand">
                  <KeyRound className="h-4 w-4" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold">Reset password</h2>
                  <p className="text-xs text-paper-400">
                    Provide the user details. Default reset:{" "}
                    <span className="font-semibold text-paper-100">
                      orbit123
                    </span>{" "}
                    (or set a custom password).
                  </p>
                </div>
              </div>

              <form className="space-y-3" onSubmit={handleResetSubmit}>
                <input
                  name="name"
                  value={resetForm.name}
                  onChange={handleResetChange}
                  placeholder="Full name"
                  required
                  className="w-full rounded-xl border border-ink-700 bg-ink-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
                />
                <input
                  name="email"
                  type="email"
                  value={resetForm.email}
                  onChange={handleResetChange}
                  placeholder="Email"
                  required
                  className="w-full rounded-xl border border-ink-700 bg-ink-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
                />
                <input
                  name="newPassword"
                  value={resetForm.newPassword}
                  onChange={handleResetChange}
                  placeholder="New password (defaults to orbit123)"
                  className="w-full rounded-xl border border-ink-700 bg-ink-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
                />

                <button
                  type="submit"
                  disabled={resetLoading}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-brand/40 bg-ink-800 px-4 py-2 text-sm font-medium transition hover:bg-ink-700 disabled:opacity-60"
                >
                  {resetLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Resetting...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="h-4 w-4" />
                      Reset password
                    </>
                  )}
                </button>

                {resetMessage && (
                  <p className="text-center text-sm text-paper-300">
                    {resetMessage}
                  </p>
                )}
              </form>
            </section>
          )}

          {/* Users list */}
          {activeTab === "users" && (
            <section className="rounded-2xl border border-ink-800 bg-ink-900/80 p-5 space-y-4 shadow-elev-2">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="flex items-center gap-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-brand/15 text-brand">
                    <UsersIcon className="h-4 w-4" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold">
                      Users ({users.length})
                    </h2>
                    <p className="text-xs text-paper-400">
                      Review accounts and prune inactive profiles.
                    </p>
                  </div>
                </div>

                <button
                  onClick={loadUsers}
                  disabled={usersLoading}
                  className="ml-auto inline-flex items-center justify-center gap-1 rounded-xl border border-ink-700 bg-ink-800 px-3 py-1.5 text-xs text-paper-300 hover:bg-ink-700 disabled:opacity-60"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  Refresh
                </button>
              </div>

              {usersError && (
                <div className="rounded-xl border border-red-900/40 bg-red-950/40 px-3 py-2 text-sm text-red-400">
                  {usersError}
                </div>
              )}

              {usersLoading ? (
                <div className="flex items-center gap-2 text-sm text-paper-300">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading users...
                </div>
              ) : sortedUsers.length === 0 ? (
                <p className="text-sm text-paper-400">No users found.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-[640px] w-full text-sm">
                    <thead>
                      <tr className="border-b border-ink-800 text-left text-paper-400">
                        <th className="py-2 pr-4">Name</th>
                        <th className="py-2 pr-4">Email</th>
                        <th className="py-2 pr-4">Tag</th>
                        <th className="py-2 pr-4">Mobile</th>
                        <th className="w-24 py-2 pr-4 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sortedUsers.map((user) => (
                        <tr
                          key={user._id || user.id}
                          className="border-b border-ink-800/60 last:border-none"
                        >
                          <td className="py-2 pr-4">
                            <div className="font-medium text-paper-100">
                              {user.name}
                            </div>
                            <p className="text-xs capitalize text-paper-400">
                              {user.role}
                            </p>
                          </td>
                          <td className="py-2 pr-4">{user.email}</td>
                          <td className="py-2 pr-4">{user.tag}</td>
                          <td className="py-2 pr-4">{user.mobile}</td>
                          <td className="py-2 pr-4 text-center">
                            <button
                              onClick={() =>
                                handleDeleteUser(user._id || user.id)
                              }
                              disabled={deletingId === (user._id || user.id)}
                              className="inline-flex items-center gap-1 rounded-lg border border-red-500/50 px-2 py-1 text-xs text-red-300 hover:bg-red-500/10 disabled:opacity-60"
                            >
                              {deletingId === (user._id || user.id) ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <Trash2 className="h-3.5 w-3.5" />
                              )}
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          )}
        </main>
      </div>
    </div>
  );
}
