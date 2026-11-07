/**
 * 01_init_schema_and_indexes.js
 * Script khởi tạo Schema Base với JSON Schema Validation & Chỉ mục (Indexes)
 * Hệ thống Quản trị & Điều phối Vật tư Doanh nghiệp Phân tán (Distributed Materials & Warehouse Management System - WMS)
 * Bao gồm đầy đủ 20 COLLECTIONS chuẩn chuỗi cung ứng và quản lý kho bãi đa chi nhánh
 * Chạy trên mongosh: mongosh material_inventory_db < 01_init_schema_and_indexes.js
 */

const dbName = "material_inventory_db";
const dbInstance = db.getSiblingDB(dbName);

print(`======================================================================`);
print(`[1/3] Đang khởi tạo Database & Cấu hình JSON Schema cho 20 Collections...`);
print(`======================================================================`);

// Helper tạo collection kèm Validator
function createValidatedCollection(colName, validatorSchema) {
  const existing = dbInstance.getCollectionNames();
  if (existing.includes(colName)) {
    print(`- Cập nhật validator cho collection: ${colName}`);
    dbInstance.runCommand({
      collMod: colName,
      validator: { $jsonSchema: validatorSchema },
      validationLevel: "moderate"
    });
  } else {
    print(`- Tạo mới collection: ${colName}`);
    dbInstance.createCollection(colName, {
      validator: { $jsonSchema: validatorSchema },
      validationLevel: "moderate"
    });
  }
}

// -------------------------------------------------------------
// NHÓM 1: DANH MỤC VẬT TƯ & CƠ SỞ KHO BÃI (4 Collections)
// -------------------------------------------------------------

// 1. MATERIALS (Danh mục Vật tư - Lược đồ Đa hình Polymorphic Schema)
createValidatedCollection("materials", {
  bsonType: "object",
  required: ["material_code", "name", "category_code", "unit", "specifications"],
  properties: {
    material_code: { bsonType: "string" },
    name: { bsonType: "string" },
    category_code: { bsonType: "string" },
    unit: { bsonType: "string" },
    description: { bsonType: "string" },
    specifications: { bsonType: "object" },
    standard_price: { bsonType: ["double", "int", "long"] },
    barcode: { bsonType: ["string", "null"] },
    is_active: { bsonType: "bool" }
  }
});

// 2. MATERIAL_CATEGORIES (Nhóm / Phân loại Vật tư)
createValidatedCollection("material_categories", {
  bsonType: "object",
  required: ["category_code", "name", "storage_condition"],
  properties: {
    category_code: { bsonType: "string" },
    name: { bsonType: "string" },
    description: { bsonType: "string" },
    storage_condition: { enum: ["NORMAL", "COLD_STORAGE", "HAZARDOUS", "DRY_VENTILATED"] }
  }
});

// 3. WAREHOUSES (Danh mục Kho bãi theo Chi nhánh Vùng miền)
createValidatedCollection("warehouses", {
  bsonType: "object",
  required: ["warehouse_code", "name", "branch", "address", "manager"],
  properties: {
    warehouse_code: { bsonType: "string" },
    name: { bsonType: "string" },
    branch: { enum: ["HN", "HCM", "DN"] },
    address: { bsonType: "string" },
    manager: { bsonType: "string" },
    capacity_sqm: { bsonType: ["int", "double"] },
    is_active: { bsonType: "bool" }
  }
});

// 4. STORAGE_LOCATIONS (Vị trí lưu trữ: Dãy, Kệ, Ngăn trong Kho)
createValidatedCollection("storage_locations", {
  bsonType: "object",
  required: ["location_code", "warehouse_code", "aisle", "rack", "bin"],
  properties: {
    location_code: { bsonType: "string" },
    warehouse_code: { bsonType: "string" },
    aisle: { bsonType: "string" },
    rack: { bsonType: "int" },
    bin: { bsonType: "int" },
    max_weight_kg: { bsonType: ["int", "double"] },
    is_occupied: { bsonType: "bool" }
  }
});

// -------------------------------------------------------------
// NHÓM 2: ĐỐI TÁC CUNG ỨNG & MUA HÀNG (4 Collections)
// -------------------------------------------------------------

