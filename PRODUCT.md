# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Hệ thống phục vụ 5 nhóm người dùng nghiệp vụ và giám sát kỹ thuật chuyên trách:
1. **Super Admin**: Quản trị viên hạ tầng toàn quốc, giám sát sức khỏe cụm MongoDB Sharded Cluster (Router 27017, Shard 1 Hà Nội 27018, Shard 2 TP.HCM 27020, Config Server 27019), điều phối cân bằng Chunk và quản lý định tuyến phân tán.
2. **Thủ kho Miền Bắc (Manager HN)**: Tác nghiệp trực tiếp trên Shard 1 (ZONE_HN), quản lý nhập - xuất - điều chuyển vật tư tại kho Long Biên, kiểm soát định mức an toàn cục bộ.
3. **Thủ kho Miền Nam (Manager HCM)**: Tác nghiệp trực tiếp trên Shard 2 (ZONE_HCM), quản lý nhập - xuất tại kho Cát Lái và tiếp nhận hàng hóa điều chuyển liên vùng từ phía Bắc.
4. **Trưởng KCS / Kiểm định chất lượng (QC Inspector)**: Kiểm soát chất lượng vật tư đầu vào, thẩm định hồ sơ nguồn gốc xuất xứ CO/CQ, xử lý hàng lỗi thu hồi từ công trường.
5. **Kiểm toán viên (Auditor)**: Giám sát toàn vẹn số liệu kho toàn quốc (Read-only All Shards), kiểm soát bút toán cân đối đối soát (ACID 2PC) và theo dõi định giá tài sản kho theo phương pháp FIFO.

## Product Purpose

Cung cấp một giải pháp phần mềm quản trị và điều phối kho vật tư doanh nghiệp quy mô lớn (Distributed WMS) kết hợp trung tâm điều khiển giám sát cụm cơ sở dữ liệu phân tán (MongoDB Sharded Cluster Monitor). Sản phẩm giải quyết bài toán:
- Tối ưu hóa độ trễ truy vấn và tính độc lập dữ liệu theo vùng địa lý (Data Locality via Zone Sharding).
- Đảm bảo tính nhất quán và toàn vẹn dữ liệu xuyên Shard khi điều chuyển kho qua giao dịch phân tán Two-Phase Commit (2PC).
- Trực quan hóa chi phí thực thi truy vấn (Targeted Query vs Scatter-Gather Query) và quản lý vòng đời dữ liệu kiểm toán qua TTL Index.

## Positioning

Khác với các hệ thống WMS thương mại thông thường coi database là hộp đen (black-box), hệ thống này tích hợp song song cả tầng **Nghiệp vụ kho bãi thực tế (Business WMS)** và tầng **Quan sát - Đo đạc phân tán (Distributed Telemetry & Cluster Lab)**:
- Người dùng vừa thực hiện các thao tác kho (nhập, xuất, điều chuyển, kiểm kê, định giá).
- Vừa có thể "mổ xẻ" trực tiếp cơ chế phân mảnh, vị trí lưu trữ vật lý của từng bản ghi trên Shard 1 hay Shard 2, và phân tích Explain Plan định tuyến theo thời gian thực.

## Operating Context

- **Chế độ bề mặt (Surface Mode)**: `Operate` — Công cụ tác nghiệp điều hành kỹ thuật, đòi hỏi tốc độ quét mắt cao, số liệu chính xác tức thời và hạn chế thao tác thừa.
- **Phong cách thị giác (Visual Language)**: Kỹ thuật, tối giản, mật độ thông tin cao (high-density) lấy cảm hứng từ Datadog, Linear và Vercel:
  - Bảng dữ liệu compact siêu đặc (Row height 32–36px, viền 1px crisp mỏng, giảm triệt để padding rườm rà).
  - Tối đa hóa diện tích hiển thị, hạn chế tối đa card bo tròn lớn (giới hạn border-radius ở 4px–6px).
  - Bảng màu Light / Clean Slate với viền xám tinh tế `#e2e8f0`, điểm nhấn kỹ thuật sắc nét, độ tương phản cao đạt chuẩn WCAG AA.
  - Phông chữ giao diện Arial kết hợp font monospace hiển thị mã vật tư, địa chỉ IP/Port và Shard Key.

## Capabilities and Constraints

