# DISTRIBUTED MATERIALS & WAREHOUSE MANAGEMENT SYSTEM (DISTRIBUTED WMS)
## Architecture: MongoDB Sharded Cluster | Backend: NestJS 11 | Frontend: React 18

---

## 1. Executive Summary

The **Distributed Materials & Warehouse Management System (Distributed WMS)** is an enterprise-grade platform engineered to address the complexities of supply chain coordination, multi-regional inventory control, and distributed asset management. Built for industrial manufacturing and large-scale construction enterprises, the platform coordinates operations across geographically distributed hubs (Northern Central Warehouse in Hanoi and Southern Central Warehouse in Ho Chi Minh City).

The platform leverages an enterprise **Distributed Database Architecture** deployed on a **MongoDB Sharded Cluster**, demonstrating core distributed database theorems, protocols, and performance optimization techniques.

### Core Distributed Systems Capabilities

1. **Location-Based Zone Sharding**:
   Transactional collections (`inventory_stocks`, `goods_receipts`, `goods_issues`, `storage_locations`) are horizontally partitioned using compound shard keys (e.g., `{ warehouse_branch: 1, material_code: 1 }`). Records are strictly colocated on dedicated shard instances based on geographical affinity (`ZONE_HN` pinned to Shard 1, `ZONE_HCM` pinned to Shard 2), eliminating cross-region WAN read latency.

2. **Distributed Query Routing (Targeted vs. Scatter-Gather)**:
   The `mongos` query router analyzes query predicates against chunk routing tables:
   - **Targeted Queries (`SINGLE_SHARD`)**: Queries specifying the shard key route directly to the designated shard, delivering sub-2ms response times.
   - **Scatter-Gather Queries (`SHARD_MERGE`)**: Broad analytical queries omitting the shard key are distributed across all active shards in parallel and consolidated at the router tier.

3. **Semi-Join Distributed Query Optimization ($R \ltimes S$)**:
   The system implements an analytical query engine comparing classical **Full-Ship Join** against the **Semi-Join** reduction algorithm. By projecting and transferring only unique join keys across network boundaries, the engine achieves an **82% to 95% reduction in cross-shard network bandwidth** and reduces query latency from 17.2ms to 3.1ms.

4. **Multi-Document Distributed ACID Transactions (2PC)**:
   Inter-warehouse transfer workflows spanning distinct shards execute under distributed transaction sessions utilizing the **Two-Phase Commit (2PC)** protocol with `snapshot` Read Concern and `majority` Write Concern, guaranteeing strict atomicity and cross-shard balance conservation ($\Delta I_{\text{total}} = 0$).

5. **High Availability & Fault Tolerance (Replica Set Quorum)**:
   Each shard is configured as a replica set with Raft-like consensus election. Heartbeat monitors detect node failures and elect a replacement primary within strict majority quorums ($Q = \lfloor n/2 \rfloor + 1$) in less than 5 seconds without operational disruption.

6. **Hashed Sharding & Time-To-Live (TTL) Automated Compaction**:
   High-frequency audit logs (`material_audit_logs`) use Hashed Sharding on `{ log_code: "hashed" }` to eliminate write hotspots across nodes, coupled with background TTL indexes (`expireAfterSeconds`) for automated archival and index cleanup.

7. **Strict Multi-Branch Role-Based Access Control (RBAC)**:
   The API gateway enforces granular tenant isolation. Branch operators are restricted to their local physical shard, while `SUPER_ADMIN` credentials retain global cluster governance and experimental telemetry access.

---

## 2. System Architecture

The application is engineered on a decoupled 3-tier enterprise architecture:

```text
+-----------------------------------------------------------------------------------+
|                        PRESENTATION LAYER: REACT 18 + VITE                        |
|  - High-Density Operate Mode UI (Typography: Arial, Palette: Slate, Zero AI Slop) |
|  - React Router v7, TanStack Query, Recharts, Lucide Icons (Rendered as SVG)     |
|  - Multi-Branch Context Switcher (HN - ZONE_HN, HCM - ZONE_HCM, ALL)              |
|  - Guarded Routing via SuperAdminRoute & ProtectedRoute Components               |
+-----------------------------------------+-----------------------------------------+
                                          | HTTP / RESTful API (Port 5000 / Relative)
+-----------------------------------------v-----------------------------------------+
|                       APPLICATION LAYER: NESTJS 11 BACKEND                        |
|  - Modular Architecture (Auth, Users, Materials, Inventory, Transfers, Cluster)   |
|  - MongoDB Official Native Driver 6.x (Connection Pool: 50, Timeout: 5000ms)     |
|  - Role-Based Access Control Guards & Branch Context Interceptors                 |
|  - Dynamic Fallback Adapter (Seamless execution on Standalone & Sharded clusters) |
|  - OpenAPI / Swagger Documentation available at http://localhost:5000/docs        |
+-----------------------------------------+-----------------------------------------+
                                          | Mongos Connection Pool (Port 27017)
+-----------------------------------------v-----------------------------------------+
|                  DATA LAYER: MONGODB 6.0/7.0 SHARDED CLUSTER                      |
|                                                                                   |
|  +-----------------------------------------------------------------------------+  |
|  |                 MONGOS QUERY ROUTER (Container: vattu-mongos)               |  |
|  |                 Port: 27017 | Central Query Dispatcher & Shard Router       |  |
|  +-----------------------+-------------------------------+---------------------+  |
|                          |                               |                        |
|  +-----------------------v-------------------+   +-------v---------------------+  |
|  | CONFIG SERVER (vattu-configsvr)           |   | SHARD 1 (vattu-shard1)      |  |
|  | Port: 27019 | ReplicaSet: configReplSet   |   | Port: 27018 | Set: shard1RS |  |
|  | Metadata, Routing Chunks & Zone Ranges    |   | Region: HN | Tag: ZONE_HN   |  |
|  +-------------------------------------------+   +-----------------------------+  |
|                                                  | SHARD 2 (vattu-shard2)      |  |
|                                                  | Port: 27020 | Set: shard2RS |  |
|                                                  | Region: HCM | Tag: ZONE_HCM |  |
|                                                  +-----------------------------+  |
+-----------------------------------------------------------------------------------+
```

---

## 3. Database Collections & Partitioning Strategy

The `material_inventory_db` database comprises 20 collections categorized across 6 business domains and 3 storage strategies:

| Index | Collection Name | Storage & Partitioning Strategy | Shard Key Definition | Business & Technical Description |
| :--- | :--- | :--- | :--- | :--- |
| 01 | `materials` | Unsharded Global Reference | N/A (Primary Shard) | Master materials catalog, polymorphic specifications schema |
| 02 | `material_categories` | Unsharded Global Reference | N/A (Primary Shard) | Material classification groups (Mechanical, Electrical, Chemicals) |
| 03 | `warehouses` | Unsharded Global Reference | N/A (Primary Shard) | Master warehouse registry and physical location metadata |
| 04 | `storage_locations` | Location-Based Zone Sharding | `{ warehouse_branch: 1, location_code: 1 }` | 36-cell storage matrix coordinates (Aisle, Rack, Bin) |
| 05 | `suppliers` | Unsharded Global Reference | N/A (Primary Shard) | Enterprise supplier directories and corporate credentials |
| 06 | `purchase_orders` | Location-Based Zone Sharding | `{ warehouse_branch: 1, po_code: 1 }` | Procurement orders partitioned by receiving destination |
| 07 | `supplier_contracts`| Location-Based Zone Sharding | `{ warehouse_branch: 1, contract_code: 1 }` | Master procurement agreements and delivery schedules |
| 08 | `supplier_evaluations`| Location-Based Zone Sharding| `{ warehouse_branch: 1, eval_code: 1 }` | Quality audit scores and SLA adherence records |
| 09 | `inventory_stocks` | Location-Based Zone Sharding | `{ warehouse_branch: 1, material_code: 1 }` | Physical stock levels, allocations, and safety thresholds |
| 10 | `material_batches` | Location-Based Zone Sharding | `{ warehouse_branch: 1, batch_code: 1 }` | Batch tracking, shelf-life dates, and CO/CQ certifications |
| 11 | `stocktakes` | Location-Based Zone Sharding | `{ warehouse_branch: 1, stocktake_code: 1 }` | Inventory audit reconciliation and discrepancy adjustments |
| 12 | `quality_inspections`| Location-Based Zone Sharding| `{ warehouse_branch: 1, inspection_code: 1 }`| QC compliance reports and material batch validation |
| 13 | `goods_receipts` | Location-Based Zone Sharding | `{ warehouse_branch: 1, receipt_code: 1 }` | Inbound warehouse receipts with majority write concern |
| 14 | `goods_issues` | Location-Based Zone Sharding | `{ warehouse_branch: 1, issue_code: 1 }` | Outbound dispatch vouchers with balance constraint checks |
| 15 | `stock_transfers` | Location-Based Zone Sharding | `{ from_branch: 1, transfer_code: 1 }` | Cross-shard transfer vouchers governed by 2PC transactions |
| 16 | `material_returns` | Location-Based Zone Sharding | `{ warehouse_branch: 1, return_code: 1 }` | Reclaimed material intake from completed construction projects|
| 17 | `material_requests`| Location-Based Zone Sharding | `{ warehouse_branch: 1, request_code: 1 }` | Departmental material allocation requisition vouchers |
| 18 | `projects_departments`| Unsharded Global Reference | N/A (Primary Shard) | Internal project departments, cost centers, and site registries |
| 19 | `users` | Unsharded Global Reference | N/A (Primary Shard) | User identities, bcrypt hashed credentials, and RBAC roles |
| 20 | `material_audit_logs`| Hashed Sharding & TTL Index | `{ log_code: "hashed" }` | System-wide immutable audit trail, auto-expiring after 30 days |

