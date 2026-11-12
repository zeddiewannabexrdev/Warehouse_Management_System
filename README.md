# HE THONG QUAN TRI VA DIEU PHOI VAT TU DOANH NGHIEP PHAN TAN (DISTRIBUTED WMS)
## Architecture: MongoDB Sharded Cluster | Backend: NestJS 11 | Frontend: React 18

---

## 1. Tong quan He thong

He thong Quan tri va Dieu phoi Vat tu Doanh nghiep Phan tan (Distributed Warehouse & Materials Management System - WMS) duoc nghien cuu va phat trien nham giai quyet bai toan quan ly chuoi cung ung, dieu phoi vat tu quy mo lon cho doanh nghiep san xuat - xay lap da chi nhanh. He thong trien khai kien truc Co so du lieu phan tan (Distributed Database System) tren nen tang MongoDB Sharded Cluster, ket noi mang luoi tong kho trai dai giua cac vung dia ly (Tong kho Mien Bac - Ha Noi va Tong kho Mien Nam - TP. Ho Chi Minh).

### Cac dac trung ky thuat cot loi

1. **Phan manh theo vung dia ly (Location-Based Zone Sharding)**:
   Du lieu ton kho, phieu nhap, phieu xuat duoc phan manh ngang dua tren khoa phuc hop `{ warehouse_branch: 1, ... }`. Du lieu tai chi nhanh nao duoc luu tru cuc bo tren Shard phu trach vung do (ZONE_HN tai Shard 1, ZONE_HCM tai Shard 2), giup toi uu hoa do tre truy cap va bang thong mang.

2. **Dinh tuyen truy van phan tan (Distributed Query Routing)**:
   Bo dinh tuyen Mongos phan tich vi tu truy van de dieu huong yeu cau chinh xac:
   - Targeted Query (SINGLE_SHARD): Truy van co chua Shard Key chi duoc gui den dung Shard muc tieu.
   - Scatter-Gather Query (SHARD_MERGE): Truy van khong chua Shard Key duoc phat tan dong thoi den tat ca cac Shard va hop nhat ket qua tai router.

3. **Toi uu hoa truy van bang thuat toan Ban ket noi (Semi-Join Optimization - R <| S)**:
   He thong tich hop bo phan tich va thuc thi phep noi nua Semi-Join de ket noi du lieu giua cac bang phan manh nam tren cac Shard khac nhau, giup giam thieu tren 80% dung luong du lieu can truyen qua mang so voi phuong phap truyen toan bo quan he (Full-Ship Join).

4. **Giao dich phan tan da tai lieu (Multi-Document ACID Transactions - 2PC)**:
   Quy trinh dieu chuyen vat tu lien kho giua hai Shard (Cross-Shard Transfer) tuan thu chat che nguyen tac ACID thong qua giao thuc Cam ket Hai pha (Two-Phase Commit), Read Concern `snapshot` va Write Concern `majority`.

5. **San sang cao va Tu dong bau cu (High Availability & Replica Set Quorum)**:
   Moi Shard duoc to chuc duoi dang mot Replica Set voi co che phat hien su co qua nhip tim (Heartbeat) va tu dong bau cu thu linh moi dua tren dong thuan da so (Strict Majority Quorum).

6. **Bao mat phan quyen nghiem ngat da chi nhanh (Multi-Branch RBAC)**:
   Phan tach quyen han tuyet doi giua quan ly chi nhanh cuc bo va quan tri vien cap cao (SUPER_ADMIN), bao ve toan ven bien phan quyen API.

---

## 2. Kien truc He thong (System Architecture)

He thong duoc to chuc theo kien truc 3 tang (3-Tier Enterprise Architecture):

