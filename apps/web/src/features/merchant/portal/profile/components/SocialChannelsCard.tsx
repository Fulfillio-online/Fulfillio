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
      default:
        return 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20';
    }
  };

  return (
    <div className="p-5 sm:p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm relative overflow-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-pink-500/10 border border-pink-500/20 flex items-center justify-center text-pink-400">
            <Share2 className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-100">Customer Sales & Social Channels</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Channels printed on customer packing slips and memos for brand marketing
            </p>
          </div>
        </div>

        <button
          onClick={onAddChannel}
          className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors self-start sm:self-auto shadow-sm"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>Add Channel</span>
        </button>
      </div>

      {/* Channels List */}
      <div className="pt-5">
        {channels.length === 0 ? (
          <div className="text-center py-6 text-slate-500 text-xs">
            No social channels linked yet. Click &quot;Add Channel&quot; to connect store links.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {channels.map((ch) => (
              <div
                key={ch.id}
                className="p-3 bg-slate-800/60 border border-slate-700/60 rounded-xl flex items-center justify-between gap-2 group hover:border-slate-600 transition-colors"
              >
                <div className="min-w-0 flex items-center gap-2">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold border uppercase shrink-0 ${getBadgeColor(
                      ch.platform
                    )}`}
                  >
                    {ch.platform}
                  </span>
                  <a
                    href={ch.platform === 'WhatsApp' ? `https://wa.me/${ch.url.replace(/\D/g, '')}` : ch.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-slate-300 hover:text-emerald-400 font-medium truncate block"
                    title={ch.url}
                  >
                    {ch.url}
                  </a>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => onEditChannel(ch)}
                    className="p-1 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-700 transition-colors"
                    title="Edit Channel"
                  >
                    <Pencil className="h-3 w-3" />
                  </button>
                  <button
                    onClick={() => onDeleteChannel(ch.id)}
                    className="p-1 rounded text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                    title="Remove Channel"
                  >
                    <Trash2 className="h-3 w-3" />
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
