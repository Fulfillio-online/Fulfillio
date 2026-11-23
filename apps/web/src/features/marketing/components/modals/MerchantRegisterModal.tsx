"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  X,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  Building2,
  User,
  Mail,
  Phone,
  Globe,
  Tag,
  TrendingUp,
  ArrowRight,
  Store,
  Check,
} from "lucide-react";
import { registerNewMerchantAccount } from "@/lib/warehouseSync";

interface MerchantRegisterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenLogin?: () => void;
}

type FormInputProps = React.InputHTMLAttributes<
  HTMLInputElement | HTMLSelectElement
> & {
  label: string;
  icon: React.ElementType;
  rightEl?: React.ReactNode;
  as?: "input" | "select";
};

function FormInput({
  label,
  icon: Icon,
  rightEl,
  as: TagEl = "input",
  className = "",
  children,
  ...props
}: FormInputProps) {
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
        {label} {props.required && <span className="text-rose-500">*</span>}
      </label>
      <div className="relative">
        <Icon className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <TagEl
          {...(props as any)}
          className={`w-full pl-10 ${rightEl ? "pr-10" : "pr-3.5"} py-2.5 bg-slate-50/80 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 rounded-md text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 focus:bg-white dark:focus:bg-slate-950 transition-all ${className}`}
        >
          {children}
        </TagEl>
        {rightEl}
      </div>
    </div>
  );
}

const PRODUCT_CATEGORIES = [
  { id: "fashion", label: "Fashion & Apparel", icon: "👕" },
  { id: "electronics", label: "Electronics & Gadgets", icon: "📱" },
  { id: "beauty", label: "Beauty & Cosmetics", icon: "💄" },
  { id: "footwear", label: "Footwear & Bags", icon: "👟" },
  { id: "home", label: "Home & Lifestyle", icon: "🏠" },
  { id: "food", label: "Food & Groceries", icon: "🥫" },
  { id: "baby", label: "Kids & Baby Care", icon: "🧸" },
  { id: "fitness", label: "Sports & Fitness", icon: "⚽" },
  { id: "jewelry", label: "Jewelry & Accessories", icon: "💍" },
  { id: "general", label: "General E-Commerce", icon: "📦" },
];