```text
+-----------------------------------------------------------------------------------+
|                        PRESENTATION LAYER: REACT 18 + VITE                        |
|  - High-Density Operate Mode UI (Typography: Arial, Palette: Slate, Zero AI Slop) |
|  - React Router v7, TanStack Query, Recharts, Lucide Icons (Rendered as SVG)     |
|  - Multi-Branch Context Switcher (HN - ZONE_HN, HCM - ZONE_HCM, ALL)              |
|  - Restricted Navigation via SuperAdminRoute & ProtectedRoute                     |
+-----------------------------------------+-----------------------------------------+
                                          | HTTP / RESTful API (Port 5000 / Relative)
+-----------------------------------------v-----------------------------------------+
|                       APPLICATION LAYER: NESTJS 11 BACKEND                        |
|  - Modular Architecture (Auth, Users, Materials, Inventory, Transfers, Cluster)   |
|  - MongoDB Official Native Driver 6.x (Connection Pool: 50, Timeout: 5000ms)     |
|  - Role-Based Access Control Guards & Branch Context Interceptors                 |
|  - Standalone Transaction Fallback Adapter (Tu dong tuong thich Standalone/Docker)|
|  - OpenAPI / Swagger Documentation tai http://localhost:5000/docs                 |
+-----------------------------------------+-----------------------------------------+
                                          | Mongos Connection Pool (Port 27017)
+-----------------------------------------v-----------------------------------------+
|                  DATA LAYER: MONGODB 6.0/7.0 SHARDED CLUSTER                      |
|                                                                                   |
|  +-----------------------------------------------------------------------------+  |
|  |                 MONGOS QUERY ROUTER (Container: vattu-mongos)               |  |
|  |                 Port: 27017 | Cong tiep nhan va phan tich Shard Key         |  |
|  +-----------------------+-------------------------------+---------------------+  |
|                          |                               |                        |
|  +-----------------------v-------------------+   +-------v---------------------+  |
|  | CONFIG SERVER (vattu-configsvr)           |   | SHARD 1 (vattu-shard1)      |  |
|  | Port: 27019 | ReplicaSet: configReplSet   |   | Port: 27018 | Set: shard1RS |  |
|  | Metadata, Routing Table, Zone Definitions |   | Region: HN | Tag: ZONE_HN   |  |
|  +-------------------------------------------+   +-----------------------------+  |
|                                                  | SHARD 2 (vattu-shard2)      |  |
|                                                  | Port: 27020 | Set: shard2RS |  |
|                                                  | Region: HCM | Tag: ZONE_HCM |  |
|                                                  +-----------------------------+  |
+-----------------------------------------------------------------------------------+
```

---

## 3. Danh muc 20 Collections va Chien luoc Phan manh

Co so du lieu `material_inventory_db` gom 20 Collections duoc to chuc khoa hoc theo 6 phan he nghiep vu va 3 chien luoc luu tru phan tan:

| STT | Ten Collection | Chien luoc Luu tru / Phan manh | Khoa phan manh (Shard Key) | Mo ta Nghiep vu |
| :-- | :--- | :--- | :--- | :--- |
| 01 | `materials` | Unsharded Global Reference | N/A (Primary Shard) | Danh muc vat tu tong the, thong so da hinh |
| 02 | `material_categories` | Unsharded Global Reference | N/A (Primary Shard) | Nhom danh muc vat tu (Co khi, Dien, Hoa chat) |
| 03 | `warehouses` | Unsharded Global Reference | N/A (Primary Shard) | Danh sach tong kho va thong tin vi tri vat ly |
| 04 | `storage_locations` | Location-Based Zone Sharding | `{ warehouse_branch: 1, location_code: 1 }` | So do o ke chi tiet (Aisle, Rack, Bin) |
| 05 | `suppliers` | Unsharded Global Reference | N/A (Primary Shard) | Ho so nha cung cap toan quoc |
| 06 | `purchase_orders` | Location-Based Zone Sharding | `{ warehouse_branch: 1, po_code: 1 }` | Don dat hang mua sam vat tu |
| 07 | `supplier_contracts`| Location-Based Zone Sharding | `{ warehouse_branch: 1, contract_code: 1 }` | Hop dong nguyen tac voi nha cung cap |
| 08 | `supplier_evaluations`| Location-Based Zone Sharding| `{ warehouse_branch: 1, eval_code: 1 }` | Danh gia dinh ky nha cung cap |
| 09 | `inventory_stocks` | Location-Based Zone Sharding | `{ warehouse_branch: 1, material_code: 1 }` | So du ton kho thuc te va nguong an toan |
| 10 | `material_batches` | Location-Based Zone Sharding | `{ warehouse_branch: 1, batch_code: 1 }` | Theo doi han dung, chung chi CO/CQ theo lo |
| 11 | `stocktakes` | Location-Based Zone Sharding | `{ warehouse_branch: 1, stocktake_code: 1 }` | Bien ban kiem ke doi soat dinh ky |
| 12 | `quality_inspections`| Location-Based Zone Sharding| `{ warehouse_branch: 1, inspection_code: 1 }`| Ho so nghiem thu KCS vat tu dau vao |
| 13 | `goods_receipts` | Location-Based Zone Sharding | `{ warehouse_branch: 1, receipt_code: 1 }` | Phieu nhap kho vat tu |
| 14 | `goods_issues` | Location-Based Zone Sharding | `{ warehouse_branch: 1, issue_code: 1 }` | Phieu xuat kho cap phat vat tu |
| 15 | `stock_transfers` | Location-Based Zone Sharding | `{ from_branch: 1, transfer_code: 1 }` | Phieu dieu chuyen vat tu lien Shard (2PC) |
| 16 | `material_returns` | Location-Based Zone Sharding | `{ warehouse_branch: 1, return_code: 1 }` | Phieu thu hoi vat tu thua tu cong trinh |
| 17 | `material_requests`| Location-Based Zone Sharding | `{ warehouse_branch: 1, request_code: 1 }` | Yeu cau cap phat vat tu tu phong ban |
| 18 | `projects_departments`| Unsharded Global Reference | N/A (Primary Shard) | Phong ban, du an va cong trinh su dung |
| 19 | `users` | Unsharded Global Reference | N/A (Primary Shard) | Tai khoan, phan quyen RBAC, mat khau ma hoa |
| 20 | `material_audit_logs`| Hashed Sharding & TTL Index | `{ log_code: "hashed" }` | Nhat ky kiem toan toan he thong, tu huy 30 ngay |

