'use client';

import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/ui';
import { SocialChannel } from '../types';

interface SocialChannelModalProps {
  isOpen: boolean;
  onClose: () => void;
  channel: SocialChannel | null;
  onSave: (channel: SocialChannel) => void;
}

export function SocialChannelModal({
  isOpen,
  onClose,
  channel,
  onSave,
}: SocialChannelModalProps) {
  const [platform, setPlatform] = useState<SocialChannel['platform']>('Facebook');
  const [url, setUrl] = useState('');

  useEffect(() => {
    if (channel) {
      setPlatform(channel.platform);
      setUrl(channel.url);
    } else {
      setPlatform('Facebook');
      setUrl('');
    }
  }, [channel, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;
    onSave({
      id: channel?.id || `soc-${Date.now()}`,
      platform,
      url: url.trim(),
    });
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={channel ? 'Edit Social Channel' : 'Add Social Media Channel'}
      subtitle="Connect customer-facing store links for order slip marketing."
      size="sm"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        <div>
          <label className="text-xs font-semibold text-slate-400 block mb-1">
            Platform *
          </label>
          <select
            value={platform}
            onChange={(e) => setPlatform(e.target.value as SocialChannel['platform'])}
            aria-label="Social Media Platform"
            className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
          >
            <option value="Facebook">Facebook</option>
            <option value="Instagram">Instagram</option>
            <option value="TikTok">TikTok</option>
            <option value="YouTube">YouTube</option>
            <option value="WhatsApp">WhatsApp</option>
          </select>
        </div>

        <div>
          <label className="text-xs font-semibold text-slate-400 block mb-1">
            Channel URL or Phone *
          </label>
          <input
            type="text"
            required
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder={
              platform === 'WhatsApp'
                ? '+880 1712-345678'
                : `https://${platform.toLowerCase()}.com/yourstore`
            }
            className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-mono"
          />
        </div>

        <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 text-xs text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold transition-colors shadow-sm"
          >
            Save Channel
          </button>
        </div>
      </form>
    </Modal>
  );
}