// 5. SUPPLIERS (Nhà cung cấp Vật tư)
createValidatedCollection("suppliers", {
  bsonType: "object",
  required: ["supplier_code", "company_name", "tax_id", "phone", "email"],
  properties: {
    supplier_code: { bsonType: "string" },
    company_name: { bsonType: "string" },
    tax_id: { bsonType: "string", pattern: "^[0-9]{10,13}$" },
    phone: { bsonType: "string" },
    email: { bsonType: "string" },
    address: { bsonType: "string" },
    rating_score: { bsonType: ["double", "int"] }
  }
});

// 6. PURCHASE_ORDERS (Đơn đặt mua vật tư từ Nhà cung cấp)
createValidatedCollection("purchase_orders", {
  bsonType: "object",
  required: ["po_code", "supplier_id", "warehouse_branch", "order_date", "total_amount", "status"],
  properties: {
    po_code: { bsonType: "string" },
    supplier_id: { bsonType: "objectId" },
    warehouse_branch: { enum: ["HN", "HCM", "DN"] },
    order_date: { bsonType: "date" },
    expected_delivery_date: { bsonType: "date" },
    total_amount: { bsonType: ["double", "int", "long"] },
    items: { bsonType: "array" },
    status: { enum: ["DRAFT", "APPROVED", "DELIVERED", "CANCELLED"] }
  }
});

// 7. SUPPLIER_CONTRACTS (Hợp đồng nguyên tắc cung ứng)
createValidatedCollection("supplier_contracts", {
  bsonType: "object",
  required: ["contract_code", "supplier_id", "start_date", "end_date", "status"],
  properties: {
    contract_code: { bsonType: "string" },
    supplier_id: { bsonType: "objectId" },
    start_date: { bsonType: "date" },
    end_date: { bsonType: "date" },
    contract_value: { bsonType: ["double", "int", "long"] },
    payment_terms: { bsonType: "string" },
    status: { enum: ["ACTIVE", "EXPIRED", "TERMINATED"] }
  }
});

// 8. SUPPLIER_EVALUATIONS (Đánh giá hiệu suất Nhà cung cấp SLA)
createValidatedCollection("supplier_evaluations", {
  bsonType: "object",
  required: ["supplier_id", "period", "quality_score", "delivery_score", "overall_score"],
  properties: {
    supplier_id: { bsonType: "objectId" },
    period: { bsonType: "string" },
    quality_score: { bsonType: ["double", "int"], minimum: 0, maximum: 100 },
    delivery_score: { bsonType: ["double", "int"], minimum: 0, maximum: 100 },
    overall_score: { bsonType: ["double", "int"], minimum: 0, maximum: 100 },
    comments: { bsonType: "string" },
    evaluated_at: { bsonType: "date" }
  }
});

// -------------------------------------------------------------
// NHÓM 3: GIAO DỊCH NHẬP - XUẤT - ĐIỀU CHUYỂN (Sharded - 4 Collections)
// -------------------------------------------------------------

// 9. GOODS_RECEIPTS ⭐ (Phiếu Nhập kho Vật tư - Sharded Collection)
createValidatedCollection("goods_receipts", {
  bsonType: "object",
  required: ["receipt_code", "warehouse_branch", "warehouse_code", "receipt_date", "items", "total_amount", "status"],
  properties: {
    receipt_code: { bsonType: "string" },
    warehouse_branch: { enum: ["HN", "HCM", "DN"] },
    warehouse_code: { bsonType: "string" },
    supplier_id: { bsonType: ["objectId", "null"] },
    po_code: { bsonType: ["string", "null"] },
    receipt_date: { bsonType: "date" },
    items: {
      bsonType: "array",
      minItems: 1,
      items: {
        bsonType: "object",
        required: ["material_code", "quantity", "unit_price", "amount"],
        properties: {
          material_code: { bsonType: "string" },
          batch_number: { bsonType: "string" },
          quantity: { bsonType: ["int", "double"] },
          unit_price: { bsonType: ["int", "double", "long"] },
          amount: { bsonType: ["int", "double", "long"] }
        }
      }
    },
    total_amount: { bsonType: ["int", "double", "long"] },
    receiver: { bsonType: "string" },
    status: { enum: ["PENDING", "COMPLETED", "REJECTED"] }
  }
});