---

## 4. Functional Modules & Source Code Directory Mapping

The application encompasses 21 modules structured across 3 functional divisions:

### Division A: Distributed WMS Business Suite

| Index | Module / Route | Distributed Database Demonstration Scope | Frontend Directory | Backend Directory |
| :--- | :--- | :--- | :--- | :--- |
| 01 | Dashboard Overview (`/dashboard`) | Multi-shard aggregation pipelines, cross-region inventory consolidation | `frontend/src/pages/dashboard` | `backend/src/modules/dashboard` |
| 02 | Materials Catalog (`/materials`) | Polymorphic schema validation, global unpartitioned reference catalog | `frontend/src/pages/materials` | `backend/src/modules/materials` |
| 03 | Warehouse Bin Map (`/warehouses`) | 36-bin coordinate layout; atomic updates across locations, stock, and logs | `frontend/src/pages/warehouses` | `backend/src/modules/warehouses` |
| 04 | Procurement & Vendors (`/procurement`)| Relational lookup between global vendors and partitioned purchase orders | `frontend/src/pages/procurement` | `backend/src/modules/procurement` |
| 05 | Inventory Stock (`/inventory`) | Compound shard key filtering, dynamic safety threshold notifications | `frontend/src/pages/inventory` | `backend/src/modules/inventory` |
| 06 | Goods Receipts (`/goods-receipts`) | Local shard writes under majority write concern, atomic stock increments | `frontend/src/pages/goods-receipts` | `backend/src/modules/stock-movements` |
| 07 | Goods Issues (`/goods-issues`) | Pre-allocation balance verification, preventing distributed inventory anomalies | `frontend/src/pages/goods-issues` | `backend/src/modules/stock-movements` |
| 08 | Stock Transfers (`/stock-transfers`) | Distributed Two-Phase Commit (2PC) between Shard HN and Shard HCM | `frontend/src/pages/stock-transfers` | `backend/src/modules/stock-transfers` |
| 09 | Stocktakes (`/stocktakes`) | Physical-to-book reconciliation, atomic in-place adjustments | `frontend/src/pages/stocktakes` | `backend/src/modules/stocktakes` |
| 10 | Valuation Reports (`/reports`) | Distributed FIFO inventory valuation computed independently per shard | `frontend/src/pages/reports` | `backend/src/modules/reports` |

### Division B: Distributed Database Laboratory Suite (Super Admin Only)

| Index | Module / Route | Distributed Database Demonstration Scope | Frontend Directory | Backend Directory |
| :--- | :--- | :--- | :--- | :--- |
| 11 | Cluster Topology (`/cluster-topology`) | Live 4-node cluster visualization (Mongos, Config Server, Shards), ping telemetry | `frontend/src/pages/cluster` (ClusterTopologyPage.tsx) | `backend/src/modules/cluster-demo` |
| 12 | Shard Distribution (`/shard-distribution`)| Chunk balancing telemetry, document counts, and storage metrics per shard | `frontend/src/pages/cluster` (ShardDistributionPage.tsx) | `backend/src/modules/cluster-demo` |
| 13 | Explain Plan Analyzer (`/query-analyzer` Tab 2)| Benchmarking Targeted Queries (`SINGLE_SHARD`) against Scatter-Gather (`SHARD_MERGE`) | `frontend/src/pages/cluster` (QueryAnalyzerPage.tsx) | `backend/src/modules/cluster-demo` |
| 14 | Semi-Join Optimizer (`/query-analyzer` Tab 1) | Semi-Join ($R \ltimes S$) laboratory demonstrating >80% bandwidth optimization | `frontend/src/pages/cluster` (QueryAnalyzerPage.tsx) | `backend/src/modules/cluster-demo` |
| 15 | ACID 2PC Simulator (`/distributed-transactions`)| Interactive simulation of two-phase commits vs. automatic distributed rollback | `frontend/src/pages/cluster` (DistributedTransactionsPage.tsx) | `backend/src/modules/cluster-demo` |
| 16 | Zone Sharding Lab (`/zone-sharding-lab`) | Interactive ingestion demonstrating tag-aware routing into Shard 1 or Shard 2 | `frontend/src/pages/cluster` (ZoneShardingLabPage.tsx) | `backend/src/modules/cluster-demo` |
| 17 | HA Failover Simulator (`/ha-simulator`) | Primary crash simulation, live Raft-like majority quorum election monitoring | `frontend/src/pages/cluster` (HaSimulatorPage.tsx) | `backend/src/modules/cluster-demo` |
| 18 | Audit Trail & TTL (`/audit-ttl-explorer`)| Hashed sharded audit log stream and background TTL index compaction verification | `frontend/src/pages/cluster` (AuditTtlExplorerPage.tsx) | `backend/src/modules/cluster-demo` |

