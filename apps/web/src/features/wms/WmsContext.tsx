'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { WmsOrder, WmsStationProfile, WmsStage } from './types';
import { INITIAL_WMS_ORDERS, INITIAL_STATION_PROFILE } from './mockData';
import { wmsApi } from './api';

const STORAGE_KEY_ORDERS = 'fulfillio_wms_orders_v1';
const STORAGE_KEY_STATION = 'fulfillio_wms_station_v1';

export type AudioToneType = 'success' | 'error' | 'print';

interface WmsContextType {
  orders: WmsOrder[];
  station: WmsStationProfile;
  audioEnabled: boolean;
  loading: boolean;
  toggleAudio: () => void;
  playAudio: (type: AudioToneType) => void;
  toastMessage: string | null;
  showToast: (msg: string) => void;
  activePrintOrder: WmsOrder | null;
  setActivePrintOrder: (order: WmsOrder | null) => void;

  // Pipeline Actions
  refreshOrders: () => Promise<void>;
  markPicked: (orderId: string) => void;
  markBatchPicked: (orderIds: string[]) => void;
  packAndPrintOrder: (orderId: string, packagingType?: string) => void;
  bookCourier: (orderId: string) => void;
  bookAllByCourier: (courier: string) => void;
  handoverToCourier: (courier: string, riderName: string) => void;

  // Station & Operator
  updateStation: (stationName: string, zone: string) => void;
  switchOperator: (name: string, id: string) => void;

  // Quick stats
  counts: {
    readyToPick: number;
    picked: number;
    packed: number;
    booked: number;
    dispatched: number;
  };
}

const WmsContext = createContext<WmsContextType | undefined>(undefined);