// 10. GOODS_ISSUES ⭐ (Phiếu Xuất kho Vật tư - Sharded Collection)
createValidatedCollection("goods_issues", {
  bsonType: "object",
  required: ["issue_code", "warehouse_branch", "warehouse_code", "issue_date", "items", "purpose", "status"],
  properties: {
    issue_code: { bsonType: "string" },
    warehouse_branch: { enum: ["HN", "HCM", "DN"] },
    warehouse_code: { bsonType: "string" },
    project_id: { bsonType: ["objectId", "null"] },
    request_code: { bsonType: ["string", "null"] },
    issue_date: { bsonType: "date" },
    items: {
      bsonType: "array",
      minItems: 1,
      items: {
        bsonType: "object",
        required: ["material_code", "quantity"],
        properties: {
          material_code: { bsonType: "string" },
          batch_number: { bsonType: "string" },
          quantity: { bsonType: ["int", "double"] }
        }
      }
    },
    purpose: { bsonType: "string" },
    issuer: { bsonType: "string" },
    recipient: { bsonType: "string" },
    status: { enum: ["APPROVED", "DISPATCHED", "DELIVERED", "CANCELLED"] }
  }
});

// 11. STOCK_TRANSFERS (Phiếu Điều chuyển Vật tư Liên kho Giữa các Miền)
createValidatedCollection("stock_transfers", {
  bsonType: "object",
  required: ["transfer_code", "from_branch", "to_branch", "from_warehouse", "to_warehouse", "items", "status"],
  properties: {
    transfer_code: { bsonType: "string" },
    from_branch: { enum: ["HN", "HCM", "DN"] },
    to_branch: { enum: ["HN", "HCM", "DN"] },
    from_warehouse: { bsonType: "string" },
    to_warehouse: { bsonType: "string" },
    transfer_date: { bsonType: "date" },
    items: { bsonType: "array" },
    transport_method: { bsonType: "string" },
    status: { enum: ["IN_TRANSIT", "RECEIVED", "CANCELLED"] }
  }
});

// 12. MATERIAL_RETURNS (Phiếu Hoàn trả Vật tư Thừa / Hư hỏng từ Công trình)
createValidatedCollection("material_returns", {
  bsonType: "object",
  required: ["return_code", "warehouse_branch", "warehouse_code", "return_date", "items", "reason"],
  properties: {
    return_code: { bsonType: "string" },
    warehouse_branch: { enum: ["HN", "HCM", "DN"] },
    warehouse_code: { bsonType: "string" },
    project_id: { bsonType: ["objectId", "null"] },
    return_date: { bsonType: "date" },
    items: { bsonType: "array" },
    reason: { enum: ["EXCESS_MATERIAL", "DEFECTIVE", "WRONG_SPECIFICATION"] },
    accepted_by: { bsonType: "string" }
  }
});

// -------------------------------------------------------------
// NHÓM 4: TỒN KHO, LÔ HÀNG & KIỂM ĐỊNH CHẤT LƯỢNG (Sharded - 4 Collections)
// -------------------------------------------------------------

// 13. INVENTORY_STOCKS ⭐ (Tồn kho Vật tư theo Chi nhánh - Sharded Collection)
createValidatedCollection("inventory_stocks", {
  bsonType: "object",
  required: ["warehouse_branch", "warehouse_code", "material_code", "quantity", "min_threshold"],
  properties: {
    warehouse_branch: { enum: ["HN", "HCM", "DN"] },
    warehouse_code: { bsonType: "string" },
    material_code: { bsonType: "string" },
    quantity: { bsonType: ["int", "double"] },
    allocated_quantity: { bsonType: ["int", "double"] },
    available_quantity: { bsonType: ["int", "double"] },
    min_threshold: { bsonType: ["int", "double"] },
    max_threshold: { bsonType: ["int", "double"] },
    unit: { bsonType: "string" },
    last_updated: { bsonType: "date" }
  }
});

// 14. MATERIAL_BATCHES (Quản lý Lô sản xuất, Hạn sử dụng, CO/CQ)
createValidatedCollection("material_batches", {
  bsonType: "object",
  required: ["batch_number", "material_code", "mfg_date", "inspection_status"],
  properties: {
    batch_number: { bsonType: "string" },
    material_code: { bsonType: "string" },
    mfg_date: { bsonType: "date" },
    exp_date: { bsonType: ["date", "null"] },
    co_cq_number: { bsonType: "string" },
    origin_country: { bsonType: "string" },
    inspection_status: { enum: ["PASSED", "PENDING_QC", "REJECTED"] }
  }
});

