# Spec Delta: Dispatch Logistics

## Purpose

Handles multi-courier API integrations, automated shipping label generation, dispatch manifest handover, real-time shipment tracking, and return processing (RTO).

## ADDED Requirements

### Requirement: Multi-Courier API Gateway
The system SHALL integrate with third-party courier APIs (such as Steadfast, RedX, Pathao, and Paperfly) to book consignments and fetch tracking IDs.

#### Scenario: Consignment booked with courier
- **WHEN** an order is packed and assigned to a partner courier
- **THEN** the system calls the courier API, books the shipment, retrieves the courier consignment ID, and generates the shipping label

### Requirement: Courier Handover and Manifest Generation
The system SHALL aggregate packed parcels into a formal dispatch manifest for signature and handover to courier collection drivers.

#### Scenario: Generate courier handover manifest
- **WHEN** a warehouse operator selects all packed orders for a specific courier batch
- **THEN** the system generates a printable dispatch manifest with parcel counts, tracking barcodes, and driver signature blocks

### Requirement: Return and RTO Processing
The system SHALL process Return-to-Origin (RTO) and customer return packages, inspect goods for damage, and restock sellable items back into inventory.

#### Scenario: Inbound RTO scan and restocking
- **WHEN** an operator scans a returned parcel tracking barcode and marks contents undamaged
- **THEN** the system transitions order status to Returned, restocks units into designated return bins, and notifies the merchant