---

## 4. Danh muc Cac Mo dun Chuc nang & Thu muc Ma nguon

He thong gom 21 mo dun duoc chia thanh 3 nhom chinh. Bang duoi day chi ro vi tri thu muc Frontend va Backend cho tung mo dun:

### Nhom A: Nghiep vu Kho Vat tu Phan tan (WMS Business Modules)

| STT | Ten Chuc nang / Man hinh | Dac ta Nghiep vu & Demo CSDLPT | Thu muc Frontend | Thu muc Backend |
| :-- | :--- | :--- | :--- | :--- |
| 01 | Dashboard Overview (`/dashboard`) | Tong quan chi so toan quoc qua Distributed Aggregation Pipeline gom du lieu da Shard | `frontend/src/pages/dashboard` | `backend/src/modules/dashboard` |
| 02 | Danh muc Vat tu (`/materials`) | Lược đồ NoSQL da hinh (Polymorphic Schema), bang tham chieu Global | `frontend/src/pages/materials` | `backend/src/modules/materials` |
| 03 | So do Kho & O ke (`/warehouses`) | Ma tran 36 o ke, Giao dich ACID cap nhat dong thoi o ke, ton kho va nhat ky | `frontend/src/pages/warehouses` | `backend/src/modules/warehouses` |
| 04 | Mua sam & NCC (`/procurement`) | Quan he 1-N giua suppliers va purchase_orders phan manh theo vung | `frontend/src/pages/procurement` | `backend/src/modules/procurement` |
| 05 | Quan tri Ton kho (`/inventory`) | Loc ton kho dinh tuyen theo Compound Shard Key, thiet lap nguong canh bao | `frontend/src/pages/inventory` | `backend/src/modules/inventory` |
| 06 | Phieu Nhap kho (`/goods-receipts`) | Ghi du lieu Shard cuc bo voi Write Concern Majority, tang ton kho kha dung | `frontend/src/pages/goods-receipts` | `backend/src/modules/stock-movements` |
| 07 | Phieu Xuat kho (`/goods-issues`) | Kiem tra rang buoc so du, ngan chan xuat am trong moi truong phan tan | `frontend/src/pages/goods-issues` | `backend/src/modules/stock-movements` |
| 08 | Luan chuyen Kho (`/stock-transfers`) | Giao dich phan tan 2 pha (2PC) Cross-Shard giua Shard HN va Shard HCM | `frontend/src/pages/stock-transfers` | `backend/src/modules/stock-transfers` |
| 09 | Kiem ke Kho (`/stocktakes`) | Doi soat so sach va can doi chenh lech bang giao dich nguyen tu tai cho | `frontend/src/pages/stocktakes` | `backend/src/modules/stocktakes` |
| 10 | Bao cao Phan tan (`/reports`) | Tinh toan dinh gia xuat kho FIFO phan tan doc lap tai tung phan manh | `frontend/src/pages/reports` | `backend/src/modules/reports` |