// 15. STOCKTAKES (Biên bản Kiểm kê & Đối soát Số lượng Thực tế)
createValidatedCollection("stocktakes", {
  bsonType: "object",
  required: ["stocktake_code", "warehouse_branch", "warehouse_code", "check_date", "items", "status"],
  properties: {
    stocktake_code: { bsonType: "string" },
    warehouse_branch: { enum: ["HN", "HCM", "DN"] },
    warehouse_code: { bsonType: "string" },
    check_date: { bsonType: "date" },
    auditor: { bsonType: "string" },
    items: {
      bsonType: "array",
      items: {
        bsonType: "object",
        required: ["material_code", "system_qty", "actual_qty", "variance"],
        properties: {
          material_code: { bsonType: "string" },
          system_qty: { bsonType: ["int", "double"] },
          actual_qty: { bsonType: ["int", "double"] },
          variance: { bsonType: ["int", "double"] },
          explanation: { bsonType: "string" }
        }
      }
    },
    status: { enum: ["BALANCED", "DISCREPANCY_FOUND", "ADJUSTED"] }
  }
});

// 16. QUALITY_INSPECTIONS (Biên bản Kiểm định Chất lượng KCS / QC)
createValidatedCollection("quality_inspections", {
  bsonType: "object",
  required: ["inspection_code", "material_code", "batch_number", "sample_size", "result"],
  properties: {
    inspection_code: { bsonType: "string" },
    material_code: { bsonType: "string" },
    batch_number: { bsonType: "string" },
    sample_size: { bsonType: ["int", "double"] },
    defect_count: { bsonType: ["int", "double"] },
    test_criteria: { bsonType: "array" },
    result: { enum: ["PASSED", "REJECTED", "CONDITIONAL_APPROVAL"] },
    inspector: { bsonType: "string" },
    inspected_date: { bsonType: "date" }
  }
});

// -------------------------------------------------------------
// NHÓM 5: YÊU CẦU CẤP PHÁT & DỰ ÁN CÔNG TRÌNH (2 Collections)
// -------------------------------------------------------------

// 17. MATERIAL_REQUESTS (Phiếu Đề xuất Cấp phát Vật tư Công trường)
createValidatedCollection("material_requests", {
  bsonType: "object",
  required: ["request_code", "project_id", "warehouse_branch", "urgency", "items", "status"],
  properties: {
    request_code: { bsonType: "string" },
    project_id: { bsonType: "objectId" },
    warehouse_branch: { enum: ["HN", "HCM", "DN"] },
    urgency: { enum: ["LOW", "NORMAL", "HIGH", "EMERGENCY"] },
    items: { bsonType: "array" },
    requested_by: { bsonType: "string" },
    requested_date: { bsonType: "date" },
    status: { enum: ["PENDING", "APPROVED", "PARTIALLY_FULFILLED", "FULFILLED", "REJECTED"] }
  }
});

// 18. PROJECTS_DEPARTMENTS (Dự án, Công trình, Phân xưởng Tiêu thụ)
createValidatedCollection("projects_departments", {
  bsonType: "object",
  required: ["project_code", "name", "manager", "branch", "status"],
  properties: {
    project_code: { bsonType: "string" },
    name: { bsonType: "string" },
    department_type: { enum: ["CONSTRUCTION", "PRODUCTION", "R_AND_D", "MAINTENANCE"] },
    manager: { bsonType: "string" },
    branch: { enum: ["HN", "HCM", "DN"] },
    allocated_budget: { bsonType: ["int", "double", "long"] },
    status: { enum: ["PLANNING", "IN_PROGRESS", "COMPLETED", "ON_HOLD"] }
  }
});

// -------------------------------------------------------------
// NHÓM 6: ĐỊNH GIÁ TÀI CHÍNH & NHẬT KÝ KIỂM TOÁN (2 Collections)
// -------------------------------------------------------------