### Division C: Administration & Multi-Branch Governance

| Index | Module / Route | Distributed Database Demonstration Scope | Frontend Directory | Backend Directory |
| :--- | :--- | :--- | :--- | :--- |
| 19 | User Management (`/users`) | Enterprise RBAC identity management, bcrypt hashing, tenant assignments | `frontend/src/pages/users` | `backend/src/modules/users` |
| 20 | Branch Registry (`/branches`) | Multi-tenant physical warehouse definitions and shard zone mappings | `frontend/src/pages/branches` | `backend/src/modules/branches` |
| 21 | Account Settings (`/settings`) | User profile governance, self-service credential updates, JWT verification | `frontend/src/pages/settings` | `backend/src/modules/auth` |

---

## 5. Role-Based Access Control (RBAC) Matrix

The system enforces strict boundary isolation at both frontend routing and backend guard layers:

| Module / Operation | SUPER_ADMIN | BRANCH_MANAGER | WAREHOUSE_STAFF | QC_INSPECTOR | AUDITOR |
| :--- | :---: | :---: | :---: | :---: | :---: |
| Dashboard Overview | Nationwide | Assigned Branch | Assigned Branch | Assigned Branch | Nationwide (Read-Only) |
| Materials Catalog | Full Access | Full Access | Read-Only | Read-Only | Read-Only |
| Warehouse Bin Map | Full Access | Assigned Branch | Assigned Branch | Denied | Read-Only |
| Procurement & POs | Full Access | Assigned Branch | Denied | Denied | Read-Only |
| Inventory Stock | Full Access | Assigned Branch | Assigned Branch | Denied | Read-Only |
| Receipts & Issues | Full Access | Approver | Operator | Denied | Read-Only |
| Inter-Shard Transfers | Full Access | Source/Dest Hub | Denied | Denied | Read-Only |
| Stocktakes Reconcile| Full Access | Approver | Counter Staff | Denied | Read-Only |
| FIFO Stock Valuation | Full Access | Read-Only | Denied | Denied | Full Access |
| QC Batch Inspections| Full Access | Read-Only | Denied | Full Access | Read-Only |
| Distributed Lab (11-18)| GRANTED | RESTRICTED | RESTRICTED | RESTRICTED | RESTRICTED |
| User Administration | GRANTED | RESTRICTED | RESTRICTED | RESTRICTED | RESTRICTED |

---

## 6. Installation & Deployment Guide

### 6.1. Environment Prerequisites
- **Operating System**: Windows 10/11, macOS, or Linux (Ubuntu 20.04/22.04 LTS).
- **Node.js**: Version 18.x or higher (Node.js 20.x or 22.x LTS recommended).
- **Package Manager**: npm 9.x or higher.
- **Docker & Docker Compose**: Version 20.10+ (required for multi-container sharded cluster deployment).
- **MongoDB**: Supports both local standalone MongoDB instances (port 27017) and containerized sharded clusters.

---

### 6.2. Method 1: Automated Windows One-Click Launcher (Recommended)

The project includes an automated script that launches the backend, frontend, and browser in a single step:
```cmd
run_all.bat
```
The script performs the following tasks:
1. Validates and starts the NestJS Backend Gateway on port 5000 (`http://localhost:5000`).
2. Validates and starts the Vite Frontend Web Server on port 3000 (`http://localhost:3000`).
3. Launches the default web browser directed to the application dashboard.