### Nhom B: Phong Thi nghiem Co so Du lieu Phan tan (Distributed Lab - Super Admin Only)

| STT | Ten Chuc nang / Man hinh | Dac ta Nghiep vu & Demo CSDLPT | Thu muc Frontend | Thu muc Backend |
| :-- | :--- | :--- | :--- | :--- |
| 11 | Cau truc Cum Sharding (`/cluster-topology`) | Truc quan hoa kien truc 4 node: Mongos, Config Server, Shard 1, Shard 2 va Latency | `frontend/src/pages/cluster` (ClusterTopologyPage.tsx) | `backend/src/modules/cluster-demo` |
| 12 | Phan bo Du lieu Shard (`/shard-distribution`) | Thong ke can bang tai Chunk Balancing, so ban ghi va dung luong tren tung Shard | `frontend/src/pages/cluster` (ShardDistributionPage.tsx) | `backend/src/modules/cluster-demo` |
| 13 | Phan tich Explain Plan (`/query-analyzer` Tab 2) | So sanh Targeted Query (SINGLE_SHARD ~2ms) vs Scatter-Gather (SHARD_MERGE ~21ms) | `frontend/src/pages/cluster` (QueryAnalyzerPage.tsx) | `backend/src/modules/cluster-demo` |
| 14 | Toi uu hoa Semi-Join (`/query-analyzer` Tab 1) | Thuat toan Ban ket noi (R <| S): Cat giam >80% dung luong truyen mang va giam tre | `frontend/src/pages/cluster` (QueryAnalyzerPage.tsx) | `backend/src/modules/cluster-demo` |
| 15 | Mo phong Giao dich ACID (`/distributed-transactions`)| Mo phong Commit 2PC thanh cong vs Rollback tu dong khi xay ra su co | `frontend/src/pages/cluster` (DistributedTransactionsPage.tsx) | `backend/src/modules/cluster-demo` |
| 16 | Thuc nghiem Zone Sharding (`/zone-sharding-lab`) | Thu nghiem chen ban ghi kem the vung, kiem chung roi dung Shard 1 hay Shard 2 | `frontend/src/pages/cluster` (ZoneShardingLabPage.tsx) | `backend/src/modules/cluster-demo` |
| 17 | Mo phong Chieu loi HA (`/ha-simulator`) | Gia lap su co sap Primary node, theo doi tien trinh bau cu thu linh theo Raft | `frontend/src/pages/cluster` (HaSimulatorPage.tsx) | `backend/src/modules/cluster-demo` |
| 18 | Nhat ky Kiem toan TTL (`/audit-ttl-explorer`) | Phan manh Hashed Sharding va chi muc Time-To-Live tu dong don rac nhat ky | `frontend/src/pages/cluster` (AuditTtlExplorerPage.tsx) | `backend/src/modules/cluster-demo` |

### Nhom C: Quan tri Nen tang & Phan quyen Da chi nhanh (Administration)

| STT | Ten Chuc nang / Man hinh | Dac ta Nghiep vu & Demo CSDLPT | Thu muc Frontend | Thu muc Backend |
| :-- | :--- | :--- | :--- | :--- |
| 19 | Quan ly Nguoi dung (`/users`) | Quan ly danh sach nguoi dung, ma hoa mat khau bcrypt, phan quyen RBAC | `frontend/src/pages/users` | `backend/src/modules/users` |
| 20 | Cau hinh Chi nhanh (`/branches`) | Thiet lap danh muc chi nhanh vat ly va anh xa Shard Key | `frontend/src/pages/branches` | `backend/src/modules/branches` |
| 21 | Cai dat He thong (`/settings`) | Doi mat khau nguoi dung, thong tin phien lam viec JWT | `frontend/src/pages/settings` | `backend/src/modules/auth` |

---

## 5. Ma tran Phan quyen Truy cap (RBAC Matrix)

He thong ap dung kien truc Role-Based Access Control chat che nham bao ve bien giao tiep va pham vi du lieu:

