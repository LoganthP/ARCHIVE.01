import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api, { getProfile, updateProfile } from '../api/client';
import toast from 'react-hot-toast';
import { useSettings } from '../context/SettingsContext';

export default function ProfileDrawer({ isOpen, onClose }) {
  const [profile, setProfile] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const { settings } = useSettings();

  useEffect(() => {
    if (isOpen) {
      loadProfile();
    }
  }, [isOpen]);

  const loadProfile = async () => {
    try {
      const data = await getProfile();
      setProfile(data);
      setName(data.name || '');
      setEmail(data.email || '');
    } catch (err) {
      console.error(err);
      toast.error('Failed to load profile');
    }
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      const data = await updateProfile({ name, email });
      setProfile(data);
      setIsEditing(false);
      toast.success('Profile updated');
    } catch (err) {
      console.error(err);
      toast.error('Failed to update profile');
    } finally {
      setLoading(false);
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

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 transition-colors"
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 h-full w-full max-w-md bg-[#F9F8F6] dark:bg-background border-l border-gray-300 dark:border-outline-variant shadow-2xl z-50 flex flex-col overflow-y-auto"
          >
            {/* Header */}
            <div 
              style={{
                backgroundColor: 'color-mix(in srgb, var(--background) 90%, transparent)'
              }}
              className="flex items-center justify-between p-6 border-b border-gray-300 dark:border-outline-variant sticky top-0 backdrop-blur-md z-10"
            >
              <h2 className="font-headline-md text-2xl font-bold tracking-tight text-gray-900 dark:text-on-surface">
                Profile
              </h2>
              <button 
                onClick={onClose}
                className="text-gray-500 hover:text-gray-900 dark:text-on-surface-variant dark:hover:text-on-surface transition-colors p-1"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* Content */}
            <div className="p-6 flex flex-col gap-8 flex-grow">
              
              {/* User Info */}
              {profile ? (
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center text-[#F9F8F6] text-2xl font-bold shrink-0">
                    {profile.name ? profile.name.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <div className="flex-grow">
                    {isEditing ? (
                      <div className="flex flex-col gap-2 w-full">
                        <input
                          type="text"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          className="w-full bg-transparent border border-gray-300 dark:border-outline-variant rounded p-1 text-sm font-bold text-gray-900 dark:text-on-surface"
                          placeholder="Name"
                        />
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="w-full bg-transparent border border-gray-300 dark:border-outline-variant rounded p-1 font-body-mono text-sm text-gray-900 dark:text-on-surface"
                          placeholder="Email"
                        />
                        <div className="flex gap-2 mt-1">
                          <button onClick={handleSave} disabled={loading} className="btn-secondary py-1 px-3 text-xs">Save</button>
                          <button onClick={() => setIsEditing(false)} disabled={loading} className="btn-outline py-1 px-3 text-xs">Cancel</button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center justify-between">
                          <h3 className="font-headline-md text-xl font-bold text-gray-900 dark:text-on-surface">{profile.name}</h3>
                          <button onClick={() => setIsEditing(true)} className="text-xs text-secondary hover:underline">Edit</button>
                        </div>
                        <p className="font-body-mono text-sm text-gray-500 dark:text-on-surface-variant">{profile.email}</p>
                        <div className="mt-2 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border border-secondary text-secondary text-xs font-label-caps tracking-widest uppercase">
                          <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span>
                          {profile.plan || 'Pro Tier'} Active
                        </div>
                      </>
                    )}
                  </div>
                </div>
              ) : (
                <div className="animate-pulse flex gap-4">
                  <div className="w-16 h-16 rounded-full bg-gray-300 dark:bg-surface"></div>
                  <div className="flex-1 space-y-2 py-1">
                    <div className="h-4 bg-gray-300 dark:bg-surface rounded w-3/4"></div>
                    <div className="h-4 bg-gray-300 dark:bg-surface rounded w-1/2"></div>
                  </div>
                </div>
              )}

              {/* Stats */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 border border-gray-300 dark:border-outline-variant rounded-lg bg-[#F0EFEB] dark:bg-surface transition-colors">
                  <p className="font-label-caps text-xs tracking-widest uppercase text-gray-500 dark:text-on-surface-variant mb-2">Papers Indexed</p>
                  <p className="font-body-mono text-2xl font-bold text-gray-900 dark:text-on-surface">1,428</p>
                </div>
                <div className="p-4 border border-gray-300 dark:border-outline-variant rounded-lg bg-[#F0EFEB] dark:bg-surface transition-colors">
                  <p className="font-label-caps text-xs tracking-widest uppercase text-gray-500 dark:text-on-surface-variant mb-2">Queries Run</p>
                  <p className="font-body-mono text-2xl font-bold text-gray-900 dark:text-on-surface">34.2k</p>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-gray-300 dark:border-outline-variant bg-[#F0EFEB] dark:bg-surface mt-auto">
              <button className="w-full py-3 flex items-center justify-center gap-2 text-red-500 border border-red-500 hover:bg-red-500/10 transition-colors rounded">
                <span className="material-symbols-outlined text-sm">logout</span>
                <span className="font-label-caps uppercase tracking-widest">Sign Out</span>
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
