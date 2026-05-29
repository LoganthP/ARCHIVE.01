import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../api/client';
import { useSettings } from '../context/SettingsContext';

export default function NotificationsPanel({ isOpen, onClose }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const { settings } = useSettings();

  const isDark = settings.theme.includes('dark') || 
                 settings.theme === 'midnight' || 
                 settings.theme === 'terminal' || 
                 settings.theme === 'amber';

  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await api.get('/notifications');
      setNotifications(res.data);
    } catch (err) {
      console.error('Failed to fetch notifications', err);
    } finally {
      setLoading(false);
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.put('/notifications/read-all');
      setNotifications(notifications.map(n => ({ ...n, unread: false })));
    } catch (err) {
      console.error('Failed to mark all as read', err);
    }
  };

  // Handle escape to close
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const unreadCount = notifications.filter(n => n.unread).length;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40" // Invisible backdrop just to catch clicks outside
          />
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="absolute top-16 right-16 w-96 bg-[#F9F8F6] dark:bg-background border border-gray-300 dark:border-outline-variant shadow-2xl z-50 flex flex-col overflow-hidden origin-top-right rounded-lg"
          >
            <div className="flex items-center justify-between p-4 border-b border-gray-300 dark:border-outline-variant bg-[#F0EFEB] dark:bg-surface">
              <h3 className="font-headline-md font-bold text-gray-900 dark:text-on-surface">Notifications {unreadCount > 0 && `(${unreadCount})`}</h3>
              <button 
                onClick={markAllAsRead}
                className="text-xs font-label-caps tracking-widest text-secondary hover:underline uppercase"
              >
                Mark all as read
              </button>
            </div>
            
            <div className="max-h-[60vh] overflow-y-auto min-h-[100px]">
              {loading && notifications.length === 0 ? (
                <div className="p-8 text-center text-gray-500 dark:text-on-surface-variant font-body-mono text-sm">
                  Loading...
                </div>
              ) : notifications.length === 0 ? (
                <div className="p-8 text-center text-gray-500 dark:text-on-surface-variant font-body-mono text-sm">
                  No notifications yet.
                </div>
              ) : (
                notifications.map((notif) => (
                  <div 
                    key={notif.id} 
                    style={{
                      borderColor: isDark 
                        ? 'color-mix(in srgb, var(--outline-variant) 50%, transparent)' 
                        : 'rgba(229, 231, 235, 1)',
                      backgroundColor: notif.unread 
                        ? (isDark 
                          ? 'color-mix(in srgb, var(--surface) 30%, transparent)' 
                          : 'rgba(255, 255, 255, 0.5)')
                        : undefined
                    }}
                    className={`p-4 border-b last:border-0 hover:bg-[#F0EFEB] dark:hover:bg-surface-container-low transition-colors cursor-pointer relative`}
                  >
                    {notif.unread && (
                      <span className="absolute top-4 left-2 w-2 h-2 rounded-full bg-secondary"></span>
                    )}
                    <div className="flex gap-3 pl-2">
                      <span className={`material-symbols-outlined mt-0.5 text-xl ${notif.color}`}>
                        {notif.icon}
                      </span>
                      <div>
                        <div className="flex items-center justify-between gap-4 mb-1">
                          <h4 className="text-sm font-bold text-gray-900 dark:text-on-surface">{notif.title}</h4>
                          <span className="text-xs font-body-mono text-gray-500 dark:text-on-surface-variant shrink-0">
                            {new Date(notif.time).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-on-surface-variant leading-snug">
                          {notif.message}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
            
            <div className="p-3 border-t border-gray-300 dark:border-outline-variant bg-[#F0EFEB] dark:bg-surface text-center">
              <button 
                onClick={() => fetchNotifications()}
                className="text-xs font-label-caps tracking-widest text-gray-600 dark:text-on-surface-variant hover:text-gray-900 dark:hover:text-on-surface transition-colors uppercase"
              >
                Refresh
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
