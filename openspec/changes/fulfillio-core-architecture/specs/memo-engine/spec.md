# Spec Delta: Memo Engine

## Purpose

Enables merchants to design and manage custom invoice and memo layouts with unique Memo Codes, and dynamically renders branded invoices upon packing verification.

## ADDED Requirements

### Requirement: Custom Memo Layout Designer and Code Assignment
The system SHALL provide a layout designer allowing merchants to configure custom invoice templates and assign each design an immutable, unique Memo Code.

#### Scenario: Save custom memo template
- **WHEN** a merchant configures logo branding, header text, paper dimensions, and line item columns and assigns code "MEMO-VIP"
- **THEN** the system validates layout schema, ensures the memo code is unique for this merchant, and stores the template

### Requirement: Order Memo Code Attribution
The system SHALL accept a Memo Code attribute on order intake and link the order to the merchant's specified invoice layout.

#### Scenario: Order synced with valid memo code
- **WHEN** an incoming order includes attribute memo_code = "MEMO-VIP"
- **THEN** the system links the order to the corresponding memo template definition

#### Scenario: Order synced without memo code
- **WHEN** an order is submitted without a specified memo code
- **THEN** the system defaults to the merchant's designated primary default memo design

### Requirement: Dynamic Invoice Generation and Printing at Packing
The system SHALL dynamically compile and render the branded invoice PDF or thermal label when the order reaches the packing station.

#### Scenario: Auto-render on packing completion
- **WHEN** all items for an order are verified at the packing station
- **THEN** the system compiles order data into the merchant's chosen memo template and outputs a print-ready document to the station printer