export function MerchantRegisterModal({
  isOpen,
  onClose,
  onOpenLogin,
}: MerchantRegisterModalProps) {
  const [mounted, setMounted] = useState(false);
  const [fullName, setFullName] = useState("");
  const [storeName, setStoreName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([
    "Fashion & Apparel",
  ]);
  const [orderVolume, setOrderVolume] = useState("200 - 500 orders / month");
  const [storeUrl, setStoreUrl] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [createdCode, setCreatedCode] = useState("MC-106");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isOpen) {
      setSubmitted(false);
      setErrorMessage(null);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [isOpen, onClose]);

  const toggleCategory = (catLabel: string) => {
    setSelectedCategories((prev) =>
      prev.includes(catLabel)
        ? prev.filter((c) => c !== catLabel)
        : [...prev, catLabel]
    );
  };

  const selectAllCategories = () => {
    setSelectedCategories(PRODUCT_CATEGORIES.map((c) => c.label));
  };

  const clearCategories = () => {
    setSelectedCategories([]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const [cleanName, cleanStore, cleanPhone, cleanEmail, cleanPassword] = [
      fullName.trim(),
      storeName.trim(),
      phone.trim(),
      email.trim().toLowerCase(),
      password.trim(),
    ];

    if (
      !cleanName ||
      !cleanStore ||
      !cleanPhone ||
      !cleanEmail ||
      !cleanPassword
    ) {
      return setErrorMessage("Please fill in all required fields.");
    }

    if (selectedCategories.length === 0) {
      return setErrorMessage(
        "Please select at least one product category that your store sells."
      );
    }

    if (cleanPassword.length < 6) {
      return setErrorMessage("Password must be at least 6 characters long.");
    }

    if (confirmPassword && cleanPassword !== confirmPassword.trim()) {
      return setErrorMessage("Passwords do not match. Please re-enter.");
    }

    setLoading(true);
    const res = await registerNewMerchantAccount({
      fullName: cleanName,
      storeName: cleanStore,
      phone: cleanPhone,
      email: cleanEmail,
      category: selectedCategories.join(", "),
      orderVolume,
      storeUrl: storeUrl.trim(),
      password: cleanPassword,
    });

    setLoading(false);
    if (!res.ok) {
      return setErrorMessage(res.error || "Failed to complete registration.");
    }

    if (res.merchant?.merchantCode) setCreatedCode(res.merchant.merchantCode);
    setSubmitted(true);
  };

  if (!isOpen || !mounted) return null;

  const eyeBtn = (
    <button
      type="button"
      onClick={() => setShowPassword(!showPassword)}
      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
      aria-label="Toggle password visibility"
    >
      {showPassword ? (
        <EyeOff className="w-4 h-4" />
      ) : (
        <Eye className="w-4 h-4" />
      )}
    </button>
  );

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-sm overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl max-h-[92vh] overflow-y-auto bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200/80 dark:border-slate-800 text-slate-900 dark:text-slate-100 my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer z-10"
          aria-label="Close register modal"
        >
          <X className="w-5 h-5" />
        </button>

        {!submitted ? (
          <div className="p-6 sm:p-8 space-y-6">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-100 dark:bg-orange-500/10 border border-orange-200 dark:border-orange-500/20 text-orange-700 dark:text-orange-400 text-xs font-bold uppercase tracking-wider mb-2.5">
                <Store className="w-3.5 h-3.5" />
                <span>Merchant Partner Registration</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                Create Your Merchant Account
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                Provide your business details to activate warehousing, barcode
                packaging &amp; COD fulfillment.
              </p>
            </div>

            {errorMessage && (
              <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-medium flex items-center gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Business Information Section */}
              <div className="space-y-4">
                <div className="pb-2 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-orange-500" />{" "}
                    Business Information
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormInput
                    label="Business Name"
                    icon={Store}
                    required
                    value={storeName}
                    onChange={(e) => setStoreName(e.target.value)}
                    placeholder="e.g. Apex Threads BD"
                    autoComplete="organization"
                  />

                  <FormInput
                    label="Monthly Order Volume"
                    icon={TrendingUp}
                    as="select"
                    required
                    value={orderVolume}
                    onChange={(e) => setOrderVolume(e.target.value)}
                    className="pr-8 cursor-pointer"
                  >
                    <option value="50 - 200 orders / month">
                      50 - 200 orders / month
                    </option>
                    <option value="200 - 500 orders / month">
                      200 - 500 orders / month
                    </option>
                    <option value="500 - 1,500 orders / month">
                      500 - 1,500 orders / month
                    </option>
                    <option value="1,500+ orders / month">
                      1,500+ orders / month (Enterprise)
                    </option>
                  </FormInput>

                  <div className="sm:col-span-2">
                    <FormInput
                      label="Website or Facebook Page URL"
                      icon={Globe}
                      type="url"
                      value={storeUrl}
                      onChange={(e) => setStoreUrl(e.target.value)}
                      placeholder="https://facebook.com/yourpage"
                    />
                  </div>

                  {/* Product Categories (Multi-Select Pills) */}
                  <div className="sm:col-span-2">
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                        <Tag className="w-3.5 h-3.5 text-orange-500" />
                        <span>
                          Product Categories{" "}
                          <span className="text-slate-400 font-normal">
                            (Select all that apply)
                          </span>{" "}
                          <span className="text-rose-500">*</span>
                        </span>
                      </label>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-orange-100 dark:bg-orange-500/15 text-orange-700 dark:text-orange-400">
                          {selectedCategories.length} selected
                        </span>
                        {selectedCategories.length > 0 && (
                          <button
                            type="button"
                            onClick={clearCategories}
                            className="text-[11px] text-slate-400 hover:text-rose-500 transition-colors cursor-pointer"
                          >
                            Clear
                          </button>
                        )}
                        {selectedCategories.length < PRODUCT_CATEGORIES.length && (
                          <button
                            type="button"
                            onClick={selectAllCategories}
                            className="text-[11px] text-slate-400 hover:text-orange-600 transition-colors cursor-pointer"
                          >
                            Select all
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="p-3 bg-slate-50/80 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 rounded-xl">
                      <div className="flex flex-wrap gap-2">
                        {PRODUCT_CATEGORIES.map((cat) => {
                          const isSelected = selectedCategories.includes(
                            cat.label
                          );
                          return (
                            <button
                              key={cat.id}
                              type="button"
                              onClick={() => toggleCategory(cat.label)}
                              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 ${
                                isSelected
                                  ? "bg-orange-500/15 border-orange-500 text-orange-600 dark:text-orange-400 font-bold shadow-xs ring-1 ring-orange-500/30"
                                  : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700 hover:text-slate-900 dark:hover:text-slate-200"
                              }`}
                            >
                              <span className="text-sm">{cat.icon}</span>
                              <span>{cat.label}</span>
                              {isSelected && (
                                <Check className="w-3.5 h-3.5 text-orange-600 dark:text-orange-400 shrink-0 ml-0.5" />
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Contact Details Section */}
              <div className="space-y-4">
                <div className="pb-2 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-orange-500" /> Contact
                    Details
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormInput
                    label="Full Name"
                    icon={User}
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Sabbir Ahmed"
                    autoComplete="name"
                  />
                  <FormInput
                    label="Phone Number"
                    icon={Phone}
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+880 1700-000000"
                    autoComplete="tel"
                  />
                  <div className="sm:col-span-2">
                    <FormInput
                      label="Email Address"
                      icon={Mail}
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="merchant@example.com"
                      autoComplete="email"
                    />
                  </div>
                </div>
              </div>

              {/* Account Security Section */}
              <div className="space-y-4">
                <div className="pb-2 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-orange-500" /> Account
                    Security &amp; Credentials
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormInput
                    label="Password (min 6 characters)"
                    icon={Lock}
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    autoComplete="new-password"
                    className="font-mono"
                    rightEl={eyeBtn}
                  />
                  <FormInput
                    label="Confirm Password"
                    icon={Lock}
                    type={showPassword ? "text" : "password"}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    autoComplete="new-password"
                    className="font-mono"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-11 rounded-xl font-bold text-xs sm:text-sm bg-orange-600 hover:bg-orange-500 text-white flex items-center justify-center gap-2 shadow-lg shadow-orange-600/25 transition-all cursor-pointer disabled:opacity-50"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>Submit Merchant Application</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </form>

            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-center text-xs text-slate-500 dark:text-slate-400">
              <span>Already registered as a partner? </span>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenLogin?.();
                }}
                className="text-orange-600 dark:text-orange-400 font-bold hover:underline cursor-pointer"
              >
                Sign In to Portal
              </button>
            </div>
          </div>
        ) : (
          <div className="p-8 sm:p-10 text-center space-y-5">
            <div className="mx-auto w-16 h-16 rounded-2xl bg-emerald-500/15 text-emerald-500 border border-emerald-500/30 flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div className="space-y-1.5">
              <div className="inline-block px-3 py-1 rounded-full bg-orange-100 dark:bg-orange-500/10 text-orange-700 dark:text-orange-400 text-xs font-bold font-mono">
                Assigned Code: {createdCode}
              </div>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
                Application Submitted Successfully!
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                Thank you,{" "}
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {fullName}
                </span>
                . Your account for{" "}
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {storeName}
                </span>{" "}
                has been submitted with categories:{" "}
                <span className="font-semibold text-orange-600 dark:text-orange-400">
                  {selectedCategories.join(", ")}
                </span>
                .
              </p>
            </div>
            <div className="pt-3 max-w-sm mx-auto flex flex-col gap-2.5">
              {onOpenLogin && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenLogin();
                  }}
                  className="w-full py-2.5 px-4 rounded-xl font-bold text-xs sm:text-sm bg-orange-600 hover:bg-orange-500 text-white cursor-pointer"
                >
                  Proceed to Merchant Sign In
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                className="w-full py-2 px-4 rounded-xl text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 cursor-pointer"
              >
                Done &amp; Return to Website
              </button>
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
