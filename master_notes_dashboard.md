# Master Notes: LoamLabs Ops Dashboard (Current Context)

## 🏗️ Architecture Overview
The dashboard is a Next.js application designed to bridge Shopify product data with external vendor pricing via Scraping and BTI matching.

- **Stack**: React (Frontend), Supabase (PostgreSQL Database), Shopify GraphQL Admin API.
- **Primary Table**: `watcher_rules` houses all synchronized product variants.
- **Auth**: Header-based password authentication (`x-dashboard-auth`).

## 🏷️ Standardized Ignore Tag System
Control product visibility per-tab using Shopify tags:
- `watcher-ignore`: Hides product from the main **Vendor Watcher** Registry and skips it during background syncs.
- `bti-sync-ignore`: Hides product from the **BTI Sync** management tab.
- `lab-ignore`: Hides product from the **Product Lab** (Cloning tab).

## 🧪 Product Lab (Cloning Tool)
- **Grouping**: Unlike other tabs, the Lab groups variants into "Product Families" using `shopify_product_id`.
- **Search**: Supports real-time titles/vendor search.
- **Wheel Sets**: Uses the `handbuilt` tag to surface finished wheelsets.
- **Bulk Actions**: supports "Ignore & Purge" which applies the `lab-ignore` tag via `/api/bulk-update-tags`.
- **Data Integrity Audit**: "Group-Aware" discrepancy engine audits variant metafield consistency across families (handling subset variations like rim size or hub hole count) and surfaces mismatches in a global notification center.

## 🔄 Sync Engine & Arbitration (Stabilized Mar 2026)
- **Arbitration Logic**: Vendor Watcher handles **Price Authority** even when items are Out-of-Stock (OOS) at the vendor. **Inventory Authority** is deferred to BTI ONLY when vendor is OOS.
- **Authority Reclamation**: Sync engine automatically toggles the `inventory_monitoring_enabled` Shopify metafield. It reclaims authority (sets to `false`) immediately when an item returns to stock at the vendor.
- **OOS Pricing**: Prices are updated for OOS items to ensure MSRP/MAP compliance even during backorders.
- **Selective Sync**: API supports `ruleIds` for targeted refreshes of individual or bulk-selected items.
- **Unified Sync Action**: "Sync to Family" button synchronizes metafields directly to Shopify via GraphQL and immediately upserts `watcher_rules` in Supabase to eliminate manual refresh steps.
- **Scraper Resilience**: Implements User-Agent rotation to bypass vendor blocks.

## 📊 Operational Insights (New)
- **Abandoned Builds**: Captures unfinished wheel builds directly from the Shopify theme (via `/api/log-abandoned-build`) and surfaces them in a dedicated insights table while retaining essential email alerts.
- **Health Indicators**: System-wide dashboard components to streamline identifying discrepancies or scraping degradation.

## 🛡️ Security & Integrity (Implemented Mar 2026)
- **Row Level Security (RLS)**: Enabled on `watcher_rules` and `vendor_logos` to prevent unauthorized access.
- **Table Constraints**: `UNIQUE` constraint strictly enforced directly on `shopify_variant_id`.

## 🚀 Future Roadmap
### **Phase 4: Component Library Architecture**
The Component Library is a GitHub-backed engineering database that lives within the dashboard, allowing for direct management of the unified calculator JSON (`rims.json`, `hubs.json`, etc.).
- **Smart Discovery**: Automatically identifies field naming conventions (e.g., `Option1Name` vs `Option 1 Name`) in the existing dataset to ensure data consistency during edits.
- **Mandatory Validation**: Enforces "Ready-to-Build" data integrity. Missing fields (Name, Vendor, Position, Option Names/Values) are highlighted with red row backgrounds in the library.
- **UI UX**: Implemented horizontal scrolling for wide spec sheets, zebra-stripping for readability, and high-contrast labels.
- **Pre-population**: Automates data entry by pre-filling standard category defaults (e.g., "Size" and "Spoke Count" for Rims) based on the starting position.
- **Strict Dropdowns**: technical specifications (Brake Interface, Spoke Count, Spacing) are locked to proper `<select>` dropdowns to prevent engineering typos.

### **Phase 6: The Spreadsheet Engine (Implemented Apr 2026)**
The Component Library has been transformed into a high-performance, modular spreadsheet interface to handle large engineering datasets without UI lag.
- **Modular Component**: All grid-specific logic (rendering, navigation, cell editing) is encapsulated in `components/ComponentLibraryGrid.js`.
- **Excel-Style Interaction**: 
  - **Navigation**: Full support for Arrow keys, Tab (move right/next row), and Enter (move down/submit edit).
  - **Inline Editing**: Double-click or press Enter/Space to activate high-performance `EditableCell` components.
- **Data Architecture Fixes**:
  - **Vendor Resolution**: A dedicated "Vendor" column was decoupled from "Name" to align with the underlying JSON structure and improve filtering.
  - **Unique Row Identity**: All rows now use a composite key (`ID_INDEX`) ensuring visual uniqueness. This eliminates the "ghost selection" bug where multiple rows would highlight simultaneously for duplicate products.
  - **Robust Mapping**: Enhanced key resolution for Name/Vendor fields to handle inconsistent JSON source keys (e.g., `product_title` vs `name`).
- **Persistence Layer**: Spreadsheet edits are tracked in `sessionStorage` (`loamops_grid_unsaved_v1`) to prevent data loss on accidental refreshes, and are persisted to GitHub via a floating batch-save UI.

---
*Updated April 2026 to reflect Spreadsheet Modularization and Keyboard Navigation stabilization.*