// 19. INVENTORY_VALUATIONS (Báo cáo Định giá Vốn Hàng tồn kho)
createValidatedCollection("inventory_valuations", {
  bsonType: "object",
  required: ["valuation_code", "period", "warehouse_branch", "total_stock_value", "valuation_method"],
  properties: {
    valuation_code: { bsonType: "string" },
    period: { bsonType: "string" },
    warehouse_branch: { enum: ["HN", "HCM", "DN"] },
    total_stock_value: { bsonType: ["double", "long", "int"] },
    valuation_method: { enum: ["FIFO", "WEIGHTED_AVERAGE", "SPECIFIC_IDENTIFICATION"] },
    created_at: { bsonType: "date" }
  }
});

// 20. MATERIAL_AUDIT_LOGS (Nhật ký Truy vết Hoạt động Kho & Tự hủy bằng TTL Index)
createValidatedCollection("material_audit_logs", {
  bsonType: "object",
  required: ["log_code", "action", "actor", "collection_name", "timestamp"],
  properties: {
    log_code: { bsonType: "string" },
    action: { enum: ["RECEIVE", "ISSUE", "TRANSFER", "ADJUST_STOCK", "DELETE", "PRICE_UPDATE"] },
    actor: { bsonType: "string" },
    collection_name: { bsonType: "string" },
    document_id: { bsonType: "string" },
    details: { bsonType: "object" },
    timestamp: { bsonType: "date" }
  }
});

print(`[2/3] Thiết lập các loại Chỉ mục (Indexes) Tối ưu Truy vấn & Phân mảnh...`);

// Chỉ mục Unique xác định danh mục
dbInstance.materials.createIndex({ material_code: 1 }, { unique: true });
dbInstance.warehouses.createIndex({ warehouse_code: 1 }, { unique: true });
dbInstance.suppliers.createIndex({ supplier_code: 1 }, { unique: true });
dbInstance.suppliers.createIndex({ tax_id: 1 }, { unique: true });
dbInstance.purchase_orders.createIndex({ po_code: 1 }, { unique: true });
dbInstance.storage_locations.createIndex({ warehouse_code: 1, location_code: 1 }, { unique: true });

// Chỉ mục Phân mảnh (Shard Key Compound Indexes)
dbInstance.inventory_stocks.createIndex({ warehouse_branch: 1, material_code: 1 }, { unique: true });
dbInstance.goods_receipts.createIndex({ warehouse_branch: 1, receipt_code: 1 });
dbInstance.goods_issues.createIndex({ warehouse_branch: 1, issue_code: 1 });

// A5/A6: uniqueness follows the shard-key prefix; existing data is never deleted.
dbInstance.goods_receipts.createIndex(
  { warehouse_branch: 1, receipt_code: 1 },
  { unique: true, name: "uq_receipt_branch_code" }
);
dbInstance.goods_issues.createIndex(
  { warehouse_branch: 1, issue_code: 1 },
  { unique: true, name: "uq_issue_branch_code" }
);
dbInstance.material_audit_logs.createIndex(
  { log_code: 1 },
  { unique: true, name: "uq_audit_log_code" }
);

// Chỉ mục Multikey & Compound tối ưu hóa tìm kiếm đơn hàng và cấp phát
dbInstance.goods_receipts.createIndex({ "items.material_code": 1 });
dbInstance.goods_issues.createIndex({ project_id: 1, issue_date: -1 });
dbInstance.purchase_orders.createIndex({ supplier_id: 1, status: 1 });
dbInstance.stock_transfers.createIndex({ from_branch: 1, to_branch: 1, status: 1 });

// Full-Text Search Index (Tìm kiếm vật tư theo tên, mô tả, thông số tiêu chuẩn)
dbInstance.materials.createIndex({
  name: "text",
  description: "text",
  "specifications.standard": "text",
  "specifications.material": "text"
}, {
  default_language: "none",
  name: "idx_materials_text_search"
});

// Full-Text Search Index cho mục đích xuất kho
dbInstance.goods_issues.createIndex({
  purpose: "text"
}, {
  default_language: "none",
  name: "idx_goods_issues_purpose_text"
});

// TTL Index (Time-To-Live Index): Tự động xóa log kiểm toán sau 365 ngày (31,536,000 giây)
dbInstance.material_audit_logs.createIndex(
  { timestamp: 1 },
  { expireAfterSeconds: 31536000, name: "idx_audit_logs_ttl_365days" }
);

print(`======================================================================`);
print(`[3/3] HOÀN TẤT KHỞI TẠO 20 COLLECTIONS, VALIDATOR & INDEXES THÀNH CÔNG!`);
print(`======================================================================`);
