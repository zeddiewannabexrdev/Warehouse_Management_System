---
name: Distributed WMS & MongoDB Sharded Cluster Monitor
description: Enterprise High-Density Operating Console (Linear / Datadog / Vercel style)
colors:
  primary: "#1b3f65"
  primary-hover: "#153150"
  accent-blue: "#2563eb"
  accent-blue-hover: "#1d4ed8"
  neutral-bg: "#f8fafc"
  surface-card: "#ffffff"
  surface-muted: "#f1f5f9"
  border-subtle: "#e2e8f0"
  border-strong: "#cbd5e1"
  text-primary: "#0f172a"
  text-secondary: "#475569"
  text-muted: "#64748b"
  status-success: "#16a34a"
  status-success-bg: "#f0fdf4"
  status-warning: "#d97706"
  status-warning-bg: "#fffbeb"
  status-danger: "#dc2626"
  status-danger-bg: "#fef2f2"
typography:
  display:
    fontFamily: "Inter, system-ui, -apple-system, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 700
    lineHeight: 1.25
  heading:
    fontFamily: "Inter, system-ui, -apple-system, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 600
    lineHeight: 1.3
  body:
    fontFamily: "Inter, system-ui, -apple-system, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 400
    lineHeight: 1.4
  body-dense:
    fontFamily: "Inter, system-ui, -apple-system, sans-serif"
    fontSize: "0.6875rem"
    fontWeight: 400
    lineHeight: 1.35
  mono:
    fontFamily: "JetBrains Mono, Consolas, Monaco, monospace"
    fontSize: "0.6875rem"
    fontWeight: 500
    lineHeight: 1.4
rounded:
  none: "0px"
  sm: "4px"
  md: "6px"
  lg: "8px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "20px"
components:
  button-primary:
    backgroundColor: "{colors.accent-blue}"
    textColor: "#ffffff"
    rounded: "{rounded.md}"
    padding: "5px 12px"
  button-secondary:
    backgroundColor: "{colors.surface-card}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.md}"
    padding: "5px 12px"
  table-row:
    height: "34px"
    padding: "0 12px"
    borderBottom: "1px solid {colors.border-subtle}"
---

## Overview

Hệ thống **Distributed WMS & MongoDB Sharded Cluster Monitor** được xây dựng theo phong cách **Operate Mode** (Bảng điều khiển tác nghiệp doanh nghiệp mật độ dữ liệu cao - High-Density Data Console), lấy cảm hứng trực tiếp từ ngôn ngữ thiết kế của **Linear, Datadog và Vercel Dashboard**:
- **Trọng tâm là dữ liệu**: Tối đa hóa tỷ lệ dữ liệu hữu ích trên diện tích màn hình (Data-to-Pixel Ratio). Mọi con số, trạng thái Shard, số dư kho và câu lệnh Explain Plan đều có thể quan sát tức thì mà không phải cuộn chuột dài dòng.
- **Tối giản & Kỹ trị (Utilitarian & Precise)**: Khung viền sắc nét 1px, độ dày bo góc kiểm soát ở 4px–6px, loại bỏ hoàn toàn các bóng đổ mờ ảo (drop-shadow), banner gradient sặc sỡ và card lồng trong card.

---

## Colors

Hệ thống sử dụng bảng màu **Light / Clean Slate** trung tính với độ tương phản cao đạt chuẩn WCAG AA:

### 1. Bề mặt & Khung viền (Surfaces & Borders)
* **Nền trang chính (Canvas Background)**: `#f8fafc` (Slate 50 — sắc thái trắng xám rất nhạt, giảm mỏi mắt khi quan sát liên tục).
* **Khung chứa nội dung (Container / Card Surface)**: `#ffffff` (Pure White).
* **Vùng phụ & Header bảng (Muted Surface)**: `#f1f5f9` (Slate 100).
* **Viền ngăn cách chuẩn (Subtle Border)**: `1px solid #e2e8f0` (Slate 200 — đường kẻ mảnh sắc sảo 1px ngăn các phân khu dữ liệu).
* **Viền nhấn mạnh (Strong Border)**: `1px solid #cbd5e1` (Slate 300 — dùng cho ô nhập liệu focus hoặc thanh công cụ).

### 2. Văn bản (Text Hierarchy)
* **Tiêu đề & Số liệu chính**: `#0f172a` (Slate 900 — đậm, tương phản tối đa).
* **Nhãn dữ liệu & Nội dung chính**: `#475569` (Slate 600).
* **Chú thích kỹ thuật & Metainfo**: `#64748b` (Slate 500).