export function WmsProvider({ children }: { children: ReactNode }) {
  const [orders, setOrders] = useState<WmsOrder[]>(INITIAL_WMS_ORDERS);
  const [station, setStation] = useState<WmsStationProfile>(INITIAL_STATION_PROFILE);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [loading, setLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [activePrintOrder, setActivePrintOrder] = useState<WmsOrder | null>(null);

  const saveOrders = (updated: WmsOrder[]) => {
    setOrders(updated);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY_ORDERS, JSON.stringify(updated));
      } catch (e) {
        console.error(e);
      }
    }
  };

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((current) => (current === msg ? null : current));
    }, 4000);
  }, []);

  // Fetch orders from backend API with fallback
  const refreshOrders = useCallback(async () => {
    setLoading(true);
    try {
      const liveOrders = await wmsApi.getOrders();
      if (liveOrders && liveOrders.length > 0) {
        saveOrders(liveOrders);
      }
    } catch (err) {
      console.warn('WMS live order fetch fallback to cache', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const savedStation = localStorage.getItem(STORAGE_KEY_STATION);
        if (savedStation) setStation(JSON.parse(savedStation));
      } catch (e) {
        console.error('Failed to load WMS station cache', e);
      }
    }
    refreshOrders();
  }, [refreshOrders]);

  // Web Audio API tone generator (zero latency, no audio file dependencies)
  const playAudio = useCallback(
    (type: AudioToneType) => {
      if (!audioEnabled || typeof window === 'undefined') return;
      try {
        const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (!AudioCtx) return;
        const ctx = new AudioCtx();

        if (type === 'success') {
          // 880Hz crisp beep
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(880, ctx.currentTime);
          gain.gain.setValueAtTime(0.15, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start();
          osc.stop(ctx.currentTime + 0.15);
        } else if (type === 'error') {
          // 220Hz low buzzer
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(220, ctx.currentTime);
          gain.gain.setValueAtTime(0.2, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start();
          osc.stop(ctx.currentTime + 0.35);
        } else if (type === 'print') {
          // Double chirp fanfare
          const osc1 = ctx.createOscillator();
          const gain1 = ctx.createGain();
          osc1.type = 'triangle';
          osc1.frequency.setValueAtTime(587.33, ctx.currentTime);
          osc1.frequency.setValueAtTime(880, ctx.currentTime + 0.1);
          gain1.gain.setValueAtTime(0.15, ctx.currentTime);
          gain1.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.28);
          osc1.connect(gain1);
          gain1.connect(ctx.destination);
          osc1.start();
          osc1.stop(ctx.currentTime + 0.28);
        }
      } catch (err) {
        console.error('Audio synthesizer error', err);
      }
    },
    [audioEnabled],
  );

  const toggleAudio = () => {
    setAudioEnabled((prev) => !prev);
    showToast(!audioEnabled ? 'Audio feedback enabled' : 'Audio feedback muted');
  };

  // Step 1: Mark Picked (Optimistic local update + Backend API sync)
  const markPicked = (orderId: string) => {
    const updated = orders.map((o) =>
      o.id === orderId ? { ...o, stage: 'PICKED' as WmsStage, selected: true } : o,
    );
    saveOrders(updated);
    playAudio('success');
    showToast(`Order ${orderId} picked from bin and queued for pack desk!`);

    // Sync to PostgreSQL backend
    wmsApi.markPicked(orderId).catch((err) => {
      console.warn('Backend markPicked sync notice', err);
    });
  };

  const markBatchPicked = (orderIds: string[]) => {
    const updated = orders.map((o) =>
      orderIds.includes(o.id) ? { ...o, stage: 'PICKED' as WmsStage, selected: true } : o,
    );
    saveOrders(updated);
    playAudio('success');
    showToast(`${orderIds.length} orders batch-picked from bins!`);

    // Sync each to backend
    orderIds.forEach((id) => {
      wmsApi.markPicked(id).catch(() => {});
    });
  };

  // Step 2: Pack & Print Dynamic Memo (Optimistic local + Backend double-print lock)
  const packAndPrintOrder = (orderId: string, packagingType = 'POLY_LARGE') => {
    const targetOrder = orders.find((o) => o.id === orderId);
    if (!targetOrder) return;

    const timeString = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const updated = orders.map((o) =>
      o.id === orderId
        ? {
            ...o,
            stage: 'PACKED' as WmsStage,
            packagingType,
            packedAt: timeString,
            selected: false,
          }
        : o,
    );

    saveOrders(updated);
    playAudio('print');
    setActivePrintOrder({
      ...targetOrder,
      stage: 'PACKED',
      packagingType,
      packedAt: timeString,
    });
    showToast(`Order ${orderId} packed into ${packagingType} & 4x6 Memo printed!`);

    // Sync to backend batch-print-lock
    wmsApi.packAndPrint(orderId, packagingType).catch((err) => {
      console.warn('Backend packAndPrint sync notice', err);
    });
  };

  // Step 3: Courier API Booking (Optimistic local + Courier API consignment)
  const bookCourier = (orderId: string) => {
    const target = orders.find((o) => o.id === orderId);
    if (!target) return;

    const courierPrefix =
      target.courier === 'Steadfast' ? 'SF' : target.courier === 'Pathao' ? 'PT' : 'RX';
    const randNum = Math.floor(1000 + Math.random() * 9000);
    const tracking = `${courierPrefix}-${target.id.replace('ORD-', '')}-${randNum}`;
    const timeString = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const updated = orders.map((o) =>
      o.id === orderId
        ? {
            ...o,
            stage: 'BOOKED' as WmsStage,
            trackingNumber: tracking,
            bookedAt: timeString,
          }
        : o,
    );

    saveOrders(updated);
    playAudio('success');
    showToast(`Consignment booked with ${target.courier}! Tracking: ${tracking}`);

    // Call real courier booking in backend
    wmsApi.bookCourier(orderId, target.courier).then((res) => {
      if (res && res.trackingCode) {
        setOrders((prev) =>
          prev.map((o) => (o.id === orderId ? { ...o, trackingNumber: res.trackingCode } : o)),
        );
      }
    }).catch(() => {});
  };

  const bookAllByCourier = (courierName: string) => {
    const eligible = orders.filter((o) => o.stage === 'PACKED' && o.courier === courierName);
    if (eligible.length === 0) {
      showToast(`No packed parcels found waiting for ${courierName} booking!`);
      return;
    }

    const timeString = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const courierPrefix =
      courierName === 'Steadfast' ? 'SF' : courierName === 'Pathao' ? 'PT' : 'RX';

    const updated = orders.map((o) => {
      if (o.stage === 'PACKED' && o.courier === courierName) {
        const randNum = Math.floor(1000 + Math.random() * 9000);
        return {
          ...o,
          stage: 'BOOKED' as WmsStage,
          trackingNumber: `${courierPrefix}-${o.id.replace('ORD-', '')}-${randNum}`,
          bookedAt: timeString,
        };
      }
      return o;
    });

    saveOrders(updated);
    playAudio('success');
    showToast(`Batch booked ${eligible.length} parcels to ${courierName} API!`);

    // Trigger backend booking for each
    eligible.forEach((ord) => {
      wmsApi.bookCourier(ord.id, courierName).catch(() => {});
    });
  };

  // Step 4: Courier Handover & Manifest Dispatch
  const handoverToCourier = (courierName: string, riderName: string) => {
    const bookedForCourier = orders.filter((o) => o.stage === 'BOOKED' && o.courier === courierName);
    if (bookedForCourier.length === 0) {
      showToast(`No booked parcels waiting for ${courierName} driver handover!`);
      return;
    }

    const timeString = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const updated = orders.map((o) =>
      o.stage === 'BOOKED' && o.courier === courierName
        ? {
            ...o,
            stage: 'DISPATCHED' as WmsStage,
            dispatchedAt: timeString,
          }
        : o,
    );

    saveOrders(updated);
    playAudio('print');
    showToast(
      `Dispatched ${bookedForCourier.length} parcel(s) to ${courierName} rider (${riderName})! Manifest logged.`,
    );

    // Call backend handover
    const ids = bookedForCourier.map((o) => o.id);
    wmsApi.handoverToCourier(ids).catch(() => {});
  };

  // Station and Operator Management
  const updateStation = (stationName: string, zone: string) => {
    const next = { ...station, stationName, zone };
    setStation(next);
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY_STATION, JSON.stringify(next));
    }
    showToast(`Workstation updated to: ${stationName}`);
  };

  const switchOperator = (operatorName: string, operatorId: string) => {
    const next = { ...station, operatorName, operatorId };
    setStation(next);
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY_STATION, JSON.stringify(next));
    }
    showToast(`Operator switched: ${operatorName} (${operatorId})`);
  };

  const counts = {
    readyToPick: orders.filter((o) => o.stage === 'READY_TO_PICK').length,
    picked: orders.filter((o) => o.stage === 'PICKED').length,
    packed: orders.filter((o) => o.stage === 'PACKED').length,
    booked: orders.filter((o) => o.stage === 'BOOKED').length,
    dispatched: orders.filter((o) => o.stage === 'DISPATCHED').length,
  };

  return (
    <WmsContext.Provider
      value={{
        orders,
        station,
        audioEnabled,
        loading,
        toggleAudio,
        playAudio,
        toastMessage,
        showToast,
        activePrintOrder,
        setActivePrintOrder,
        refreshOrders,
        markPicked,
        markBatchPicked,
        packAndPrintOrder,
        bookCourier,
        bookAllByCourier,
        handoverToCourier,
        updateStation,
        switchOperator,
        counts,
      }}
    >
      {children}
    </WmsContext.Provider>
  );
}

export function useWms() {
  const context = useContext(WmsContext);
  if (!context) {
    throw new Error('useWms must be used within a WmsProvider');
  }
  return context;
}
