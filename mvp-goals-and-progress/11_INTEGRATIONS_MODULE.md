# 11 — Integrations & Public REST API

> **মডিউল পাথ:** `apps/api/src/modules/integrations/`  
> **কোর কাজ:** WooCommerce ও Shopify ওয়েবশপ কানেকশন, ওয়েবহুক হ্যান্ডলিং ও এক্সটার্নাল ডেভেলপার API।

---

## ১. বর্তমান অবস্থা (Current Progress)

- [x] ইন্টিগ্রেশন কন্ট্রোলার ও সার্ভিস তৈরি।
- [x] ইনকামিং ওয়েবহুকের জন্য API Key Guard সিকিউরিটি।
- [x] মার্চেন্ট ভিত্তিক ইউনিক API কী ফিল্ড স্কিমাতে সুরক্ষিত।

---

## ২. কী কী করা বাকি আছে (To-Do List)

- [ ] WooCommerce এর অর্ডার ওয়েবহুক রিসিভ করে ডাটাবেজে স্বয়ংক্রিয় অর্ডার ইনসার্ট করা।
- [ ] মার্চেন্ট পোর্টালে API Key জেনারেট ও রিভোক করার ইন্টারফেস।
- [ ] সোয়াগার (Swagger API Docs) পেজ চালু করা যাতে যেকোনো ডেভেলপার এপিআই দেখতে পারে।

---

## ৩. যে অপশনগুলো অবশ্যই যোগ করতে হবে (Options to ADD)

1. **`POST /api/integrations/woocommerce/orders`** — WooCommerce অর্ডার ওয়েবহুক রিসিভার।
2. **`POST /api/integrations/woocommerce/products`** — নতুন প্রোডাক্ট অটো সিঙ্ক।
3. **API Key Generation Button** — এক ক্লিকে মার্চেন্টকে API Key ও Secret প্রদান।
4. **পাবলিক ডকস (`/api/docs`)** — Swagger OpenAPI ডকুমেন্টেশন।

---

## ৪. যে অপশনগুলো এখন লাগবে না (Options to AVOID)

- ❌ আলাদা ওয়ার্ডপ্রেস প্লাগইন ডিরেক্টরি মার্কেটপ্লেস।
- ❌ কাস্টম ওঅথ২ (OAuth2) সার্ভার (API Key + HMAC দিয়েই শতভাগ কাজ চলবে)।
