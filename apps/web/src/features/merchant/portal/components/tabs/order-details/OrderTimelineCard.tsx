'use client';

import React, { useState, useMemo } from 'react';
import {
  Clock,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Package,
  Layers,
  FileCheck,
  Truck,
  CheckCheck,
  XCircle,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import { MerchantOrderItem } from '../../../types';

export interface TimelineEvent {
  title: string;
  description: string;
  timestamp: string;
  isCompleted: boolean;
}

export interface FulfillmentPipelineStep {
  id: string;
  stageNumber: number;
  title: string;
  shortTitle: string;
  description: string;
  status: 'COMPLETED' | 'CURRENT' | 'PENDING' | 'CANCELLED';
  timestamp: string;
  meta?: string;
  iconType: 'order' | 'pick' | 'pack' | 'courier' | 'delivered' | 'cancelled';
}

interface OrderTimelineCardProps {
  order?: MerchantOrderItem;
  timelineEvents?: TimelineEvent[];
}

export function computeFulfillmentPipeline(
  order?: MerchantOrderItem,
  fallbackEvents?: TimelineEvent[]
): FulfillmentPipelineStep[] {
  if (!order) {
    if (fallbackEvents && fallbackEvents.length > 0) {
      return fallbackEvents.map((evt, idx) => ({
        id: `step-${idx}`,
        stageNumber: idx + 1,
        title: evt.title,
        shortTitle: evt.title.split(' ')[0] || `Step ${idx + 1}`,
        description: evt.description,
        status: evt.isCompleted ? 'COMPLETED' : 'PENDING',
        timestamp: evt.timestamp,
        iconType: idx === 0 ? 'order' : idx === 1 ? 'pick' : idx === 2 ? 'pack' : idx === 3 ? 'courier' : 'delivered',
      }));
    }
    return [];
  }

  const rawStatus = (order.status || 'PENDING').toUpperCase();
  const isCancelled = rawStatus === 'CANCELLED';
  const isDelivered = rawStatus === 'DELIVERED' || rawStatus === 'HANDOVER';
  const isDispatched = rawStatus === 'DISPATCHED' || rawStatus === 'COURIER_BOOKED';
  const isPacked = rawStatus === 'PACKED';
  const isPicking =
    rawStatus === 'PICKING' ||
    rawStatus === 'PICKED' ||
    rawStatus === 'PROCESSING' ||
    rawStatus === 'ALLOCATED';

  // Active progression stage: 1 = Order Placed, 2 = Picking, 3 = Packed, 4 = Dispatched, 5 = Delivered
  let activeStage = 1;
  if (isDelivered) activeStage = 5;
  else if (isDispatched) activeStage = 4;
  else if (isPacked) activeStage = 3;
  else if (isPicking) activeStage = 2;
  else activeStage = 1;

  // Extract real timestamps from timeline history if present
  const orderCreatedEvent = order.timeline?.find((t) =>
    /created|placed|confirmed/i.test(t.title)
  );
  const orderCancelEvent = order.timeline?.find((t) =>
    /cancel/i.test(t.title)
  );
  const pickingEvent = order.timeline?.find((t) =>
    /pick/i.test(t.title)
  );
  const packingEvent = order.timeline?.find((t) =>
    /pack/i.test(t.title)
  );
  const dispatchedEvent = order.timeline?.find((t) =>
    /dispatch|shipped|courier|handover to courier/i.test(t.title)
  );
  const deliveredEvent = order.timeline?.find((t) =>
    /delivered|customer handover|completed/i.test(t.title)
  );

  const baseDate = order.date || 'Today';
  const createdTimestamp = orderCreatedEvent?.timestamp || `${baseDate}, 10:00 AM`;
  const cancelTimestamp = orderCancelEvent?.timestamp || `${baseDate}, Cancelled`;
  const cancelDesc =
    orderCancelEvent?.description ||
    'Order was cancelled by merchant/admin. Reserved inventory was restored to warehouse.';

  if (isCancelled) {
    return [
      {
        id: 'stage-1',
        stageNumber: 1,
        title: 'Order Placed & Stock Reserved',
        shortTitle: 'Placed',
        description: `Order was placed by ${order.customer || 'Customer'} with ${order.qty || 1} item(s).`,
        status: 'COMPLETED',
        timestamp: createdTimestamp,
        meta: `Memo: ${order.memoCode || 'MEMO-DEFAULT'}`,
        iconType: 'order',
      },
      {
        id: 'stage-2',
        stageNumber: 2,
        title: 'Order Cancelled & Restocked',
        shortTitle: 'Cancelled',
        description: cancelDesc,
        status: 'CANCELLED',
        timestamp: cancelTimestamp,
        meta: 'Stock Restored to Warehouse',
        iconType: 'cancelled',
      },
      {
        id: 'stage-3',
        stageNumber: 3,
        title: 'Station Packing & Barcode Scan',
        shortTitle: 'Packing',
        description: 'Packing stage terminated due to order cancellation.',
        status: 'CANCELLED',
        timestamp: 'Voided',
        iconType: 'pack',
      },
      {
        id: 'stage-4',
        stageNumber: 4,
        title: 'Handed Over to Courier',
        shortTitle: 'Courier',
        description: 'Courier dispatch voided.',
        status: 'CANCELLED',
        timestamp: 'Voided',
        iconType: 'courier',
      },
      {
        id: 'stage-5',
        stageNumber: 5,
        title: 'Customer Delivery Handover',
        shortTitle: 'Delivered',
        description: 'Delivery terminated.',
        status: 'CANCELLED',
        timestamp: 'Voided',
        iconType: 'delivered',
      },
    ];
  }

  // Active Flow: 5 Steps
  const step1Status: 'COMPLETED' = 'COMPLETED';
  const step2Status: 'COMPLETED' | 'CURRENT' | 'PENDING' =
    activeStage > 2 ? 'COMPLETED' : activeStage === 2 ? 'CURRENT' : activeStage === 1 ? 'CURRENT' : 'PENDING';
  const step3Status: 'COMPLETED' | 'CURRENT' | 'PENDING' =
    activeStage > 3 ? 'COMPLETED' : activeStage === 3 ? 'CURRENT' : 'PENDING';
  const step4Status: 'COMPLETED' | 'CURRENT' | 'PENDING' =
    activeStage > 4 ? 'COMPLETED' : activeStage === 4 ? 'CURRENT' : 'PENDING';
  const step5Status: 'COMPLETED' | 'CURRENT' | 'PENDING' =
    activeStage === 5 ? 'COMPLETED' : 'PENDING';

  return [
    {
      id: 'stage-1',
      stageNumber: 1,
      title: 'Order Placed & Stock Reserved',
      shortTitle: 'Placed',
      description: `Order confirmed for ${order.customer}. ${order.qty || 1} item(s) reserved from warehouse inventory.`,
      status: step1Status,
      timestamp: createdTimestamp,
      meta: `Memo Code: ${order.memoCode || 'MEMO-DEFAULT'}`,
      iconType: 'order',
    },
    {
      id: 'stage-2',
      stageNumber: 2,
      title: 'Warehouse Picking',
      shortTitle: 'Picking',
      description:
        activeStage >= 2
          ? 'Items picked and verified from warehouse rack & bin locations.'
          : 'Awaiting warehouse picker allocation for item bin retrieval.',
      status: step2Status,
      timestamp:
        activeStage > 2
          ? pickingEvent?.timestamp || `${baseDate}, 01:15 PM`
          : activeStage === 2
          ? 'In Progress (At Dispatch Bay)'
          : 'Pending allocation',
      meta: activeStage >= 2 ? 'Warehouse Bin Verified' : 'Awaiting wave batch',
      iconType: 'pick',
    },
    {
      id: 'stage-3',
      stageNumber: 3,
      title: 'Station Packing & Memo Printed',
      shortTitle: 'Packing',
      description:
        activeStage >= 3
          ? `Verified at packing station with barcode scan. Custom 4x6" branded memo [${order.memoCode}] printed and sealed in poly mailer.`
          : 'Scheduled for packing station inspection, barcode verification, and thermal memo slip print.',
      status: step3Status,
      timestamp:
        activeStage > 3
          ? packingEvent?.timestamp || `${baseDate}, 03:45 PM`
          : activeStage === 3
          ? 'In Progress (Packing Station)'
          : 'Pending packaging',
      meta: activeStage >= 3 ? `Printed: ${order.memoCode}` : 'Awaiting packing',
      iconType: 'pack',
    },
    {
      id: 'stage-4',
      stageNumber: 4,
      title: `Handed Over to Courier (${order.courier || 'Steadfast'})`,
      shortTitle: 'Courier',
      description:
        activeStage >= 4
          ? `Parcel handed over to ${order.courier || 'Steadfast'} collection agent. Transit tracking is active towards ${order.city || 'destination'}.`
          : `Ready at warehouse outbound dock for ${order.courier || 'Steadfast'} courier van pickup.`,
      status: step4Status,
      timestamp:
        activeStage >= 4
          ? dispatchedEvent?.timestamp || `${baseDate}, 06:30 PM`
          : 'Pending courier pickup',
      meta: order.trackingId
        ? `Tracking: #${order.trackingId}`
        : order.courier
        ? `Partner: ${order.courier}`
        : undefined,
      iconType: 'courier',
    },
    {
      id: 'stage-5',
      stageNumber: 5,
      title: 'Delivered / Handover Complete',
      shortTitle: 'Delivered',
      description:
        activeStage >= 5
          ? `Package successfully delivered to customer. COD amount of ৳${(order.codAmount ?? order.amount ?? 0).toLocaleString()} collected.`
          : `Final delivery milestone upon customer handover and courier POD (Proof of Delivery) sync.`,
      status: step5Status,
      timestamp:
        activeStage >= 5
          ? deliveredEvent?.timestamp || `${baseDate}, 08:20 PM`
          : 'Pending delivery handover',
      meta:
        activeStage >= 5
          ? `COD ৳${(order.codAmount ?? order.amount ?? 0).toLocaleString()} Reconciled`
          : `Target COD: ৳${(order.codAmount ?? order.amount ?? 0).toLocaleString()}`,
      iconType: 'delivered',
    },
  ];
}

export function OrderTimelineCard({ order, timelineEvents }: OrderTimelineCardProps) {
  const [isMobileExpanded, setIsMobileExpanded] = useState(false);

  const pipelineSteps = useMemo(() => {
    return computeFulfillmentPipeline(order, timelineEvents);
  }, [order, timelineEvents]);

  // Find latest active or completed milestone
  const activeStep = useMemo(() => {
    const active = pipelineSteps.find((s) => s.status === 'CURRENT');
    if (active) return active;
    const lastCompleted = [...pipelineSteps].reverse().find((s) => s.status === 'COMPLETED');
    if (lastCompleted) return lastCompleted;
    return pipelineSteps[0];
  }, [pipelineSteps]);

  const isCancelled = order?.status === 'CANCELLED';

  // Completion percentage
  const completionPercentage = useMemo(() => {
    if (isCancelled) return 30;
    const completedCount = pipelineSteps.filter((s) => s.status === 'COMPLETED').length;
    const currentCount = pipelineSteps.filter((s) => s.status === 'CURRENT').length;
    return Math.min(100, Math.round(((completedCount + currentCount * 0.5) / pipelineSteps.length) * 100));
  }, [pipelineSteps, isCancelled]);

  const getStepIcon = (step: FulfillmentPipelineStep) => {
    if (step.status === 'CANCELLED') {
      return <XCircle className="h-4 w-4" />;
    }
    if (step.status === 'COMPLETED') {
      return <CheckCircle2 className="h-4 w-4" />;
    }
    if (step.status === 'CURRENT') {
      switch (step.iconType) {
        case 'order':
          return <Package className="h-4 w-4" />;
        case 'pick':
          return <Layers className="h-4 w-4" />;
        case 'pack':
          return <FileCheck className="h-4 w-4" />;
        case 'courier':
          return <Truck className="h-4 w-4" />;
        case 'delivered':
          return <CheckCheck className="h-4 w-4" />;
        default:
          return <Clock className="h-4 w-4" />;
      }
    }
    return <Clock className="h-3.5 w-3.5" />;
  };

  return (
    <div className="rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-navy-900 p-5 shadow-sm space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 dark:border-white/10 gap-3">
        <div className="flex items-center gap-3">
          <div
            className={`h-9 w-9 rounded-xl flex items-center justify-center ${
              isCancelled
                ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20'
                : 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
            }`}
          >
            {isCancelled ? <AlertCircle className="h-5 w-5" /> : <Sparkles className="h-5 w-5" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-navy-900 dark:text-white">
                Fulfillment Timeline
              </h3>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                  isCancelled
                    ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/30'
                    : completionPercentage === 100
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                    : 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/30'
                }`}
              >
                {isCancelled
                  ? 'Cancelled'
                  : completionPercentage === 100
                  ? 'Delivered'
                  : `Stage ${activeStep?.stageNumber || 1} of 5`}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Live step-by-step warehouse intake, packing, and courier milestones
            </p>
          </div>
        </div>

        {/* Mobile toggle button */}
        <button
          type="button"
          onClick={() => setIsMobileExpanded(!isMobileExpanded)}
          className="lg:hidden inline-flex items-center justify-between gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-navy-950 hover:bg-slate-100 dark:hover:bg-navy-800 text-slate-700 dark:text-slate-200 text-xs font-semibold border border-slate-200 dark:border-white/10 transition-colors cursor-pointer"
        >
          <span>{isMobileExpanded ? 'Collapse Steps' : 'View Full Timeline'}</span>
          {isMobileExpanded ? (
            <ChevronUp className="h-3.5 w-3.5" />
          ) : (
            <ChevronDown className="h-3.5 w-3.5" />
          )}
        </button>
      </div>

      {/* Horizontal Visual Pipeline Stepper (Visible on all screens) */}
      <div className="p-4 rounded-xl bg-slate-50/80 dark:bg-navy-950/60 border border-slate-200/70 dark:border-white/5 space-y-3">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
            <span
              className={`h-2 w-2 rounded-full ${
                isCancelled ? 'bg-rose-500' : 'bg-emerald-500 animate-pulse'
              }`}
            />
            Current Status: <strong className="text-navy-900 dark:text-white font-bold">{activeStep?.title || 'Processing'}</strong>
          </span>
          <span className="font-mono text-[11px] font-bold text-slate-500 dark:text-slate-400">
            {isCancelled ? 'Order Terminated' : `${completionPercentage}% Completed`}
          </span>
        </div>

        {/* Mini progress track */}
        <div className="relative w-full h-2 bg-slate-200 dark:bg-navy-800 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-500 rounded-full ${
              isCancelled
                ? 'bg-rose-500'
                : 'bg-gradient-to-r from-emerald-500 via-orange-500 to-emerald-500'
            }`}
            style={{ width: `${completionPercentage}%` }}
          />
        </div>

        {/* 5 Step Icons Indicator */}
        <div className="grid grid-cols-5 gap-1 pt-1">
          {pipelineSteps.map((step) => {
            const isDone = step.status === 'COMPLETED';
            const isCur = step.status === 'CURRENT';
            const isCanc = step.status === 'CANCELLED';

            return (
              <div
                key={step.id}
                className="flex flex-col items-center text-center gap-1"
                title={`${step.title} (${step.status})`}
              >
                <div
                  className={`h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-all ${
                    isCanc
                      ? 'bg-rose-500/10 text-rose-500 border border-rose-500/30'
                      : isDone
                      ? 'bg-emerald-500 text-white shadow-xs'
                      : isCur
                      ? 'bg-orange-500 text-white ring-2 ring-orange-500/30 scale-105'
                      : 'bg-slate-200 dark:bg-navy-800 text-slate-400'
                  }`}
                >
                  {isDone ? (
                    <CheckCircle2 className="h-3.5 w-3.5" />
                  ) : isCanc ? (
                    <XCircle className="h-3.5 w-3.5" />
                  ) : (
                    <span>{step.stageNumber}</span>
                  )}
                </div>
                <span
                  className={`text-[10px] truncate max-w-full font-medium ${
                    isCur
                      ? 'text-orange-600 dark:text-orange-400 font-bold'
                      : isDone
                      ? 'text-emerald-700 dark:text-emerald-400'
                      : isCanc
                      ? 'text-rose-500'
                      : 'text-slate-400'
                  }`}
                >
                  {step.shortTitle}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Step by Step Vertical Timeline Cards */}
      <div
        className={`${
          isMobileExpanded ? 'block' : 'hidden lg:block'
        } relative pl-7 sm:pl-8 space-y-4 pt-1 before:absolute before:left-3 sm:before:left-3.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200 dark:before:bg-white/10`}
      >
        {pipelineSteps.map((step, idx) => {
          const isDone = step.status === 'COMPLETED';
          const isCur = step.status === 'CURRENT';
          const isCanc = step.status === 'CANCELLED';

          return (
            <div key={step.id || idx} className="relative group">
              {/* Milestone Icon Node */}
              <span
                className={`absolute -left-7 sm:-left-8 top-1.5 h-6 w-6 sm:h-7 sm:w-7 rounded-full flex items-center justify-center ring-4 ring-white dark:ring-navy-900 transition-all ${
                  isCanc
                    ? 'bg-rose-500 text-white shadow-xs'
                    : isDone
                    ? 'bg-emerald-500 text-white shadow-xs'
                    : isCur
                    ? 'bg-orange-600 text-white shadow-md shadow-orange-500/30 animate-pulse'
                    : 'bg-slate-100 dark:bg-navy-800 text-slate-400 border border-slate-200 dark:border-white/10'
                }`}
              >
                {getStepIcon(step)}
              </span>

              {/* Step Card Body */}
              <div
                className={`p-3.5 sm:p-4 rounded-xl border transition-all ${
                  isCanc
                    ? 'bg-rose-50/60 dark:bg-rose-950/20 border-rose-200 dark:border-rose-500/20'
                    : isCur
                    ? 'bg-orange-50/60 dark:bg-orange-950/20 border-orange-300 dark:border-orange-500/30 shadow-xs ring-1 ring-orange-500/10'
                    : isDone
                    ? 'bg-slate-50/70 dark:bg-navy-950/40 border-slate-200/80 dark:border-white/5'
                    : 'bg-white dark:bg-navy-900/40 border-slate-100 dark:border-white/5 opacity-80'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-200/70 dark:bg-navy-800 text-slate-600 dark:text-slate-300">
                      Step {step.stageNumber}
                    </span>
                    <h4
                      className={`text-xs font-bold ${
                        isCanc
                          ? 'text-rose-700 dark:text-rose-400'
                          : isCur
                          ? 'text-orange-700 dark:text-orange-400'
                          : isDone
                          ? 'text-navy-900 dark:text-white'
                          : 'text-slate-500 dark:text-slate-400'
                      }`}
                    >
                      {step.title}
                    </h4>

                    {/* Status Pill */}
                    {isCur && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/30">
                        <span className="h-1.5 w-1.5 rounded-full bg-orange-500 animate-ping" />
                        In Progress
                      </span>
                    )}
                    {isDone && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                        Completed
                      </span>
                    )}
                    {isCanc && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                        Cancelled
                      </span>
                    )}
                  </div>

                  <span className="text-[11px] font-mono text-slate-400 dark:text-slate-500">
                    {step.timestamp}
                  </span>
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-300 mt-1.5 leading-relaxed">
                  {step.description}
                </p>

                {step.meta && (
                  <div className="mt-2 pt-2 border-t border-slate-200/50 dark:border-white/5 flex items-center gap-2 text-[11px] font-mono">
                    <span className="text-slate-400">Details:</span>
                    <span
                      className={`font-semibold ${
                        isCanc
                          ? 'text-rose-600 dark:text-rose-400'
                          : isCur
                          ? 'text-orange-600 dark:text-orange-400'
                          : 'text-emerald-600 dark:text-emerald-400'
                      }`}
                    >
                      {step.meta}
                    </span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