### Chức năng nghiệp vụ kho (Modules 01 - 10)
- Quản lý danh mục vật tư tập trung (Global Reference Data - Unsharded).
- Bản đồ mặt bằng ô kệ 2D kho Hà Nội và kho TP.HCM.
- Quản lý nhà cung cấp và chuỗi mua sắm (Procurement).
- Tồn kho phân mảnh theo vùng `{ warehouse_branch: 1, material_code: 1 }`.
- Phiếu nhập kho (Goods Receipts) và Phiếu xuất kho (Goods Issues) với cơ chế bảo vệ chống âm kho nguyên tử (`$gte`).
- Điều chuyển liên kho bảo đảm giao dịch phân tán Two-Phase Commit (2PC).
- Kiểm kê định kỳ và lập bút toán cân đối đối soát ACID.
- Báo cáo phân tích và định giá tồn kho phân tán (FIFO & Weighted Average).

### Chức năng thực nghiệm phân tán (Modules 11 - 15)
- Giám sát cấu trúc cụm (Cluster Topology & Node Health).
- Bản đồ phân bổ Shard Data & quản lý Chunk Migration.
- Bộ phân tích định tuyến truy vấn (Query Routing & Execution Plan Analyzer).
- Giả lập cơ chế chịu lỗi và sẵn sàng cao (High Availability Failover Simulator).
- Khám phá nhật ký kiểm toán và vòng đời dữ liệu phân tán (Audit Trail & TTL Index Explorer).

### Ràng buộc kỹ thuật
- Frontend: React 18, Vite, TypeScript, Tailwind CSS, Recharts, Lucide Icons.
- Backend: NestJS, MongoDB Native Driver, JWT RBAC Guard.
- Cơ sở dữ liệu: MongoDB Sharded Cluster (Router 27017, Shard 1 27018, Shard 2 27020, Config Server 27019).
- Chuẩn giao diện: Phông chữ Arial (`Arial, "Helvetica Neue", Helvetica, sans-serif`), không sử dụng font trang trí hay gradient hoa mỹ.

## Brand Commitments

- **Tên sản phẩm**: Distributed WMS & MongoDB Sharded Cluster Monitor.
- **Tông giọng (Voice)**: Kỹ thuật, chuẩn xác, tin cậy, súc tích, mang đậm tính công nghiệp và kỹ trị.
- **Quy chuẩn hiển thị**: Không kicker/eyebrow thừa trên tiêu đề; không banner gradient hoa mỹ kiểu AI slop; giữ các đường kẻ phân tách rõ ràng và màu trạng thái chuẩn (`emerald-600` cho hoạt động tốt, `rose-600` cho cảnh báo, `blue-600` cho điều hướng).

## Evidence on Hand

- Toàn bộ 15 modules nghiệp vụ và demo kỹ thuật đã được cài đặt mã nguồn đầy đủ cả Frontend lẫn Backend.
- Database `material_inventory_db` chứa 22 collections dữ liệu thực tế đang hoạt động trên MongoDB.
- Tài liệu hướng dẫn sử dụng và kiểm thử toàn diện đã được lưu trữ cục bộ tại file `HUONG_DAN_SU_DUNG_VA_KIEM_THU_TOAN_BO_MODULES.docx`.

## Product Principles

1. **Mật độ thông tin là ưu tiên số một (Density over Decoration)**: Mỗi pixel trên màn hình phải phục vụ cho việc quan sát dữ liệu hoặc thao tác nghiệp vụ; loại bỏ hoàn toàn các khoảng trắng vô nghĩa, bo góc quá mức và đồ họa trang trí thừa.
2. **Minh bạch cơ chế phân tán (Expose the Infrastructure)**: Mọi thao tác kho đều phải phản ánh rõ rệt vị trí lưu trữ vật lý trên Shard nào và chi phí định tuyến của truy vấn đó là bao nhiêu.
3. **An toàn và Bất biến dữ liệu (Atomic & Audit-First)**: Không cho phép hành động xuất âm kho; mọi biến động số dư kho đều phải để lại dấu vết kiểm toán có thời hạn lưu trữ rõ ràng (TTL Index).
4. **Nhất quán theo vai trò (Role-Centric Experience)**: Mỗi vai trò chỉ tập trung vào nghiệp vụ và phạm vi Shard của mình, giúp người dùng xử lý công việc nhanh nhất mà không bị phân tâm bởi các thông tin ngoài phạm vi.
