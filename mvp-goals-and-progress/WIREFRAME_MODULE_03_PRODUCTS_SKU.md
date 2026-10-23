# Wireframe & Spec: Module 03 — Products & 2-Part SKU Management

> **ফাইলের অবস্থান:** `mvp-goals-and-progress/WIREFRAME_MODULE_03_PRODUCTS_SKU.md`  
> **ডিজাইন প্যাটার্ন:** Fulfillio ডার্ক থিম (Slate-950, Emerald/Indigo এক্সেন্ট)  
> **মডেল ও স্কিল পেয়ারিং:**  
> • আর্কিটেকচার ও স্পেক: `fulfillio-architect`  
> • কোডিং ও ইমপ্লিমেন্টেশন: `fulfillio-builder` (Gemini Flash)  

---

## 🧭 ১. ২-পার্ট SKU ফরম্যাট স্ট্যান্ডার্ড

```
+---------------------------------------------------------------------------------+
|                                2-PART SKU FORMAT                                |
|                                                                                 |
|   [ MERCHANT CODE ]  -  [ BASE SKU ]  -  [ COLOR ]  -  [ SIZE ]                 |
|      (MC-101)            (TSHIRT)        (BLK)         (XL)                     |
|                                                                                 |
|   => চুড়ান্ত SKU: MC-101-TSHIRT-BLK-XL                                          |
|   => অটো বারকোড: 8901010010015 (13-digit EAN-13 standard format)              |
+---------------------------------------------------------------------------------+
```

---

## 🖥️ ২. প্রোডাক্ট ম্যানেজমেন্ট স্ক্রিন লেআউট (Merchant Portal: `/merchant` -> Products)

```
+---------------------------------------------------------------------------------------------------------------+
|  (📦) Products & Warehouse Inventory                                             [ + Add Single Product ]     |
|      Manage your catalog, 2-part SKUs, barcode stickers, and physical warehouse stock.                        |
|                                                                                                               |
|  [ 🔍 Search product name, SKU or barcode...           ]   [ All Categories ▾ ]   [ Filter by Stock ▾ ]       |
|                                                                                                               |
|  +---------------------------------------------------------------------------------------------------------+  |
|  | Product Name & Variant | 2-Part SKU Code     | Barcode       | Bin Location | Stock    | Price   | Action |  |
|  +------------------------+---------------------+---------------+--------------+----------+---------+--------+  |
|  | Premium Heavy Hoodie   | MC-101-HOODIE-BLK-XL| 8901010010015 | A-01-02-03   | [ - 45 +]| ৳ 3,450 | [🖨️][✏️]|  |
|  | • Black / XL           |                     |               |              |          |         |        |  |
|  +------------------------+---------------------+---------------+--------------+----------+---------+--------+  |
|  | Baseball Cap           | MC-101-CAP-NVY-OS   | 8901010020022 | B-04-01-01   | [ - 120+]| ৳ 1,200 | [🖨️][✏️]|  |
|  | • Navy Blue / One Size |                     |               |              |          |         |        |  |
|  +------------------------+---------------------+---------------+--------------+----------+---------+--------+  |
|  | Denim Jacket           | MC-101-JKT-RAW-L    | 8901010030039 | A-02-01-04   | [ - 18 +]| ৳ 4,100 | [🖨️][✏️]|  |
|  | • Raw Indigo / L       |                     |               |              |          |         |        |  |
|  +---------------------------------------------------------------------------------------------------------+  |
+---------------------------------------------------------------------------------------------------------------+
```

---

## 📝 ৩. Add Single Product Modal (With 2-Part SKU & Variant Generator)

```
+-----------------------------------------------------------------------------------------+
|  Add New Product to Warehouse Catalog                                               [X] |
+-----------------------------------------------------------------------------------------+
|  Product Title:                                                                         |
|  [ Heavyweight Oversized T-Shirt                                                      ] |
|                                                                                         |
|  Base SKU (Your Internal Code):              Merchant Code (Locked):                    |
|  [ TSHIRT                                  ] [ MC-101                                 ] |
|                                                                                         |
|  [✓] This product has variants (Color / Size)                                           |
|                                                                                         |
|  Colors: [ Black (x) ] [ White (x) ] [ + Add Color ]                                    |
|  Sizes:  [ M (x) ] [ L (x) ] [ XL (x) ] [ + Add Size ]                                  |
|                                                                                         |
|  GENERATED 2-PART SKUS & INITIAL STOCK:                                                 |
|  +-----------------------------------------------------------------------------------+  |
|  | Variant       | Generated SKU            | Barcode       | Initial Qty | Price    |  |
|  | Black / M     | MC-101-TSHIRT-BLK-M      | 8901010010046 | [ 20      ] | [ ৳ 950] |  |
|  | Black / L     | MC-101-TSHIRT-BLK-L      | 8901010010053 | [ 35      ] | [ ৳ 950] |  |
|  | Black / XL    | MC-101-TSHIRT-BLK-XL     | 8901010010060 | [ 15      ] | [ ৳ 950] |  |
|  | White / L     | MC-101-TSHIRT-WHT-L      | 8901010010077 | [ 25      ] | [ ৳ 950] |  |
|  +-----------------------------------------------------------------------------------+  |
|                                                                                         |
|                                                       [ Cancel ]  [ Save & Generate ]   |
+-----------------------------------------------------------------------------------------+
```

---

## 🖨️ ৪. Barcode Label Sticker Modal (2x1 Inch Thermal)

```
+-------------------------------------------------------------------+
|  Print Thermal Barcode Sticker                                [X] |
+-------------------------------------------------------------------+
|  +-------------------------------------------------------------+  |
|  |  Urban Threads BD                                           |  |
|  |  Heavyweight Oversized T-Shirt (Black / XL)                 |  |
|  |  SKU: MC-101-TSHIRT-BLK-XL                                  |  |
|  |                                                             |  |
|  |  ||| | |||| ||||| || |||||| |||| |||||||| |||| |||| || |||  |  |
|  |  8901010010060                                              |  |
|  |                                                             |  |
|  |  PRICE: ৳ 950                    BIN: A-01-02-03            |  |
|  +-------------------------------------------------------------+  |
|                                                                   |
|  Sticker Format: [ 2x1 Inch Thermal (Standard WMS) ▾ ]            |
|  Number of Copies: [ 10 ]                                         |
|                                                                   |
|                                        [ Cancel ]  [ 🖨️ Print ]   |
+-------------------------------------------------------------------+
```
