# BÀI TẬP LỚN: CƠ SỞ DỮ LIỆU PHÂN TÁN (MONGODB)
## Đề tài: Hệ thống Quản trị & Điều phối Vật tư Doanh nghiệp Phân tán (Distributed Materials & Warehouse Management System - WMS)

---

## 1. Giới thiệu Đề tài
Hệ thống **Quản trị & Điều phối Vật tư Doanh nghiệp Phân tán (WMS & Materials Management)** được thiết kế nhằm số hóa và tự động hóa toàn diện quy trình chuỗi cung ứng vật tư, trang thiết bị công nghiệp, vật liệu xây dựng cho các tập đoàn, tổng công ty sản xuất - xây lắp có mạng lưới tổng kho phân bố đa vùng miền (Tổng kho Miền Bắc - Hà Nội, Tổng kho Miền Nam - TP.HCM).

Hệ thống tận dụng triệt để các thế mạnh cốt lõi của **MongoDB** và **Cơ sở dữ liệu phân tán (Distributed Database)**:
- **Polymorphic Schema (Lược đồ Đa hình)**: Quản lý thông tin đa dạng của hàng nghìn chủng loại vật tư (Thép xây dựng, Cáp điện trung thế, Sơn công nghiệp, Bu-lông cơ khí...) trong cùng một collection với các trường thông số kỹ thuật (`specifications`) linh hoạt mà không cần tạo hàng chục bảng SQL rời rạc.
- **Embedded Documents & Arrays**: Nhúng chi tiết danh mục hàng hóa trong từng phiếu nhập/xuất kho, vị trí ô kệ (Aisle, Rack, Bin), thông số kiểm định chất lượng (QC) và chứng chỉ xuất xứ (CO/CQ).
- **Horizontal Sharding & Geo-Zone Sharding**: Phân mảnh ngang và gán vùng dữ liệu theo chi nhánh tổng kho (`warehouse_branch: "HN"` và `"HCM"`). Dữ liệu phát sinh tại tổng kho nào sẽ được lưu trữ và truy xuất trực tiếp tại máy chủ Shard vùng đó (*Targeted Query*), giúp tối ưu hóa băng thông mạng và độ trễ.
- **High Availability & Distributed ACID Transactions**: Đảm bảo sẵn sàng cao qua kiến trúc Replica Set 3 nodes và thực hiện giao dịch an toàn đa tài liệu (Multi-document Transaction) khi xuất kho cấp phát cho công trình: tự động trừ số lượng tồn kho khả dụng, tạo phiếu xuất kho và ghi nhật ký kiểm toán trong một phiên làm việc nguyên tử (*Atomic*).

---

## 2. Kiến trúc 3-Tier Web Application (Nền tảng Web Base)

Hệ thống được tổ chức theo kiến trúc 3 tầng chuẩn doanh nghiệp:

```text
┌──────────────────────────────────────────────────────────────────────────────┐
│                    PRESENTATION LAYER: REACT 18 + VITE                       │
│  - TailwindCSS + Enterprise Design System (Deep Navy, Crisp Spacing, No AI) │
│  - React Router, TanStack Query, Lucide React, Recharts                      │
│  - Multi-Branch Context Switcher (HN - ZONE_HN, HCM - ZONE_HCM, ALL)         │
│  - Real-time Cluster Observability, RBAC Session & Module Navigation         │
└──────────────────────────────────────┬───────────────────────────────────────┘
                                       │ HTTP / RESTful API (Port 5000)
┌──────────────────────────────────────▼───────────────────────────────────────┐
│                    APPLICATION LAYER: NESTJS BACKEND API                     │
│  - Modular Architecture (Core, Health, Auth, Users, Roles, Branches, Dash)   │
│  - Official MongoDB Native Driver (Direct Sessions, Transactions, Commands)  │
│  - Multi-Branch RBAC Guards (Super Admin, Manager HN, Manager HCM, QC, Audit)│
│  - Swagger / OpenAPI Documentation tại http://localhost:5000/docs            │
└──────────────────────────────────────┬───────────────────────────────────────┘
                                       │ Mongos Connection Pool (Port 27017)
┌──────────────────────────────────────▼───────────────────────────────────────┐
│              DATA LAYER: MONGODB 6.0 SHARDED CLUSTER (DOCKER)                │
│  ├── Mongos Query Router  : Port 27017 (Cổng tiếp nhận & định tuyến)         │
│  ├── Config Server        : Port 27019 (Metadata & Chunk locations)          │
│  ├── Shard 1 (ZONE_HN)    : Port 27018 (Tổng kho Miền Bắc - Hà Nội)          │
│  └── Shard 2 (ZONE_HCM)   : Port 27020 (Tổng kho Miền Nam - TP.HCM)          │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Danh mục Toàn diện 20 Collections (Chia theo 6 Phân hệ Nghiệp vụ)

```text
┌──────────────────────────────────────────────────────────────────────────────┐
│        HỆ THỐNG QUẢN TRỊ & ĐIỀU PHỐI VẬT TƯ DOANH NGHIỆP PHÂN TÁN (WMS)      │
├─────────────────────┬─────────────────────┬──────────────────────────────────┤
│ 1. Danh mục & Kho   │ 2. Đối tác & Mua sắm│ 3. Giao dịch Kho (Sharded)       │
│  - materials        │  - suppliers        │  - goods_receipts ⭐             │
│  - material_cats    │  - purchase_orders  │  - goods_issues ⭐               │
│  - warehouses       │  - supplier_contr   │  - stock_transfers (Liên kho)    │
│  - storage_locs     │  - supplier_evals   │  - material_returns (Thu hồi)    │
├─────────────────────┼─────────────────────┼──────────────────────────────────┤
│ 4. Tồn kho & KCS    │ 5. Dự án & Cấp phát │ 6. Tài chính & Kiểm toán         │
│  - inventory_stk ⭐ │  - material_requests│  - inventory_valuations (FIFO)   │
│  - material_batches │  - projects_depts   │  - material_audit_logs (TTL)     │
│  - stocktakes       │  - users (RBAC)     │                                  │
│  - quality_inspects │                     │                                  │
└─────────────────────┴─────────────────────┴──────────────────────────────────┘
```

---

## 4. Cấu trúc Thư mục Dự án

```text
BTL_CSDLPT/
├── backend/                            # NestJS Backend API Gateway
│   ├── src/
│   │   ├── common/                     # Filters, Interceptors, Guards, Decorators (Branch Context, RBAC)
│   │   ├── config/                     # Configuration Service & Environment
│   │   ├── database/                   # MongoDB Official Native Driver Provider & Sessions
│   │   ├── modules/                    # Health, Auth, Users, Roles, Branches, Dashboard
│   │   ├── app.module.ts
│   │   └── main.ts                     # Swagger setup & Global Validation Pipes
│   ├── Dockerfile
│   ├── .env.example
│   └── package.json
├── frontend/                           # React 18 + Vite Frontend Application
│   ├── src/
│   │   ├── components/                 # AdminLayout, Sidebar, Header, BranchSelector, UI Common
│   │   ├── context/                    # AuthContext (JWT & Active Branch Context)
│   │   ├── lib/                        # Centralized API client & Tailwind merge utils
│   │   ├── pages/                      # LoginPage, DashboardOverviewPage, ModulePlaceholderPage
│   │   ├── types/                      # TypeScript definitions for WMS & Cluster
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── Dockerfile
│   ├── nginx.conf
│   ├── .env.example
│   └── package.json
├── docker/
│   ├── docker-compose.yml              # Dựng cụm Sharded Cluster phân tán (4 MongoDB containers)
│   └── init-cluster.ps1                # Script PowerShell 1-click kích hoạt Replica Sets & nạp Shards
├── scripts/
│   ├── 01_init_schema_and_indexes.js   # Tạo 20 Collections + Schema Validation + Indexes chuyên sâu
│   ├── 02_seed_data.js                 # Nạp dữ liệu thực tế cho 20 Collections
│   ├── 03_setup_sharding.js            # Kích hoạt Sharding & cấu hình Zone Sharding (HN vs HCM)
│   └── 04_advanced_queries.js          # 5 Aggregation Pipelines, Giao dịch ACID & Full-Text Search
├── docker-compose.fullstack.yml        # Docker Compose toàn diện (Cluster + Backend + Frontend)
├── KE_HOACH_PHAT_TRIEN_MODULE_WEB_CSDLPT.txt # Tài liệu phân tích 16 Modules WMS & Demo phân tán
└── README.md                           # Thuyết minh đề tài & Hướng dẫn vận hành
```

---

## 5. Hướng dẫn Khởi chạy Hệ thống

### Cách 1: Chạy Từng Thành Phần (Development Mode)

#### Bước 1: Khởi động cụm MongoDB Sharded Cluster
Mở PowerShell tại thư mục `docker/`:
```powershell
docker-compose up -d
.\init-cluster.ps1
```
*(Nếu chạy MongoDB cục bộ trên máy tính, cổng mặc định 27017 vẫn được hỗ trợ đầy đủ).*

#### Bước 2: Nạp dữ liệu và cấu hình phân tán
Mở PowerShell tại thư mục `scripts/`:
```powershell
mongosh "mongodb://localhost:27017" < 01_init_schema_and_indexes.js
mongosh "mongodb://localhost:27017" < 02_seed_data.js
mongosh "mongodb://localhost:27017" < 03_setup_sharding.js
```

#### Bước 3: Khởi động Backend API Gateway
Mở terminal tại thư mục `backend/`:
```bash
npm install
npm run start:dev
```
* **API Endpoint**: `http://localhost:5000/api/v1`
* **Swagger API Docs**: `http://localhost:5000/docs`
* **Health Check**: `http://localhost:5000/api/v1/health/database`

