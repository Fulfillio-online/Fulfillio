# Spec Delta: Billing and Settlement

## Purpose

Calculates 3PL warehouse storage and handling fees, reconciles Cash-on-Delivery (COD) collections from couriers, and generates merchant payout statements.

## ADDED Requirements

### Requirement: Storage and Handling Fee Calculation
The system SHALL compute periodic storage charges based on occupied volume or pallet days and charge per-order pick-and-pack handling fees.

#### Scenario: Apply pick-and-pack handling charge
- **WHEN** an order is successfully packed and dispatched
- **THEN** the system logs an itemized fulfillment charge according to the merchant's agreed pricing tier

### Requirement: Cash on Delivery (COD) Reconciliation and Payout
The system SHALL track COD funds collected by courier partners against delivered parcels and reconcile net payouts after deducting fulfillment fees.

#### Scenario: Reconcile courier COD remittance
- **WHEN** a courier provider remits a batch payment sheet with delivered consignment amounts
- **THEN** the system reconciles each order, deducts courier and 3PL fees, and credits the merchant's settlement ledger

#### Scenario: Generate weekly settlement statement
- **WHEN** the scheduled payout cycle triggers for an active merchant
- **THEN** the system compiles an itemized financial statement showing gross COD collected, fee deductions, and net payout payable
