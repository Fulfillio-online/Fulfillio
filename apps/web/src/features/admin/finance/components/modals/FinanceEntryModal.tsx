'use client';

import React, { useEffect, useState } from 'react';
import {
  X,
  ArrowDownCircle,
  ArrowUpCircle,
  Save,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import {
  CompanyFinanceEntryDto,
  FinanceEntryCategory,
  FinanceEntryType,
} from '@fulfillio/contracts';
import {
  useCreateFinanceEntry,
  useUpdateFinanceEntry,
} from '@/lib/hooks/useBilling';

interface FinanceEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  entry?: CompanyFinanceEntryDto | null;
  defaultType?: FinanceEntryType;
  merchantsList: Array<{ id: string; merchantCode: string; businessName: string }>;
  defaultMerchantId?: string;
}

const EXPENSE_CATEGORIES: Array<{ value: FinanceEntryCategory; label: string }> = [
  { value: FinanceEntryCategory.RENT, label: 'Warehouse & Office Rent' },
  { value: FinanceEntryCategory.SALARY, label: 'Staff Payroll & Salaries' },
  { value: FinanceEntryCategory.COURIER_COST, label: 'Courier Bill Settlement' },
  { value: FinanceEntryCategory.PACKAGING_PURCHASE, label: 'Packaging Materials Purchase' },
  { value: FinanceEntryCategory.UTILITY_MISC, label: 'Utilities, Tech & Misc' },
];

const INCOME_CATEGORIES: Array<{ value: FinanceEntryCategory; label: string }> = [
  { value: FinanceEntryCategory.STORAGE_FEE, label: 'Warehouse Storage Fee' },
  { value: FinanceEntryCategory.OTHER_INCOME, label: 'Other 3PL Income' },
];

const PAYMENT_METHODS = [
  { value: 'CASH', label: 'Cash' },
  { value: 'BANK_TRANSFER', label: 'Bank Transfer' },
  { value: 'BKASH', label: 'bKash' },
  { value: 'NAGAD', label: 'Nagad' },
  { value: 'ROCKET', label: 'Rocket' },
];

