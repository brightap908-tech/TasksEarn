import React from "react";
import { EarnerNotification } from "../types";
import PlatformIcon from "./PlatformIcon";
import { Bell, BellOff, CheckCheck, Clock, ChevronRight, Inbox } from "lucide-react";

interface EarnerNotificationsProps {
  notifications: EarnerNotification[];
  onMarkRead: (id: string) => void;
  onMarkAllRead: () => void;
  onNavigate: (view: string) => void;
  onTaskClick: (taskId: string) => void;
}

export default function EarnerNotifications({
  notifications,
  onMarkRead,
  onMarkAllRead,
  onNavigate,
  onTaskClick,
}: EarnerNotificationsProps) {
  const unreadCount = notifications.filter((n) => !n.read).length;

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHrs = Math.floor(diffMins / 60);
    if (diffHrs < 24) return `${diffHrs}h ago`;
    const diffDays = Math.floor(diffHrs / 24);
    if (diffDays < 7) return `${diffDays}d ago`;
    return d.toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" });
  };

  const handleNotifClick = (n: EarnerNotification) => {
    if (!n.read) onMarkRead(n.id);
    // Navigate to task browse tab and highlight that task
    onTaskClick(n.taskId);
    onNavigate("earner-tasks");
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-blue-50 p-2.5">
            <Bell className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <h2 className="font-display text-sm font-bold text-gray-900">Notifications</h2>
            <p className="text-[10px] text-gray-400 mt-0.5">
              {unreadCount > 0 ? `${unreadCount} unread` : "All caught up"}
            </p>
          </div>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={onMarkAllRead}
            className="flex items-center gap-1.5 rounded-lg bg-blue-50 px-3 py-1.5 text-[10px] font-bold text-blue-600 hover:bg-blue-100 transition-colors cursor-pointer"
          >
            <CheckCheck className="h-3.5 w-3.5" />
            Mark all read
          </button>
        )}
      </div>

      {/* Notification list */}
      <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
            <div className="rounded-2xl bg-gray-50 p-5 mb-4">
              <Inbox className="h-8 w-8 text-gray-300" />
            </div>
            <p className="text-xs font-bold text-gray-500">No notifications yet</p>
            <p className="text-[10px] text-gray-400 mt-1 max-w-xs">
              When advertisers post new tasks matching your account, you'll be notified here.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {notifications.map((n) => (
              <button
                key={n.id}
                onClick={() => handleNotifClick(n)}
                className={`w-full text-left px-5 py-4 hover:bg-gray-50/70 transition-colors flex items-start gap-4 ${
                  !n.read ? "bg-blue-50/40" : ""
                }`}
              >
                {/* Platform Icon */}
                <div className="shrink-0 mt-0.5">
                  <PlatformIcon platform={n.platform} size={28} showBg />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className={`text-xs font-bold leading-snug line-clamp-2 ${!n.read ? "text-gray-900" : "text-gray-700"}`}>
                      {n.message}
                    </p>
                    {!n.read && (
                      <span className="shrink-0 mt-1 h-2 w-2 rounded-full bg-blue-500" />
                    )}
                  </div>

                  <div className="flex items-center flex-wrap gap-2 mt-2">
                    <span className="rounded-lg bg-blue-50 px-2 py-0.5 text-[9px] font-bold text-blue-700">
                      {n.platform}
                    </span>
                    <span className="rounded-lg bg-emerald-50 px-2 py-0.5 text-[9px] font-bold text-emerald-700">
                      ₦{n.reward.toLocaleString()} reward
                    </span>
                    <span className="flex items-center gap-0.5 text-[9px] text-gray-400 font-medium">
                      <Clock className="h-2.5 w-2.5" />
                      {formatDate(n.createdAt)}
                    </span>
                  </div>

                  <p className="text-[10px] text-gray-500 mt-1 line-clamp-1">{n.taskTitle}</p>
                </div>

                <ChevronRight className="h-4 w-4 text-gray-300 shrink-0 mt-1" />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