### 3. Màu điểm nhấn & Trạng thái phân tán (Telemetry Accents)
* **Action Accent**: `#2563eb` (Blue 600 — dùng cho nút hành động chính, tab đang chọn, link điều hướng).
* **Shard 1 / Node Sức khỏe tốt**: `#16a34a` (Emerald 600), nền nhạt `#f0fdf4`.
* **Cảnh báo / Tồn kho tới hạn / Chậm trễ**: `#d97706` (Amber 600), nền nhạt `#fffbeb`.
* **Sự cố Shard / Dưới mức an toàn / Lỗi**: `#dc2626` (Red 600), nền nhạt `#fef2f2`.

---

## Typography

Hệ thống áp dụng phân tách nghiêm ngặt giữa hai hệ phông chữ theo đúng đặc thù kỹ thuật:

### 1. Sans-serif (Inter) — Toàn bộ giao diện & nhãn tiếng Việt
* Sử dụng bộ font **Inter** (`Inter, system-ui, -apple-system, sans-serif`) tối ưu hóa cho màn hình máy tính với độ cao chữ x-height lớn, giúp các chữ tiếng Việt có dấu luôn rõ ràng ở kích thước nhỏ (11px–12px).
* **Page Header**: 16px–18px (`text-base` đến `text-lg`), `font-bold`, tracking hẹp (`tracking-tight`).
* **Section Heading**: 13px–14px (`text-xs` đến `text-sm`), `font-semibold`.
* **Table & Body Text**: 11px–12px (`text-[11px]` đến `text-xs`), `font-normal`.

### 2. Monospace (JetBrains Mono) — Bắt buộc cho đối tượng kỹ thuật
Bắt buộc áp dụng phông chữ đơn cách **JetBrains Mono** (`JetBrains Mono, Consolas, Monaco, monospace`) cùng thuộc tính `tabular-nums` cho các trường:
* **Mã nghiệp vụ**: Mã vật tư (`MAT-STEEL-D20`), Mã phiếu (`GR-HN-001`, `GI-HCM-002`), Mã lô, Mã log.
* **Hạ tầng phân tán**: Địa chỉ IP, Cổng kết nối (`Port 27017`, `27018`, `27020`), Shard ID (`shard1ReplSet`, `ZONE_HN`).
* **Số liệu đo đạc & Viễn trắc**: Số lượng tồn kho, giá trị tiền tệ, thời gian phản hồi latency (`1ms`, `24ms`), số bản ghi `docsExamined`.
* **Mệnh đề truy vấn**: Shard Key, Stage Aggregation (`SINGLE_SHARD`, `SHARD_MERGE`), JSON Payload.

---

## Layout

* **Mật độ hiển thị cao (High-Density Grid)**: Tối ưu cho màn hình tiêu chuẩn 1366x768 và 1920x1080.
* **Cấu trúc phẳng liền mạch (Border-separated Flat Layout)**:
  * Không dùng card xếp lớp. Các panel dữ liệu tiếp giáp nhau qua đường viền 1px (`border-slate-200`).
  * Chiều cao hàng dữ liệu trong bảng: **32px – 36px** (`py-2` hoặc `py-1.5`), giúp hiển thị được 15–20 dòng dữ liệu ngay trên màn hình đầu tiên.
  * Khoảng cách giữa các khối (Gap): giới hạn ở **12px – 16px** (`gap-3` hoặc `gap-4`, `space-y-4`), triệt tiêu các khoảng trống 24px–32px lãng phí.
* **Thanh viễn trắc 1 hàng (Metric Telemetry Strip)**: Thay thế lưới 6 card vuông phồng bằng một dải băng số liệu ngang cao đúng 44px–48px, các chỉ số ngăn cách nhau bằng đường kẻ đứng `border-r border-slate-200`.

---

## Elevation & Depth

* **Không dùng Drop-Shadow dày**: Tuyệt đối cấm các lớp bóng đổ mờ rộng (`shadow-lg`, `shadow-xl`, `shadow-2xl`) gây cảm giác bồng bềnh và phân tâm thị giác.
* **Phân lớp hoàn toàn bằng viền (Border-only Separation)**: Dùng viền 1px `#e2e8f0` trên nền `#ffffff`.
* **Hiệu ứng nổi duy nhất cho Modal & Dropdown**: Chỉ sử dụng bóng đổ kỹ thuật siêu mỏng `shadow-xs` hoặc `shadow-sm` khi mở popover/dropdown nổi trên bề mặt bảng.

