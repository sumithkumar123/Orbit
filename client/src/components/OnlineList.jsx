import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import usePresence from "../hooks/usePresence";
import http from "../api/http";
import Avatar from "./Avatar";

export default function OnlineList({
  onSelectUser,
  filterQuery = "",
  statusFilter = "all",
  navigateOnClick = true,
}) {
  const navigate = useNavigate();
  const { online } = usePresence(); // [{ userId, name, status, image, tag }, ...]
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;
    const fetchUsers = async () => {
      try {
        setLoading(true);
        const res = await http.get("/users/all");
        if (!mounted) return;
        const users = res.data?.users || res.data || [];
        setAllUsers(Array.isArray(users) ? users : []);
        setError("");
      } catch (err) {
        console.error("OnlineList load users error:", err);
        if (mounted) {
          setError(
            err?.response?.data?.message || "Failed to load users. Please try again."
          );
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchUsers();
    return () => {
      mounted = false;
    };
  }, []);

  const presenceMap = useMemo(() => {
    const map = new Map();
    (online || []).forEach((u) => {
      if (!u?.userId) return;
      map.set(String(u.userId), u);
    });
    return map;
  }, [online]);

  const mergedUsers = useMemo(() => {
    const base = (allUsers || []).map((user) => {
      const rawId = user?._id || user?.id || user?.userId;
      if (!rawId) return null;
      const id = String(rawId);
      const presence = presenceMap.get(id);
      const isOnline = Boolean(presence);
      return {
        userId: id,
        name: user?.name || presence?.name || "User",
        image: presence?.image || user?.image || null,
        tag: user?.tag || presence?.tag || "",
        status: isOnline ? presence?.status || "online" : "offline",
        availability: isOnline ? "online" : "offline",
      };
    }).filter(Boolean);

    const knownIds = new Set(base.map((u) => u.userId));
    presenceMap.forEach((presence, id) => {
      if (!knownIds.has(id)) {
        base.push({
          userId: id,
          name: presence?.name || "User",
          image: presence?.image || null,
          tag: presence?.tag || "",
          status: presence?.status || "online",
          availability: "online",
        });
      }
    });

    return base.sort((a, b) => a.name.localeCompare(b.name));
  }, [allUsers, presenceMap]);

  const data = useMemo(() => {
    const q = (filterQuery || "").trim().toLowerCase();
    return mergedUsers.filter((u) => {
      const matchesQuery = (u?.name || "").toLowerCase().includes(q);
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "online" && u.availability === "online") ||
        (statusFilter === "offline" && u.availability === "offline");
      return matchesQuery && matchesStatus;
    });
  }, [mergedUsers, filterQuery, statusFilter]);

  if (loading) {
    return (
      <div className="p-4 text-sm text-paper-400">Loading users...</div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-sm text-red-400 bg-red-950/30 border border-red-900/30 rounded-xl">
        {error}
      </div>
    );
  }

  if (!data?.length) {
    return (
      <div className="p-4 text-sm text-paper-400">No users to show yet.</div>
    );
  }

  return (
    <div className="p-2 sm:p-3 space-y-1 sm:space-y-2 max-h-[70vh] overflow-y-auto">
      {data.map((u) => {
        const isOffline = u.availability === "offline";
        const color = isOffline
          ? "text-paper-500"
          : u.status === "busy"
            ? "text-red-400"
            : u.status === "away"
              ? "text-yellow-400"
              : "text-green-400";
        const statusLabel = isOffline ? "offline" : u.status || "online";
        const tagLabel = u.tag || "No tag set";
        return (
          <button
            key={u.userId}
            onClick={() => {
              onSelectUser?.(u);
              if (navigateOnClick) navigate(`/chat/${u.userId}`);
            }}
            className="w-full flex items-center gap-3 rounded-xl border border-ink-700 bg-ink-800/50 hover:bg-ink-700/40 transition px-3 py-2.5"
            title={`${u.name || "User"} - ${statusLabel}`}
          >
            <Avatar
              src={u.image}
              name={u.name}
              className="h-10 w-10 rounded-full border border-ink-600 bg-ink-700"
            />
            <div className="min-w-0 flex-1 text-left">

              <div className="flex items-center gap-2">
                <span className="truncate font-medium">{u.name || "User"}</span>
                <span className={`text-xs ${color}`}>{statusLabel}</span>
              </div>
              <p className="truncate text-sm text-paper-400">{tagLabel}</p>
            </div>
          </button>
        );
      })}
    </div>
  );
}
