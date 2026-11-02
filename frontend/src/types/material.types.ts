export interface SpecificationTemplateField {
  field: string;
  label: string;
  type: 'string' | 'number' | 'select';
  unit?: string;
  options?: string[];
  placeholder?: string;
  required: boolean;
}

export interface MaterialCategory {
  category_code: string;
  name: string;
  description: string;
  storage_condition: string;
  specification_template: SpecificationTemplateField[];
}

export interface Material {
  _id?: string;
  material_code: string;
  name: string;
  category_code: string;
  unit: string;
  description?: string;
  specifications: Record<string, any>;
  standard_price: number;
  barcode?: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface MaterialListResponse {
  items: Material[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  dataSource?: string;
}

export interface MaterialCategoryStats {
  category_code: string;
  category_name: string;
  count: number;
  avgPrice: number;
  minPrice: number;
  maxPrice: number;
}
