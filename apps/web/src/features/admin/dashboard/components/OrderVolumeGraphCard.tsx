'use client';

import React, { useState } from 'react';
import {
  TrendingUp,
  Layers,
  ArrowRight,
  PackageCheck,
  Truck,
  RotateCcw,
  CheckCircle2,
  Calendar,
  Filter,
} from 'lucide-react';
import { OrderTimeSeriesPoint } from '../types';

interface OrderVolumeGraphCardProps {
  timeSeries: OrderTimeSeriesPoint[];
  timeframeLabel: string;
}

export function OrderVolumeGraphCard({
  timeSeries,
  timeframeLabel,
}: OrderVolumeGraphCardProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [activeSeries, setActiveSeries] = useState<'all' | 'intake' | 'dispatch' | 'delivered'>('all');

  // Find max value to scale SVG height
  const maxVal = Math.max(
    ...timeSeries.map((d) => Math.max(d.intake, d.dispatched, d.delivered)),
    100
  );

  const graphHeight = 220;
  const graphWidth = 600;
  const paddingX = 40;
  const paddingY = 20;

  const pointsCount = timeSeries.length;
  const stepX = pointsCount > 1 ? (graphWidth - paddingX * 2) / (pointsCount - 1) : 0;

  const getCoordinates = (value: number, index: number) => {
    const x = paddingX + index * stepX;
    const y = graphHeight - paddingY - (value / maxVal) * (graphHeight - paddingY * 2);
    return { x, y };
  };

  const makePathD = (key: 'intake' | 'dispatched' | 'delivered') => {
    if (timeSeries.length === 0) return '';
    return timeSeries.reduce((acc, curr, index) => {
      const { x, y } = getCoordinates(curr[key], index);
      return index === 0 ? `M ${x} ${y}` : `${acc} L ${x} ${y}`;
    }, '');
  };

  const makeAreaD = (key: 'intake' | 'dispatched' | 'delivered') => {
    if (timeSeries.length === 0) return '';
    const linePath = makePathD(key);
    const lastX = paddingX + (timeSeries.length - 1) * stepX;
    const firstX = paddingX;
    const bottomY = graphHeight - paddingY;
    return `${linePath} L ${lastX} ${bottomY} L ${firstX} ${bottomY} Z`;
  };

  // Aggregated totals
  const totalIntake = timeSeries.reduce((acc, curr) => acc + curr.intake, 0);
  const totalWavePicked = timeSeries.reduce((acc, curr) => acc + curr.wavePicked, 0);
  const totalPacked = timeSeries.reduce((acc, curr) => acc + curr.packed, 0);
  const totalDispatched = timeSeries.reduce((acc, curr) => acc + curr.dispatched, 0);
  const totalDelivered = timeSeries.reduce((acc, curr) => acc + curr.delivered, 0);
  const totalReturned = timeSeries.reduce((acc, curr) => acc + curr.returned, 0);

  const activePoint = hoveredIndex !== null ? timeSeries[hoveredIndex] : timeSeries[timeSeries.length - 1];

  return (
    <div className="p-6 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-white/10 shadow-lg space-y-6">
      {/* Header & Graph Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-100 dark:border-white/10">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-orange-500/10 text-orange-600 dark:text-orange-400">
              <TrendingUp className="h-5 w-5" />
            </div>
            <h2 className="text-lg font-bold text-navy-900 dark:text-white">
              Warehouse Order Volume & Pipeline Flow
            </h2>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Throughput dynamics: Intake, wave pick, packing, courier handover, and final doorstep delivery.
          </p>
        </div>

        {/* Series Filter Tabs */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-navy-950 border border-slate-200 dark:border-white/10 self-start sm:self-auto text-xs font-semibold">
          <button
            onClick={() => setActiveSeries('all')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              activeSeries === 'all'
                ? 'bg-white dark:bg-navy-800 text-navy-900 dark:text-white shadow-xs font-bold'
                : 'text-slate-500 dark:text-slate-400 hover:text-navy-900 dark:hover:text-white'
            }`}
          >
            All Curves
          </button>
          <button
            onClick={() => setActiveSeries('intake')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              activeSeries === 'intake'
                ? 'bg-white dark:bg-navy-800 text-orange-600 dark:text-orange-400 shadow-xs font-bold'
                : 'text-slate-500 dark:text-slate-400 hover:text-navy-900 dark:hover:text-white'
            }`}
          >
            Intake
          </button>
          <button
            onClick={() => setActiveSeries('dispatch')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              activeSeries === 'dispatch'
                ? 'bg-white dark:bg-navy-800 text-indigo-600 dark:text-indigo-400 shadow-xs font-bold'
                : 'text-slate-500 dark:text-slate-400 hover:text-navy-900 dark:hover:text-white'
            }`}
          >
            Dispatched
          </button>
          <button
            onClick={() => setActiveSeries('delivered')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              activeSeries === 'delivered'
                ? 'bg-white dark:bg-navy-800 text-emerald-600 dark:text-emerald-400 shadow-xs font-bold'
                : 'text-slate-500 dark:text-slate-400 hover:text-navy-900 dark:hover:text-white'
            }`}
          >
            Delivered
          </button>
        </div>
      </div>

      {/* SVG Interactive Chart */}
      <div className="relative w-full overflow-x-auto">
        <div className="min-w-[500px]">
          <svg
            viewBox={`0 0 ${graphWidth} ${graphHeight}`}
            className="w-full h-56 sm:h-64 overflow-visible"
          >
            <defs>
              <linearGradient id="intakeGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f97316" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#f97316" stopOpacity="0.0" />
              </linearGradient>
              <linearGradient id="dispatchGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#6366f1" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#6366f1" stopOpacity="0.0" />
              </linearGradient>
              <linearGradient id="deliveredGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10b981" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Horizontal Grid lines */}
            {[0, 0.25, 0.5, 0.75, 1].map((pct, i) => {
              const y = graphHeight - paddingY - pct * (graphHeight - paddingY * 2);
              const val = Math.round(pct * maxVal);
              return (
                <g key={i}>
                  <line
                    x1={paddingX}
                    y1={y}
                    x2={graphWidth - paddingX}
                    y2={y}
                    stroke="currentColor"
                    strokeDasharray="4 4"
                    className="text-slate-200 dark:text-navy-800"
                    strokeWidth="1"
                  />
                  <text
                    x={paddingX - 8}
                    y={y + 3}
                    textAnchor="end"
                    className="text-[9px] fill-slate-400 dark:fill-slate-500 font-mono"
                  >
                    {val}
                  </text>
                </g>
              );
            })}

            {/* Shaded Areas */}
            {(activeSeries === 'all' || activeSeries === 'intake') && (
              <path d={makeAreaD('intake')} fill="url(#intakeGrad)" />
            )}
            {(activeSeries === 'all' || activeSeries === 'dispatch') && (
              <path d={makeAreaD('dispatched')} fill="url(#dispatchGrad)" />
            )}
            {(activeSeries === 'all' || activeSeries === 'delivered') && (
              <path d={makeAreaD('delivered')} fill="url(#deliveredGrad)" />
            )}

            {/* Stroke Lines */}
            {(activeSeries === 'all' || activeSeries === 'intake') && (
              <path
                d={makePathD('intake')}
                fill="none"
                stroke="#f97316"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}
            {(activeSeries === 'all' || activeSeries === 'dispatch') && (
              <path
                d={makePathD('dispatched')}
                fill="none"
                stroke="#6366f1"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}
            {(activeSeries === 'all' || activeSeries === 'delivered') && (
              <path
                d={makePathD('delivered')}
                fill="none"
                stroke="#10b981"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}

            {/* Interactive Circles / Hover Columns */}
            {timeSeries.map((point, index) => {
              const { x } = getCoordinates(0, index);
              const isHovered = hoveredIndex === index;

              return (
                <g
                  key={index}
                  onMouseEnter={() => setHoveredIndex(index)}
                  onMouseLeave={() => setHoveredIndex(null)}
                  className="cursor-pointer"
                >
                  {/* Invisible broad hover hit-box */}
                  <rect
                    x={x - stepX / 2}
                    y={0}
                    width={stepX}
                    height={graphHeight}
                    fill="transparent"
                  />

                  {/* Vertical highlight line on hover */}
                  {isHovered && (
                    <line
                      x1={x}
                      y1={paddingY}
                      x2={x}
                      y2={graphHeight - paddingY}
                      stroke="#f97316"
                      strokeWidth="1.5"
                      strokeDasharray="2 2"
                      opacity="0.8"
                    />
                  )}

                  {/* Point Dots */}
                  {(activeSeries === 'all' || activeSeries === 'intake') && (
                    <circle
                      cx={x}
                      cy={getCoordinates(point.intake, index).y}
                      r={isHovered ? 5 : 3}
                      fill="#f97316"
                      stroke="#fff"
                      strokeWidth="1.5"
                    />
                  )}
                  {(activeSeries === 'all' || activeSeries === 'dispatch') && (
                    <circle
                      cx={x}
                      cy={getCoordinates(point.dispatched, index).y}
                      r={isHovered ? 5 : 3}
                      fill="#6366f1"
                      stroke="#fff"
                      strokeWidth="1.5"
                    />
                  )}
                  {(activeSeries === 'all' || activeSeries === 'delivered') && (
                    <circle
                      cx={x}
                      cy={getCoordinates(point.delivered, index).y}
                      r={isHovered ? 5 : 3}
                      fill="#10b981"
                      stroke="#fff"
                      strokeWidth="1.5"
                    />
                  )}

                  {/* X-axis Label */}
                  <text
                    x={x}
                    y={graphHeight - 2}
                    textAnchor="middle"
                    className={`text-[10px] font-semibold ${
                      isHovered
                        ? 'fill-orange-600 dark:fill-orange-400 font-bold'
                        : 'fill-slate-500 dark:fill-slate-400'
                    }`}
                  >
                    {point.label}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      </div>

      {/* Interactive Tooltip Bar below chart */}
      {activePoint && (
        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-navy-900 dark:text-white px-2 py-0.5 rounded bg-white dark:bg-navy-800 border border-slate-200 dark:border-white/10">
              {activePoint.label} ({activePoint.date})
            </span>
            <span className="text-slate-500 dark:text-slate-400 hidden sm:inline">Selected Period</span>
          </div>

          <div className="flex items-center gap-4 flex-wrap font-bold">
            <div className="flex items-center gap-1.5 text-orange-600 dark:text-orange-400">
              <span className="h-2 w-2 rounded-full bg-orange-500" />
              <span>Intake: {activePoint.intake.toLocaleString()}</span>
            </div>
            <div className="flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400">
              <span className="h-2 w-2 rounded-full bg-indigo-500" />
              <span>Dispatched: {activePoint.dispatched.toLocaleString()}</span>
            </div>
            <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              <span>Delivered: {activePoint.delivered.toLocaleString()}</span>
            </div>
            <div className="flex items-center gap-1.5 text-rose-500">
              <span className="h-2 w-2 rounded-full bg-rose-500" />
              <span>RTO: {activePoint.returned}</span>
            </div>
          </div>
        </div>
      )}

      {/* Order Pipeline Funnel Stepper */}
      <div className="space-y-3 pt-2">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          End-to-End Fulfillment Pipeline Flow
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 text-center">
          {/* Step 1 */}
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-navy-950 border border-slate-200/80 dark:border-white/10 space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">1. Total Ingested</span>
            <span className="text-base font-black text-navy-900 dark:text-white tabular-nums">
              {totalIntake.toLocaleString()}
            </span>
            <span className="text-[10px] text-slate-500 block">100% Influx</span>
          </div>

          {/* Step 2 */}
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-navy-950 border border-slate-200/80 dark:border-white/10 space-y-1">
            <span className="text-[10px] uppercase font-bold text-indigo-500 block">2. Wave Picked</span>
            <span className="text-base font-black text-navy-900 dark:text-white tabular-nums">
              {totalWavePicked.toLocaleString()}
            </span>
            <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold block">
              {((totalWavePicked / totalIntake) * 100).toFixed(1)}% Allocated
            </span>
          </div>

          {/* Step 3 */}
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-navy-950 border border-slate-200/80 dark:border-white/10 space-y-1">
            <span className="text-[10px] uppercase font-bold text-purple-500 block">3. Barcode Packed</span>
            <span className="text-base font-black text-navy-900 dark:text-white tabular-nums">
              {totalPacked.toLocaleString()}
            </span>
            <span className="text-[10px] text-purple-600 dark:text-purple-400 font-semibold block">
              {((totalPacked / totalIntake) * 100).toFixed(1)}% Ready
            </span>
          </div>

          {/* Step 4 */}
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-navy-950 border border-slate-200/80 dark:border-white/10 space-y-1">
            <span className="text-[10px] uppercase font-bold text-orange-500 block">4. Courier Handover</span>
            <span className="text-base font-black text-navy-900 dark:text-white tabular-nums">
              {totalDispatched.toLocaleString()}
            </span>
            <span className="text-[10px] text-orange-600 dark:text-orange-400 font-semibold block">
              {((totalDispatched / totalIntake) * 100).toFixed(1)}% Dispatched
            </span>
          </div>

          {/* Step 5 */}
          <div className="p-3 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-500/30 space-y-1">
            <span className="text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400 block">5. Delivered</span>
            <span className="text-base font-black text-emerald-700 dark:text-emerald-300 tabular-nums">
              {totalDelivered.toLocaleString()}
            </span>
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold block">
              {((totalDelivered / totalDispatched) * 100).toFixed(1)}% Success
            </span>
          </div>

          {/* Step 6 */}
          <div className="p-3 rounded-xl bg-rose-50/70 dark:bg-rose-950/30 border border-rose-500/30 space-y-1">
            <span className="text-[10px] uppercase font-bold text-rose-600 dark:text-rose-400 block">6. RTO / Returns</span>
            <span className="text-base font-black text-rose-700 dark:text-rose-300 tabular-nums">
              {totalReturned.toLocaleString()}
            </span>
            <span className="text-[10px] text-rose-600 dark:text-rose-400 font-semibold block">
              {((totalReturned / totalDispatched) * 100).toFixed(1)}% Low RTO
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