| Chuc nang / Man hinh | SUPER_ADMIN | BRANCH_MANAGER | WAREHOUSE_STAFF | QC_INSPECTOR | AUDITOR |
| :--- | :---: | :---: | :---: | :---: | :---: |
| Tong quan (Dashboard) | Toan quoc | Chi nhanh chi dinh | Chi nhanh chi dinh | Chi nhanh chi dinh | Toan quoc (Chi doc) |
| Danh muc Vat tu | Toan quyen | Toan quyen | Chi doc | Chi doc | Chi doc |
| So do Kho & O ke | Toan quyen | Chi nhanh | Chi nhanh | Khong co quyen | Chi doc |
| Mua sam & Don dat hang | Toan quyen | Chi nhanh | Khong co quyen | Khong co quyen | Chi doc |
| Quan tri Ton kho | Toan quyen | Chi nhanh | Chi nhanh (Chi doc)| Khong co quyen | Chi doc |
| Nhap kho & Xuat kho | Toan quyen | Phe duyet | Tao & Thao tac | Khong co quyen | Chi doc |
| Luan chuyen Lien Shard | Toan quyen | Kho xuat/nhap | Khong co quyen | Khong co quyen | Chi doc |
| Kiem ke & Can doi | Toan quyen | Phe duyet | Tao phieu dem | Khong co quyen | Chi doc |
| Dinh gia Ton kho FIFO | Toan quyen | Chi doc | Khong co quyen | Khong co quyen | Toan quyen |
| Nghiem thu KCS (QC) | Toan quyen | Chi doc | Khong co quyen | Toan quyen | Chi doc |
| Phong Lab CSDLPT (11-18) | CO QUYEN | DONG HOAN TOAN | DONG HOAN TOAN | DONG HOAN TOAN | DONG HOAN TOAN |
| Quan tri Nguoi dung | CO QUYEN | DONG HOAN TOAN | DONG HOAN TOAN | DONG HOAN TOAN | DONG HOAN TOAN |

---

## 6. Huong dan Cai dat va Khoi chay He thong

### 6.1. Yeu cau Moi truong
- He dieu hanh: Windows 10/11, macOS hoac Linux (Ubuntu 20.04/22.04 LTS).
- Node.js: Phien ban 18.x tro len (Khuyen nghi Node.js 20.x hoac 22.x LTS).
- Trinh quan ly goi: npm 9.x tro len.
- Docker & Docker Compose: Phien ban 20.10+ (neu khoi chay cum Sharded Cluster tren Docker).
- MongoDB Community Server: Ho tro ca MongoDB cuc bo (Standalone Port 27017) lan cum Sharded Cluster.

---

### 6.2. Phuong thuc 1: Khoi dong Nhanh Bang Kich ban 1-Click (Khuyen dung tren Windows)

Thu muc goc du an da tich hop san kich ban tu dong kiem tra va khoi dong:
```cmd
run_all.bat
```
Kich ban thuc hien:
1. Tu dong kiem tra va khoi chay Backend Gateway tai cong 5000 (`http://localhost:5000`).
2. Tu dong kiem tra va khoi chay Frontend Web Application tai cong 3000 (`http://localhost:3000`).
3. Tu dong khoi chay trinh duyet Web mac dinh truy cap truc tiep vao he thong.

De dung he thong sach se:
```cmd
stop_all.bat
```

---

### 6.3. Phuong thuc 2: Trien khai Cum Docker MongoDB Sharded Cluster Day du

Doi voi moi truong co cai dat Docker Desktop:

#### Buoc 1: Khoi dong 4 Container Dich vu
```powershell
cd docker
docker-compose up -d
```
Cac container khoi chay:
- `vattu-configsvr`: Config Server Replica Set (Port 27019)
- `vattu-shard1`: Shard 1 Replica Set - Vung Ha Noi (Port 27018)
- `vattu-shard2`: Shard 2 Replica Set - Vung TP.HCM (Port 27020)
- `vattu-mongos`: Mongos Query Router tap trung (Port 27017)

#### Buoc 2: Khoi tao Replica Sets va Nap Shard vao Router
```powershell
# Chay kich ban khoi tao cum tren Windows
.\init-cluster.bat
# Hoac tren PowerShell
.\init-cluster.ps1
```

#### Buoc 3: Nap Du lieu va Cau hinh Zone Sharding
```bash
cd ../scripts
mongosh "mongodb://localhost:27017" < 01_init_schema_and_indexes.js
mongosh "mongodb://localhost:27017" < 02_seed_data.js
mongosh "mongodb://localhost:27017" < 03_setup_sharding.js
```

