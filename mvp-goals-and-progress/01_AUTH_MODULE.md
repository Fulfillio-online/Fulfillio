# 01 — Auth & Identity Module

> **মডিউল পাথ:** `apps/api/src/modules/auth/`  
> **কোর কাজ:** ইউজার রেজিস্ট্রেশন, লগইন, পাসওয়ার্ড সিকিউরিটি, JWT টোকেন ও আরব্যাক (RBAC)।

---

## ১. বর্তমান অবস্থা (Current Progress)

- [x] JWT Auth Guard (`guards/jwt-auth.guard.ts`) তৈরি।
- [x] API Key Guard (`guards/api-key.guard.ts`) তৈরি।
- [x] গ্লোবাল `@Global()` ডেকোরেটর দিয়ে কনফিগারেশন করা যাতে অন্য মডিউলে ডুপ্লিকেট ইমপোর্ট না লাগে।
- [x] ইউজার রোল ডিফাইন করা (`SUPER_ADMIN`, `MERCHANT`, `WAREHOUSE_OPERATOR`, `COURIER_AGENT`)।
- [x] কন্ট্রোলার ও সার্ভিস স্ট্রাকচার রেডি।

---

## ২. কী কী করা বাকি আছে (To-Do List)

- [ ] `bcrypt.hash()` দিয়ে পাসওয়ার্ড হ্যাশ করে ডাটাবেজে ইউজার সেভ করা।
- [ ] `bcrypt.compare()` দিয়ে পাসওয়ার্ড যাচাই ও JWT সাইন করে টোকেন রিটার্ন করা।
- [ ] রোল ভ্যালিডেশন ডেকোরেটর (`@Roles(UserRole.SUPER_ADMIN)` ও `RolesGuard`) যুক্ত করা।
- [ ] লগইন ও রেজিস্ট্রেশন সফল হলে ব্রাউজারে টোকেন সেট করার ক্লায়েন্ট হ্যান্ডলার।

---

## ৩. যে অপশনগুলো অবশ্যই যোগ করতে হবে (Options to ADD)

1. **`POST /api/auth/register`** — নাম, ইমেইল, পাসওয়ার্ড দিয়ে মার্চেন্ট অ্যাকাউন্ট তৈরি।
2. **`POST /api/auth/login`** — ইমেইল ও পাসওয়ার্ড চেক করে JWT টোকেন রিটার্ন।
3. **`GET /api/auth/me`** — বর্তমান লগইন থাকা ইউজারের প্রোফাইল ও পারমিশন রিটার্ন।

---

## ৪. যে অপশনগুলো এখন লাগবে না (Options to AVOID)

- ❌ SMS / Email OTP ভেরিফিকেশন (MVP-র জন্য জটিলতা ও অতিরিক্ত খরচ)।
- ❌ Google / Facebook Social Login (SaaS B2B প্ল্যাটফর্মে প্রয়োজন নেই)।
- ❌ 2FA Authenticator App Integration (পরবর্তী ফেজে বিবেচনা করা হবে)।