To perform a clean shutdown:
```cmd
stop_all.bat
```

---

### 6.3. Method 2: Containerized MongoDB Sharded Cluster Deployment

For production-identical demonstration using Docker:

#### Step 1: Start the 4 Cluster Containers
```powershell
cd docker
docker-compose up -d
```
Active services:
- `vattu-configsvr`: Config Server Replica Set (Port 27019)
- `vattu-shard1`: Shard 1 Replica Set - Northern Hub (Port 27018)
- `vattu-shard2`: Shard 2 Replica Set - Southern Hub (Port 27020)
- `vattu-mongos`: Mongos Query Router Gateway (Port 27017)

#### Step 2: Initialize Replica Sets & Register Shards
```powershell
# Windows Command Prompt
.\init-cluster.bat
# Or using PowerShell
.\init-cluster.ps1
```

#### Step 3: Seed Schema, Initial Data, and Zone Tag Rules
```bash
cd ../scripts
mongosh "mongodb://localhost:27017" < 01_init_schema_and_indexes.js
mongosh "mongodb://localhost:27017" < 02_seed_data.js
mongosh "mongodb://localhost:27017" < 03_setup_sharding.js
```

---

### 6.4. Method 3: Manual Component Startup

#### Start Backend API Gateway:
```bash
cd backend
npm install
npm run build
npm run start:dev
```
- API Base URL: `http://localhost:5000/api/v1`
- OpenAPI Documentation: `http://localhost:5000/docs`

#### Start Frontend Web Application:
```bash
cd frontend
npm install
npm run dev
```
- Web Application: `http://localhost:3000`

---

### 6.5. Multi-Device Demonstration (LAN or Cloudflare Tunnel)

The application is preconfigured with `host: true`, `allowedHosts: true` in [frontend/vite.config.ts](frontend/vite.config.ts) and uses relative API base endpoints `/api/v1` in [frontend/src/lib/api.ts](frontend/src/lib/api.ts):

1. **Local Area Network (LAN / Wi-Fi)**:
   - Host machine: Obtain LAN IP address via `ipconfig` (e.g., `192.168.1.15`).
   - Client devices: Connect browser to `http://192.168.1.15:3000`.
   - Requests proxy seamlessly to the host backend without CORS restrictions.

2. **Remote Access via Cloudflare Tunnel**:
   ```cmd
   cloudflared tunnel --url http://localhost:3000
   ```
   Share the generated `https://xxx.trycloudflare.com` URL with remote evaluators or collaborators for simultaneous multi-user role sessions.

---

## 7. Seeded Demonstration Credentials

The database contains 5 preconfigured role accounts:

| Role Assignment | Login Email | Default Password | Data Partition & Scope Access |
| :--- | :--- | :--- | :--- |
| **Super Admin** | `admin@wms.enterprise.vn` | `Admin@Distributed2026` | Global authority across all shards, access to distributed laboratory |
| **Warehouse Manager (Hanoi)** | `manager.hn@wms.enterprise.vn` | `Wms@123456` | Northern Central Warehouse (Targeted to Shard 1 / ZONE_HN) |
| **Warehouse Manager (HCMC)** | `manager.hcm@wms.enterprise.vn` | `Wms@123456` | Southern Central Warehouse (Targeted to Shard 2 / ZONE_HCM) |
| **QC Lead Inspector** | `qc.lead@wms.enterprise.vn` | `Wms@123456` | Quality control inspections, material batch acceptance |
| **Auditor** | `auditor@wms.enterprise.vn` | `Wms@123456` | Read-only access to FIFO valuations and audit log streams |

---

## 8. Documentation References

For exhaustive step-by-step demonstration workflows, theoretical derivations, and formal academic documentation, refer to:
- **Demonstration Guide & Module Registry**: [HUONG_DAN_DEMO_VA_CAU_TRUC_MODULES.txt](HUONG_DAN_DEMO_VA_CAU_TRUC_MODULES.txt)
- **Academic Project Thesis (55 pages, DOCX format)**: Located in the local `bao_cao/` directory (excluded from git tracking per `.gitignore`).

---

## 9. Academic & Technical Attribution

- **Project Title**: Distributed Materials & Enterprise Warehouse Management System on MongoDB Sharded Cluster Architecture.
- **Academic Course**: Distributed Database Systems (CSDLPT).
- **Institution**: Department of Information Technology 1 - Posts and Telecommunications Institute of Technology (PTIT).
- **Project Team**: Team 01.
