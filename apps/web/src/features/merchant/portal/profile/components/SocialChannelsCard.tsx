'use client';

import React from 'react';
import { Share2, Plus, ExternalLink, Pencil, Trash2, Globe } from 'lucide-react';
import { SocialChannel } from '../types';

interface SocialChannelsCardProps {
  channels: SocialChannel[];
  onAddChannel: () => void;
  onEditChannel: (channel: SocialChannel) => void;
  onDeleteChannel: (id: string) => void;
}

export function SocialChannelsCard({
  channels,
  onAddChannel,
  onEditChannel,
  onDeleteChannel,
}: SocialChannelsCardProps) {
  const getBadgeColor = (platform: SocialChannel['platform']) => {
    switch (platform) {
      case 'Facebook':
        return 'text-blue-400 bg-blue-500/10 border-blue-500/20';
      case 'Instagram':
        return 'text-pink-400 bg-pink-500/10 border-pink-500/20';
      case 'TikTok':
        return 'text-rose-300 bg-rose-500/10 border-rose-500/20';
      case 'WhatsApp':
        return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
      case 'YouTube':
        return 'text-red-400 bg-red-500/10 border-red-500/20';
      default:
        return 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20';
    }
  };

  return (
    <div className="p-5 sm:p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-md space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-pink-500/10 border border-pink-500/20 flex items-center justify-center text-pink-400 shrink-0">
            <Share2 className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-100">Social Sales Channels</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Marketing links printed on order packaging slips
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onAddChannel}
          className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 rounded-lg text-xs font-semibold transition-colors cursor-pointer shrink-0 shadow-sm min-h-[34px]"
        >
          <Plus className="h-3.5 w-3.5 text-emerald-400" />
          <span>Add Channel</span>
        </button>
      </div>

      {/* Channels List */}
      <div>
        {channels.length === 0 ? (
          <div className="text-center py-6 px-4 rounded-xl bg-slate-950/50 border border-dashed border-slate-800 text-slate-400 text-xs space-y-2">
            <Globe className="h-6 w-6 text-slate-600 mx-auto" />
            <p className="font-medium text-slate-300">No social channels connected yet</p>
            <p className="text-[11px] text-slate-500">
              Connect your Facebook, Instagram, or WhatsApp to print on customer memos.
            </p>
            <button
              type="button"
              onClick={onAddChannel}
              className="mt-2 text-xs font-semibold text-emerald-400 hover:text-emerald-300 transition-colors"
            >
              + Add first store channel
            </button>
          </div>
        ) : (
          <div className="space-y-2.5">
            {channels.map((ch) => (
              <div
                key={ch.id}
                className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/90 hover:border-slate-700 flex items-center justify-between gap-3 transition-colors group"
              >
                <div className="min-w-0 flex items-center gap-2.5">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold border uppercase shrink-0 ${getBadgeColor(
                      ch.platform
                    )}`}
                  >
                    {ch.platform}
                  </span>
                  <a
                    href={
                      ch.platform === 'WhatsApp'
                        ? `https://wa.me/${ch.url.replace(/\D/g, '')}`
                        : ch.url
                    }
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-slate-300 hover:text-emerald-400 font-medium truncate block transition-colors"
                    title={ch.url}
                  >
                    {ch.url}
                  </a>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => onEditChannel(ch)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors cursor-pointer"
                    title="Edit Channel"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onDeleteChannel(ch.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                    title="Remove Channel"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