---

### 6.4. Phuong thuc 3: Cai dat va Chay Tung Thanh phan bang Dong lenh

#### Khoi dong Backend API Gateway:
```bash
cd backend
npm install
npm run build
npm run start:dev
```
- API Endpoint: `http://localhost:5000/api/v1`
- Swagger Documentation: `http://localhost:5000/docs`

#### Khoi dong Frontend Web Application:
```bash
cd frontend
npm install
npm run dev
```
- Web Application: `http://localhost:3000`

---

### 6.5. Huong dan Chia se Nhieu may Cung truy cap (Mang LAN hoac Cloudflare Tunnel)

He thong da duoc cau hinh san `host: true`, `allowedHosts: true` tai [frontend/vite.config.ts](frontend/vite.config.ts) va duong dan API tuong doi `/api/v1` tai [frontend/src/lib/api.ts](frontend/src/lib/api.ts):

1. **Truy cap qua mang Wi-Fi / LAN noi bo**:
   - May chu (May chay `run_all.bat`): Kiem tra dia chi IP bang lenh `ipconfig` (vi du: `192.168.1.15`).
   - May thanh vien khac trong mang: Mo trinh duyet truy cap `http://192.168.1.15:3000`.
   - He thong tu dong nhan dien va dinh tuyen API ve backend may chu khong bi loi CORS.

2. **Truy cap tu xa qua Cloudflare Tunnel (Khong can mo port Router)**:
   ```cmd
   cloudflared tunnel --url http://localhost:3000
   ```
   Chia se duong link `https://xxx.trycloudflare.com` do Cloudflare cap cho tat ca thanh vien de dang nhap dong thoi tu xa.

---

## 7. Danh sach Tai khoan Kiem thu Mau (Seeded Demo Accounts)

He thong nhat quan su dung danh sach 5 tai khoan mac dinh dai dien cho cac vi tri nghiep vu:

| Vai tro (Role) | Email Dang nhap | Mat khau Mac dinh | Pham vi / Shard Du lieu |
| :--- | :--- | :--- | :--- |
| **Super Admin** | `admin@wms.enterprise.vn` | `Admin@Distributed2026` | Toan quyen he thong, xem tat ca Shard, truy cap Lab CSDLPT |
| **Quan ly Kho Mien Bac** | `manager.hn@wms.enterprise.vn` | `Wms@123456` | Tong kho Ha Noi (Chi truy van du lieu tren Shard 1 / ZONE_HN) |
| **Quan ly Kho Mien Nam** | `manager.hcm@wms.enterprise.vn` | `Wms@123456` | Tong kho TP.HCM (Chi truy van du lieu tren Shard 2 / ZONE_HCM)|
| **Kiem dinh KCS (QC)** | `qc.lead@wms.enterprise.vn` | `Wms@123456` | Nghiem thu chat luong lo vat tu, lap bien ban KCS |
| **Kiem toan vien** | `auditor@wms.enterprise.vn` | `Wms@123456` | Doc bao cao ton kho FIFO va tra cuu nhat ky material_audit_logs|

---

## 8. Tai lieu Nghiep vu & Huong dan Demo Chi tiet

De xem huong dan chi tiet tung buoc thao tac thuc hanh, y nghia hoc thuat cua tung tinh nang va kich ban thuyet trinh mau truoc Hoi dong bao ve, vui long tham khao file:
- **Tài liệu hướng dẫn demo và cấu trúc mô đun**: [HUONG_DAN_DEMO_VA_CAU_TRUC_MODULES.txt](HUONG_DAN_DEMO_VA_CAU_TRUC_MODULES.txt)
- **Báo cáo học thuật chi tiết Word (55 trang)**: Duoc luu tru doc lap tai thu muc `bao_cao/` (da duoc bo tri trong `.gitignore` de tranh commit len kho ma nguon).

---

## 9. Thong tin Nhom Thuc hien

- **De tai**: He thong Quan tri va Dieu phoi Vat tu Doanh nghiep Phan tan tren nen tang MongoDB Sharded Cluster.
- **Hoc phan**: Co so du lieu phan tan (CSDLPT).
- **Don vi**: Khoa Cong nghe Thong tin 1 - Hoc vien Cong nghe Buu chinh Vien thong (PTIT).
- **So thu tu nhom**: Nhom 01.
