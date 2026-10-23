# Fulfillio — MVP Overview & Implementation Roadmap

> **লোকেশন:** `mvp-goals-and-progress/`  
> এই ফোল্ডারের প্রতিটি ফাইলে প্রতিটি মডিউলের বাস্তবসম্মত MVP স্কোপ সাজানো আছে।

---

## 🎯 MVP এর মূল ৫টি স্তম্ভ (Core Pillars — Updated)

1. **মার্চেন্ট ও রিসেলার ব্র্যান্ডিং:**
   - মার্চেন্ট প্রোফাইলে একটি ইউনিক **Merchant Code** থাকবে (যেমন `MC-101`), যা প্রতিটি প্রোডাক্ট SKU-তে যুক্ত হবে।
   - একজন মার্চেন্টের একাধিক **রিসেলার (Reseller)** থাকতে পারে।
   - মার্চেন্ট প্রতিটি রিসেলারের জন্য আলাদা নাম, লোগো ও ঠিকানা দিয়ে আগে থেকেই কাস্টম মেমো ডিজাইন করে রাখবে (প্রতিটির ইউনিক `memo_code` থাকবে)।
   - অর্ডার প্লেসের সময় মার্চেন্ট শুধু রিসেলারের `memo_code` সিলেক্ট করে দেবে, যাতে কাস্টমারের কাছে পার্সেল যাওয়ার সময় ওই রিসেলারের ব্র্যান্ডেড ইনভয়েস প্রিন্ট হয়।

2. **প্রোডাক্ট ও রিয়েল-টাইম স্টক:**
   - প্রোডাক্টে নাম, কালার, সাইজ, ভ্যারিয়েন্ট থাকবে।
   - SKU দুটি অংশে গঠিত: `[Merchant Code] - [Product SKU]`।
   - স্টকে চলমান সাপ্লাই/অ্যাভেইলেবিলিটি থাকবে।

3. **অর্ডার প্লেসমেন্ট ও পিক লিস্ট (Pick List):**
   - অর্ডার আসার পর প্রোডাক্ট স্টকে থাকলে তা সরাসরি ওয়্যারহাউজের **Pick List**-এ চলে যাবে।
   - ওয়্যারহাউজ কর্মীরা পিক লিস্ট দেখে পণ্য সংগ্রহ করবে।

4. **প্যাকিং ও ৪x৬ থার্মাল মেমো প্রিন্ট (Most Important):**
   - কোনো জটিল ক্যামেরা বা সাউন্ড স্ক্যানিং লাগবে না।
   - প্যাকার যে যে পার্সেল প্যাক শেষ হয়েছে সেগুলো চেকবক্সে সিলেক্ট করবে এবং **এক ক্লিকে ৪x৬ থার্মাল স্টিকারে রিসেলারের ব্র্যান্ডেড মেমো প্রিন্ট** করবে।

5. **কুরিয়ারে হ্যান্ডওভার ও সিওডি বিলিং:**
   - কুরিয়ারে বুকিং এবং কুরিয়ার থেকে প্রাপ্ত সিওডি টাকা ও ওয়্যারহাউজের ফি হিসাব।

---

## 🧭 মডিউল ফাইল ইনডেক্স (Index)

| ফাইল | মডিউলের নাম | কোর ফোকাস |
| :--- | :--- | :--- |
| [`01_AUTH_MODULE.md`](./01_AUTH_MODULE.md) | Auth & Security | লগইন, সাইনআপ ও পারমিশন |
| [`02_MERCHANTS_MODULE.md`](./02_MERCHANTS_MODULE.md) | Merchants Profile & Control | মার্চেন্ট কোড, প্রোফাইল, ব্যাংক তথ্য ও অ্যাডমিন কন্ট্রোল |
| [`03_WAREHOUSES_MODULE.md`](./03_WAREHOUSES_MODULE.md) | Warehouses *(Simplified)* | জটিল র্যাক/শেলফ বাদে বেসিক ওয়্যারহাউজ |
| [`04_INVENTORY_MODULE.md`](./04_INVENTORY_MODULE.md) | Products & Inventory | মার্চেন্ট কোড যুক্ত SKU, ভ্যারিয়েন্ট ও ম্যানুয়াল স্টক |
| [`05_ORDERS_MODULE.md`](./05_ORDERS_MODULE.md) | Orders Management | কালার, সাইজ, রিসেলার মেমো কোড সিলেকশন |
| [`06_PICKING_MODULE.md`](./06_PICKING_MODULE.md) | Picking List *(New)* | স্টক থাকা অর্ডারের পিক লিস্ট |
| [`07_PACKING_MODULE.md`](./07_PACKING_MODULE.md) | Packing & Multi-Select Print | বাল্ক মেমো প্রিন্ট (নো ক্যামেরা/স্ক্যানার) |
| [`08_MEMO_ENGINE_MODULE.md`](./08_MEMO_ENGINE_MODULE.md) | Reseller Memo Engine | **৪x৬ থার্মাল স্টিকার প্রিন্ট (Most Important)** |
| [`09_SHIPPING_COURIERS_MODULE.md`](./09_SHIPPING_COURIERS_MODULE.md) | Shipping & Couriers | কুরিয়ার বুকিং |
| [`10_RETURNS_MODULE.md`](./10_RETURNS_MODULE.md) | Returns & Restock | রিটার্ন রিসিভ |
| [`11_INTEGRATIONS_MODULE.md`](./11_INTEGRATIONS_MODULE.md) | Integrations & API | WooCommerce ও REST API |
| [`12_BILLING_MODULE.md`](./12_BILLING_MODULE.md) | Billing & COD Settlement | সিওডি ও ওয়্যারহাউজ চার্জ |
| [`13_NOTIFICATIONS_QUEUE_MODULE.md`](./13_NOTIFICATIONS_QUEUE_MODULE.md) | Background Jobs | ব্যাকগ্রাউন্ড প্রসেসিং |
| [`14_FRONTEND_DESIGN_SYSTEM.md`](./14_FRONTEND_DESIGN_SYSTEM.md) | UI & Components | রি-ইউজেবল কম্পোনেন্ট |