---

## Shapes

* **Bán kính bo góc toàn cục (Border Radius)**:
  * Khung container, panel dữ liệu, bảng: **6px** (`rounded-md`).
  * Nút bấm, ô nhập input, dropdown select: **4px – 6px** (`rounded` hoặc `rounded-md`).
  * Badge trạng thái kỹ thuật: **3px – 4px** (`rounded-sm`).
  * **Tuyệt đối cấm**: `rounded-xl` (12px), `rounded-2xl` (16px) và `rounded-3xl`.

---

## Components

### 1. Nút bấm (Buttons)
* **Primary**: Nền xanh đậm `#2563eb`, chữ trắng, bo góc 6px, padding `px-3 py-1.5`, cỡ chữ 12px font-semibold. Không gradient, không bóng mờ.
* **Secondary**: Nền trắng `#ffffff`, viền `1px solid #e2e8f0`, hover `#f8fafc`, chữ `#334155`.
* **Compact / Action Icon**: Nút icon nhỏ 28x28px viền 1px, tối ưu thao tác nhanh trên từng hàng dữ liệu.

### 2. Bảng dữ liệu (High-Density Data Tables)
* Header: Nền `#f8fafc` hoặc `#f1f5f9`, chữ hoa xám đậm `#475569`, cỡ chữ 11px font-medium, viền dưới `1px solid #e2e8f0`.
* Body Row: Cao 34px, hover chuyển màu nhạt `#f8fafc`, font số liệu JetBrains Mono căn phải (`text-right tabular-nums`).

### 3. Huy hiệu viễn trắc (Status Indicators & Badges)
* Dạng nhãn phẳng kỹ thuật: Chiều cao 18px–20px, viền 1px mảnh, padding `px-2 py-0.5`, font chữ JetBrains Mono 10px–11px đậm.
* Không dùng chấm tròn nhấp nháy (pulsing dot) liên tục nếu trạng thái bình thường; chỉ dùng điểm màu khi có cảnh báo khẩn cấp.

---

## Do's and Don'ts (Bộ Quy Tắc Chống "AI Slop")

### CẤM (Don'ts):
- ❌ **CẤM Nested Cards (Card lồng trong card)**: Không bao giờ bọc một thẻ card bên trong một thẻ card khác có viền và nền riêng biệt. Phân chia nội dung bằng đường kẻ `border-t` hoặc `border-r`.
- ❌ **CẤM Lưới KPI rỗng nhiều màu**: Không chia lưới 4 đến 6 ô card vuông to chỉ để chứa 1 con số và 1 icon trang trí. Gom số liệu vào thanh ngang liền mạch.
- ❌ **CẤM Banner thông báo chói toàn chiều ngang**: Không dùng các dải banner màu xanh lục/đỏ rực rỡ chiếm trọn chiều ngang màn hình. Thông báo trạng thái phải là thanh thông tin tinh tế hoặc status bar nhỏ gọn.
- ❌ **CẤM Icon trang trí lặp lại**: Không chèn icon chỉ để "cho có" (như đặt icon chiếc xe tải bên cạnh chữ xe tải, icon kho bên cạnh chữ kho). Icon chỉ dùng khi có tác dụng làm mốc nhận diện trực quan nhanh hoặc nút bấm hành động.
- ❌ **CẤM Font chữ trang trí hoặc Gradient nền**: Không dùng gradient tím/hồng, không dùng bóng mờ giả 3D, không dùng kicker/eyebrow in hoa thừa thãi trên tiêu đề.

### NÊN (Do's):
- ✅ **Ưu tiên bảng và danh sách đặc (Data Density)**: Đưa bảng dữ liệu và số liệu lên vị trí đầu tiên của viewport.
- ✅ **Giữ typography đơn sắc sắc nét**: Nhãn tiếng Việt bằng Inter, thông số kỹ thuật và số lượng bằng JetBrains Mono.
- ✅ **Phân tách bằng viền 1px sắc sảo**: Mọi thành phần đều nằm trên mặt phẳng kỷ luật, tạo cảm giác một thiết bị đo đạc tin cậy.
- ✅ **Luôn hiển thị ngữ cảnh Shard**: Mọi bảng và phiếu xuất nhập đều phải cho biết dữ liệu đang lưu tại Shard 1 (Hà Nội) hay Shard 2 (TP.HCM).
