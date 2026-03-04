const BASE = '/api';

export function fmt$(n: number, decimals = 2): string {
  return '$' + n.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API error ${res.status}: ${text}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

// Types
export interface Vendor {
  id: number;
  name: string;
  phone: string | null;
  email: string | null;
  service_type: string;
}

export interface Project {
  id: number;
  name: string;
  description: string | null;
  status: 'planned' | 'in_progress' | 'done';
  budget: number | null;
  actual_cost: number | null;
  start_date: string | null;
  end_date: string | null;
}

export interface Quote {
  id: number;
  vendor_id: number;
  project_id: number | null;
  amount: number;
  date_received: string;
  vendor?: Vendor;
  project?: Project;
}

export interface Contract {
  id: number;
  name: string;
  type: 'contract' | 'warranty';
  vendor_id: number | null;
  start_date: string;
  end_date: string | null;
  cost: number | null;
  payment_terms: string | null;
  notes: string | null;
  vendor?: Vendor;
}

export interface MaintenanceTask {
  id: number;
  name: string;
  frequency: string;
  last_completed: string | null;
  next_due: string | null;
}

export interface MaintenanceLog {
  id: number;
  task_id: number;
  completed_at: string;
}

export interface Utility {
  id: number;
  provider_name: string;
  account_number: string | null;
  contact_info: string | null;
  contract_terms: string | null;
  utility_type: string;
}

export interface UtilityBill {
  id: number;
  utility_id: number;
  bill_date: string;
  amount: number;
  usage_value: number | null;
  usage_unit: string | null;
  provider_name?: string;
}

export interface FileAttachment {
  id: number;
  entity_type: string;
  entity_id: number;
  filename: string;
  filepath: string;
  content_type: string | null;
  uploaded_at: string;
}

export interface DashboardData {
  upcoming_maintenance: MaintenanceTask[];
  active_projects: Project[];
  expiring_contracts: Contract[];
  recent_bills: UtilityBill[];
}

// API functions
export const api = {
  // Dashboard
  getDashboard: () => request<DashboardData>('/dashboard'),

  // Vendors
  listVendors: () => request<Vendor[]>('/vendors'),
  getVendor: (id: number) => request<Vendor>(`/vendors/${id}`),
  createVendor: (data: Omit<Vendor, 'id'>) => request<Vendor>('/vendors', { method: 'POST', body: JSON.stringify(data) }),
  updateVendor: (id: number, data: Omit<Vendor, 'id'>) => request<Vendor>(`/vendors/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteVendor: (id: number) => request<void>(`/vendors/${id}`, { method: 'DELETE' }),

  // Projects
  listProjects: (status?: string) => request<Project[]>(`/projects${status ? `?status=${status}` : ''}`),
  getProject: (id: number) => request<Project>(`/projects/${id}`),
  createProject: (data: Omit<Project, 'id'>) => request<Project>('/projects', { method: 'POST', body: JSON.stringify(data) }),
  updateProject: (id: number, data: Omit<Project, 'id'>) => request<Project>(`/projects/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteProject: (id: number) => request<void>(`/projects/${id}`, { method: 'DELETE' }),

  // Quotes
  listQuotes: (params?: { vendor_id?: number; project_id?: number }) => {
    const qs = new URLSearchParams();
    if (params?.vendor_id) qs.set('vendor_id', String(params.vendor_id));
    if (params?.project_id) qs.set('project_id', String(params.project_id));
    const q = qs.toString();
    return request<Quote[]>(`/quotes${q ? `?${q}` : ''}`);
  },
  getQuote: (id: number) => request<Quote>(`/quotes/${id}`),
  createQuote: (data: Omit<Quote, 'id' | 'vendor' | 'project'>) => request<Quote>('/quotes', { method: 'POST', body: JSON.stringify(data) }),
  updateQuote: (id: number, data: Omit<Quote, 'id' | 'vendor' | 'project'>) => request<Quote>(`/quotes/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteQuote: (id: number) => request<void>(`/quotes/${id}`, { method: 'DELETE' }),

  // Contracts
  listContracts: () => request<Contract[]>('/contracts'),
  getContract: (id: number) => request<Contract>(`/contracts/${id}`),
  createContract: (data: Omit<Contract, 'id' | 'vendor'>) => request<Contract>('/contracts', { method: 'POST', body: JSON.stringify(data) }),
  updateContract: (id: number, data: Omit<Contract, 'id' | 'vendor'>) => request<Contract>(`/contracts/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteContract: (id: number) => request<void>(`/contracts/${id}`, { method: 'DELETE' }),

  // Maintenance
  listMaintenance: () => request<MaintenanceTask[]>('/maintenance'),
  getMaintenance: (id: number) => request<MaintenanceTask>(`/maintenance/${id}`),
  createMaintenance: (data: Omit<MaintenanceTask, 'id'>) => request<MaintenanceTask>('/maintenance', { method: 'POST', body: JSON.stringify(data) }),
  updateMaintenance: (id: number, data: Omit<MaintenanceTask, 'id'>) => request<MaintenanceTask>(`/maintenance/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteMaintenance: (id: number) => request<void>(`/maintenance/${id}`, { method: 'DELETE' }),
  completeMaintenance: (id: number) => request<MaintenanceTask>(`/maintenance/${id}/complete`, { method: 'POST' }),
  listMaintenanceLogs: (taskId: number) => request<MaintenanceLog[]>(`/maintenance/${taskId}/log`),

  // Utilities
  listUtilities: () => request<Utility[]>('/utilities'),
  getUtility: (id: number) => request<Utility>(`/utilities/${id}`),
  createUtility: (data: Omit<Utility, 'id'>) => request<Utility>('/utilities', { method: 'POST', body: JSON.stringify(data) }),
  updateUtility: (id: number, data: Omit<Utility, 'id'>) => request<Utility>(`/utilities/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteUtility: (id: number) => request<void>(`/utilities/${id}`, { method: 'DELETE' }),

  // Utility Bills
  listBills: (utilityId: number) => request<UtilityBill[]>(`/utilities/${utilityId}/bills`),
  createBill: (utilityId: number, data: Omit<UtilityBill, 'id'>) => request<UtilityBill>(`/utilities/${utilityId}/bills`, { method: 'POST', body: JSON.stringify(data) }),
  updateBill: (billId: number, data: Omit<UtilityBill, 'id'>) => request<UtilityBill>(`/utilities/bills/${billId}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteBill: (billId: number) => request<void>(`/utilities/bills/${billId}`, { method: 'DELETE' }),

  // Files
  listFiles: (entityType: string, entityId: number) => request<FileAttachment[]>(`/files?entity_type=${entityType}&entity_id=${entityId}`),
  uploadFile: async (entityType: string, entityId: number, file: File): Promise<FileAttachment> => {
    const form = new FormData();
    form.append('entity_type', entityType);
    form.append('entity_id', String(entityId));
    form.append('file', file);
    const res = await fetch(`${BASE}/files/upload`, { method: 'POST', body: form });
    if (!res.ok) throw new Error(`Upload failed: ${res.status}`);
    return res.json();
  },
  deleteFile: (id: number) => request<void>(`/files/${id}`, { method: 'DELETE' }),
  getFileUrl: (id: number) => `${BASE}/files/${id}`,
};
