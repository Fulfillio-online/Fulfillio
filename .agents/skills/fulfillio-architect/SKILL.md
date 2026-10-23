---
name: fulfillio-architect
description: >-
  System design, technical architecture, diagramming, and spec planning for Fulfillio 3PL WMS.
  USE THIS SKILL for any wireframing, schema design, state machine design, or architectural decision.
  MANDATORY MODEL: Use high-intelligence reasoning models (Claude 3.5 Sonnet, Gemini Pro, or Argon) for zero-error design.
---

# Fulfillio Architect — System Design & Planning Skill

This skill is dedicated exclusively to **System Design, Architecture, Flowcharts, Wireframes, and Specifications** for the Fulfillio platform.

---

## 🎯 Task, Model & Complementary Skills Pairing Matrix

প্রতিটি কাজের জন্য কোন মডেলের সাথে কোন কোন স্কিল একসাথে ব্যবহার করলে সবচেয়ে নির্ভুল আউটপুট পাওয়া যাবে:

| কোন কাজের জন্য (Task) | কোন মডেল ব্যবহার করবে (Model) | সাথে কোন কোন স্কিল কম্বাইন করবে (Paired Skills) | কেন এই কম্বিনেশন বেস্ট? |
| :--- | :--- | :--- | :--- |
| **১. সিস্টেম আর্কিটেকচার ও মডিউল স্পেক** | **Claude 3.5 Sonnet / Gemini Pro / Argon** | `fulfillio-architect` + `bmad-architecture` + `writing-plans` | আর্কিটেকচারে কোনো লজিক্যাল ভুল বা মিসিং ডিপেনডেন্সি থাকবে না। |
| **২. ওয়্যারফ্রেম ও UI লেআউট প্ল্যানিং** | **Claude 3.5 Sonnet / Gemini Pro / Argon** | `fulfillio-architect` + `frontend-design` | মডার্ন ডার্ক SaaS UX লেআউট ও নিখুঁত ফিল্ড স্পেক পাওয়া যাবে। |
| **৩. ডেটাবেস স্কিমা, RLS ও লক ডিজাইন** | **Claude 3.5 Sonnet / Gemini Pro / Argon** | `fulfillio-architect` + `supabase-postgres-best-practices` | কনকারেন্ট অর্ডারে স্টক নেগেটিভ হওয়া ঠেকাবে এবং মাল্টি-টেন্যান্ট সিকিউরিটি নিশ্চিত করবে। |
| **৪. স্টেট মেশিন ও ডিসপ্যাচ লাইফসাইকেল** | **Claude 3.5 Sonnet / Gemini Pro / Argon** | `fulfillio-architect` + `bmad-prd` | অর্ডারের ৮-ধাপ এবং পেআউট অ্যাপ্রুভাল ফ্লোতে ডেডলক হবে না। |

---

## 🧠 Model Selection Rule (CRITICAL)

> **MANDATORY MODEL DIRECTIVE:**  
> When activating this skill for system architecture, wireframing, state machines, or database schema design:  
> **MUST USE HIGH-REASONING MODELS (e.g. Claude 3.5 Sonnet, Gemini Pro, or Argon).**  
> *Reason:* High-level architectural errors and diagramming flaws are costly to refactor later. Deep-reasoning models guarantee zero architectural mistakes, complete edge-case coverage, and clean data modeling.

---

## 📐 Architecture & Design Protocols

### 1. Spec-Driven Planning
- Never write code before a wireframe or spec is validated.
- Clearly define:
  - **Included Functions:** What the module will do.
  - **Excluded / Out of Scope:** What is postponed for later phases.
  - **Data Models:** Prisma models and migrations.
  - **Permissions:** Admin vs Merchant vs Warehouse Operator.

### 2. UI Wireframing Standards (Reference UI: Dark Modern SaaS)
- All wireframes MUST adopt modern, dark-themed SaaS ergonomics:
  - High-contrast visual hierarchy (Slate-950 base, Emerald/Lime active accents).
  - Clear identity cards (Avatar, Merchant Code `MC-101`, Store Name, Status pill).
  - Organized two-column layouts:
    - **Left Column:** Contact / Personal details + Default Payout Account card.
    - **Right Column:** Account Overview metrics + Connected Channels / Social links.
  - Verification workflows (e.g., Cheque leaf image upload with pending admin approval).

### 3. Fulfillio Core Domain Guardrails
- **Reseller Branded Memos:** Pre-designed memo templates tied to `memo_code`, 4x6 Thermal Sticker standard.
- **2-Part SKU:** `[MerchantCode]-[ProductSKU]`.
- **Simplified WMS:** No complex bin/rack codes for MVP; fast picking list; multi-select checkbox packing.