function toDateInputValue(iso?: string): string {
  const d = iso ? new Date(iso) : new Date();
  if (Number.isNaN(d.getTime())) return new Date().toISOString().slice(0, 10);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

export function FinanceEntryModal({
  isOpen,
  onClose,
  entry,
  defaultType = FinanceEntryType.EXPENSE,
  merchantsList,
  defaultMerchantId,
}: FinanceEntryModalProps) {
  const createMutation = useCreateFinanceEntry();
  const updateMutation = useUpdateFinanceEntry();

  const [type, setType] = useState<FinanceEntryType>(defaultType);
  const [category, setCategory] = useState<FinanceEntryCategory>(
    defaultType === FinanceEntryType.INCOME
      ? FinanceEntryCategory.STORAGE_FEE
      : FinanceEntryCategory.RENT,
  );
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [entryDate, setEntryDate] = useState(toDateInputValue());
  const [merchantId, setMerchantId] = useState('ALL');
  const [paymentMethod, setPaymentMethod] = useState('BANK_TRANSFER');
  const [referenceNo, setReferenceNo] = useState('');
  const [notes, setNotes] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setFormError(null);
    if (entry) {
      setType(entry.type);
      setCategory(entry.category);
      setTitle(entry.title);
      setAmount(String(entry.amount));
      setEntryDate(toDateInputValue(entry.entryDate));
      setMerchantId(entry.merchantId || 'ALL');
      setPaymentMethod(entry.paymentMethod || 'BANK_TRANSFER');
      setReferenceNo(entry.referenceNo || '');
      setNotes(entry.notes || '');
    } else {
      setType(defaultType);
      setCategory(
        defaultType === FinanceEntryType.INCOME
          ? FinanceEntryCategory.STORAGE_FEE
          : FinanceEntryCategory.RENT,
      );
      setTitle('');
      setAmount('');
      setEntryDate(toDateInputValue());
      setMerchantId(defaultMerchantId && defaultMerchantId !== 'ALL' ? defaultMerchantId : 'ALL');
      setPaymentMethod('BANK_TRANSFER');
      setReferenceNo('');
      setNotes('');
    }
  }, [isOpen, entry, defaultType, defaultMerchantId]);

  useEffect(() => {
    if (!isOpen) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const categories = type === FinanceEntryType.EXPENSE ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;
  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  const handleTypeSwitch = (nextType: FinanceEntryType) => {
    setType(nextType);
    setCategory(
      nextType === FinanceEntryType.EXPENSE
        ? FinanceEntryCategory.RENT
        : FinanceEntryCategory.STORAGE_FEE,
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const parsedAmount = Number(amount);
    if (!title.trim() || title.trim().length < 2) {
      setFormError('Please enter a descriptive title (at least 2 characters).');
      return;
    }
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setFormError('Amount must be greater than 0.');
      return;
    }

    try {
      const payload = {
        type,
        category,
        title: title.trim(),
        amount: parsedAmount,
        entryDate: `${entryDate}T12:00:00`,
        merchantId: merchantId !== 'ALL' ? merchantId : undefined,
        paymentMethod,
        referenceNo: referenceNo.trim() || undefined,
        notes: notes.trim() || undefined,
      };

      if (entry) {
        await updateMutation.mutateAsync({
          id: entry.id,
          payload: {
            ...payload,
            merchantId: merchantId !== 'ALL' ? merchantId : null,
            referenceNo: referenceNo.trim() || null,
            notes: notes.trim() || null,
          },
        });
      } else {
        await createMutation.mutateAsync(payload);
      }
      onClose();
    } catch (err: any) {
      setFormError(err?.message || 'Failed to save finance ledger entry.');
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-navy-950/75 backdrop-blur-sm p-3 sm:p-4"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-lg rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-navy-900 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200/80 dark:border-white/10">
          <div>
            <h3 className="text-base sm:text-lg font-extrabold text-navy-900 dark:text-white">
              {entry ? 'Edit Ledger Entry' : 'Log Expense or Manual Income'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Updates Fulfillio 3PL Profit &amp; Loss directly in PostgreSQL.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-navy-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-navy-800 transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4">
          {formError && (
            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs font-semibold text-rose-600 dark:text-rose-400">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{formError}</span>
            </div>
          )}

          {/* Type Toggle */}
          <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-slate-100 dark:bg-navy-950 border border-slate-200 dark:border-white/10">
            <button
              type="button"
              onClick={() => handleTypeSwitch(FinanceEntryType.EXPENSE)}
              className={`flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                type === FinanceEntryType.EXPENSE
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-navy-900 dark:hover:text-white'
              }`}
            >
              <ArrowDownCircle className="w-4 h-4" />
              <span>Operating Expense</span>
            </button>
            <button
              type="button"
              onClick={() => handleTypeSwitch(FinanceEntryType.INCOME)}
              className={`flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                type === FinanceEntryType.INCOME
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-navy-900 dark:hover:text-white'
              }`}
            >
              <ArrowUpCircle className="w-4 h-4" />
              <span>Storage / Extra Income</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as FinanceEntryCategory)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-white/15 bg-white dark:bg-navy-950 text-xs font-semibold text-navy-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500/40"
              >
                {categories.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Amount (৳ BDT)
              </label>
              <input
                type="number"
                step="0.01"
                min="1"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="e.g. 25000"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-white/15 bg-white dark:bg-navy-950 text-xs font-bold tabular-nums text-navy-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500/40"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Description / Title
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={
                type === FinanceEntryType.EXPENSE
                  ? 'e.g. Mirpur Warehouse November Rent / Staff Payroll'
                  : 'e.g. Monthly Storage Fee - Store XYZ'
              }
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-white/15 bg-white dark:bg-navy-950 text-xs font-medium text-navy-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500/40"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Entry Date
              </label>
              <input
                type="date"
                required
                value={entryDate}
                onChange={(e) => setEntryDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-white/15 bg-white dark:bg-navy-950 text-xs font-semibold text-navy-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500/40"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Payment Channel
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-white/15 bg-white dark:bg-navy-950 text-xs font-semibold text-navy-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500/40"
              >
                {PAYMENT_METHODS.map((pm) => (
                  <option key={pm.value} value={pm.value}>
                    {pm.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Merchant Attribution (Optional)
              </label>
              <select
                value={merchantId}
                onChange={(e) => setMerchantId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-white/15 bg-white dark:bg-navy-950 text-xs font-semibold text-navy-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500/40"
              >
                <option value="ALL">Company-wide / General</option>
                {merchantsList.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.merchantCode} — {m.businessName}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Voucher / Ref No. (Optional)
              </label>
              <input
                type="text"
                value={referenceNo}
                onChange={(e) => setReferenceNo(e.target.value)}
                placeholder="e.g. INV-2026-11"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-white/15 bg-white dark:bg-navy-950 text-xs font-mono text-navy-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500/40"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Remarks / Notes (Optional)
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Additional context for audit..."
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-white/15 bg-white dark:bg-navy-950 text-xs text-navy-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500/40 resize-none"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-slate-200/80 dark:border-white/10">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-300 dark:border-white/15 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-navy-800 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-xs font-bold text-white shadow-md shadow-orange-500/20 transition-all cursor-pointer disabled:opacity-60"
            >
              {isSubmitting ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Save className="w-3.5 h-3.5" />
              )}
              <span>{entry ? 'Update Entry' : 'Save Entry'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
