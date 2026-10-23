# Spec Delta: Merchant Integration

## Purpose

Enables multi-tenant merchant onboarding, API credential management, webhook event subscriptions, and storefront plugin integrations for WooCommerce, Shopify, and custom APIs.

## ADDED Requirements

### Requirement: Merchant Registration and Approval
The system SHALL require new merchants to register an account and await platform administrator approval before accessing fulfillment features.

#### Scenario: Merchant registers account
- **WHEN** a merchant submits valid registration credentials and business details
- **THEN** the system creates a pending merchant profile and notifies administrators

#### Scenario: Administrator approves merchant
- **WHEN** an administrator approves a pending merchant
- **THEN** the system activates the merchant account, generates tenant keys, and sends a confirmation email

### Requirement: API Key Management
The system SHALL issue scoped API keys allowing merchants to authenticate automated integration requests from their external storefronts.

#### Scenario: Generate new API key
- **WHEN** an authenticated merchant requests a new API key with defined read/write scopes
- **THEN** the system generates an API key, displays the secret key once, and stores its cryptographic hash

#### Scenario: Revoke compromised API key
- **WHEN** an authenticated merchant revokes an existing API key
- **THEN** the system immediately marks the key invalid and rejects any subsequent requests using it

### Requirement: Webhook Subscriptions
The system SHALL allow merchants to register webhook endpoints for asynchronous event notifications with retry mechanisms and HMAC signing.

#### Scenario: Register webhook endpoint
- **WHEN** a merchant registers a HTTPS webhook URL for specific event topics
- **THEN** the system stores the endpoint and generates an HMAC signing secret for signature verification

#### Scenario: Dispatch webhook notification
- **WHEN** a subscribed event occurs (such as order.shipped or stock.low)
- **THEN** the system dispatches an HMAC-signed POST request to the merchant's endpoint with exponential retry on failure
