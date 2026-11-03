'use client';

import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/ui';
import { SocialChannel } from '../../types';

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
            className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
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
            Channel URL or Username *
          </label>
          <input
            type="text"
            required
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="e.g. https://facebook.com/yourstore"
            className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div className="pt-2 flex justify-end gap-3 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-xs font-semibold text-white shadow-sm cursor-pointer"
          >
            Save Channel
          </button>
        </div>
      </form>
    </Modal>
  );
}