#### Bước 4: Khởi động Frontend Web Application
Mở terminal tại thư mục `frontend/`:
```bash
npm install
npm run dev
```
* **Web App**: `http://localhost:3000`

---

### Cách 2: Chạy Toàn Bộ Hệ Thống bằng Docker 1-Click (Production Mode)

Tại thư mục gốc dự án:
```powershell
docker-compose -f docker-compose.fullstack.yml up -d --build
```
Hệ thống sẽ tự động khởi động:
1. `vattu-configsvr` (27019)
2. `vattu-shard1` (27018)
3. `vattu-shard2` (27020)
4. `vattu-mongos` (27017)
5. `vattu-backend` (5000)
6. `vattu-frontend` (3000)

---

## 6. Danh sách Tài khoản Demo Phân quyền (RBAC)

Hệ thống đã nạp sẵn 5 tài khoản mẫu tương ứng 5 vai trò (có thể click điền nhanh tại giao diện Đăng nhập):

| Vai trò | Email đăng nhập | Mật khẩu | Chi nhánh / Shard phụ trách |
| :--- | :--- | :--- | :--- |
| **Super Admin** | `admin@wms.enterprise.vn` | `Admin@Distributed2026` | Toàn quyền toàn quốc (Tất cả Shards) |
| **Thủ kho Miền Bắc** | `manager.hn@wms.enterprise.vn` | `Wms@123456` | **ZONE_HN** (Chỉ thao tác trên Shard 1) |
| **Thủ kho Miền Nam** | `manager.hcm@wms.enterprise.vn` | `Wms@123456` | **ZONE_HCM** (Chỉ thao tác trên Shard 2) |
| **Kiểm định KCS / QC** | `qc.lead@wms.enterprise.vn` | `Wms@123456` | Nghiệm thu chất lượng lô hàng vật tư |
| **Kiểm toán viên** | `auditor@wms.enterprise.vn` | `Wms@123456` | Xem báo cáo tài chính tồn kho & Audit Logs |
