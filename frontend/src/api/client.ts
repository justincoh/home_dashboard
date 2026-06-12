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
export interface Category {
  id: number;
  name: string;
}

export interface Provider {
  id: number;
  name: string;
  service_type: string;
  phone: string | null;
  email: string | null;
  account_number: string | null;
  contract_terms: string | null;
  notes: string | null;
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
  provider_id: number;
  project_id: number | null;
  amount: number;
  date_received: string;
  provider?: Provider;
  project?: Project;
}

export interface Contract {
  id: number;
  name: string;
  type: 'contract' | 'warranty';
  provider_id: number | null;
  start_date: string;
  end_date: string | null;
  cost: number | null;
  payment_terms: string | null;
  notes: string | null;
  provider?: Provider;
}

export interface LogEntry {
  id: number;
  entry_date: string | null;
  title: string;
  description: string | null;
  category_id: number | null;
  provider_id: number | null;
  project_id: number | null;
  amount: number | null;
  usage_value: number | null;
  usage_unit: string | null;
  recurring: boolean;
  frequency: string | null;
  next_due: string | null;
  created_at: string | null;
  category?: Category;
  provider?: Provider;
  project?: Project;
}

export type LogEntryInput = Omit<LogEntry, 'id' | 'created_at' | 'category' | 'provider' | 'project'>;

export interface FileAttachment {
  id: number;
  entity_type: string;
  entity_id: number;
  filename: string;
  filepath: string;
  content_type: string | null;
  uploaded_at: string;
}

export interface DashboardLogEntry extends LogEntry {
  provider_name: string | null;
}

export interface DashboardData {
  upcoming_reminders: LogEntry[];
  active_projects: Project[];
  expiring_contracts: Contract[];
  recent_entries: DashboardLogEntry[];
}

export interface CategoryBreakdown {
  category: string;
  total: number;
}

export interface ProviderBreakdown {
  provider_id: number;
  provider_name: string;
  total: number;
}

export interface ProjectBreakdown {
  project_id: number;
  project_name: string;
  total: number;
}

export interface AnnualReport {
  year: number;
  log_total: number;
  by_category: CategoryBreakdown[];
  by_provider: ProviderBreakdown[];
  by_project: ProjectBreakdown[];
  contracts_total: number;
  contracts: Contract[];
  grand_total: number;
}

export interface SearchResult {
  entity_type: string;
  id: number;
  name: string;
  subtitle: string | null;
}

// API functions
export const api = {
  // Dashboard
  getDashboard: () => request<DashboardData>('/dashboard'),

  // Providers
  listProviders: () => request<Provider[]>('/providers'),
  getProvider: (id: number) => request<Provider>(`/providers/${id}`),
  createProvider: (data: Omit<Provider, 'id'>) => request<Provider>('/providers', { method: 'POST', body: JSON.stringify(data) }),
  updateProvider: (id: number, data: Omit<Provider, 'id'>) => request<Provider>(`/providers/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteProvider: (id: number) => request<void>(`/providers/${id}`, { method: 'DELETE' }),

  // Projects
  listProjects: (status?: string) => request<Project[]>(`/projects${status ? `?status=${status}` : ''}`),
  getProject: (id: number) => request<Project>(`/projects/${id}`),
  createProject: (data: Omit<Project, 'id'>) => request<Project>('/projects', { method: 'POST', body: JSON.stringify(data) }),
  updateProject: (id: number, data: Omit<Project, 'id'>) => request<Project>(`/projects/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteProject: (id: number) => request<void>(`/projects/${id}`, { method: 'DELETE' }),

  // Quotes
  listQuotes: (params?: { provider_id?: number; project_id?: number }) => {
    const qs = new URLSearchParams();
    if (params?.provider_id) qs.set('provider_id', String(params.provider_id));
    if (params?.project_id) qs.set('project_id', String(params.project_id));
    const q = qs.toString();
    return request<Quote[]>(`/quotes${q ? `?${q}` : ''}`);
  },
  getQuote: (id: number) => request<Quote>(`/quotes/${id}`),
  createQuote: (data: Omit<Quote, 'id' | 'provider' | 'project'>) => request<Quote>('/quotes', { method: 'POST', body: JSON.stringify(data) }),
  updateQuote: (id: number, data: Omit<Quote, 'id' | 'provider' | 'project'>) => request<Quote>(`/quotes/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteQuote: (id: number) => request<void>(`/quotes/${id}`, { method: 'DELETE' }),

  // Contracts
  listContracts: () => request<Contract[]>('/contracts'),
  getContract: (id: number) => request<Contract>(`/contracts/${id}`),
  createContract: (data: Omit<Contract, 'id' | 'provider'>) => request<Contract>('/contracts', { method: 'POST', body: JSON.stringify(data) }),
  updateContract: (id: number, data: Omit<Contract, 'id' | 'provider'>) => request<Contract>(`/contracts/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteContract: (id: number) => request<void>(`/contracts/${id}`, { method: 'DELETE' }),

  // Log entries
  listLogEntries: (params?: { category_id?: number; provider_id?: number; project_id?: number; year?: number; limit?: number }) => {
    const qs = new URLSearchParams();
    if (params?.category_id) qs.set('category_id', String(params.category_id));
    if (params?.provider_id) qs.set('provider_id', String(params.provider_id));
    if (params?.project_id) qs.set('project_id', String(params.project_id));
    if (params?.year) qs.set('year', String(params.year));
    if (params?.limit) qs.set('limit', String(params.limit));
    const q = qs.toString();
    return request<LogEntry[]>(`/log-entries${q ? `?${q}` : ''}`);
  },
  getLogEntry: (id: number) => request<LogEntry>(`/log-entries/${id}`),
  createLogEntry: (data: LogEntryInput) => request<LogEntry>('/log-entries', { method: 'POST', body: JSON.stringify(data) }),
  updateLogEntry: (id: number, data: LogEntryInput) => request<LogEntry>(`/log-entries/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteLogEntry: (id: number) => request<void>(`/log-entries/${id}`, { method: 'DELETE' }),

  // Categories
  listCategories: () => request<Category[]>('/categories'),
  createCategory: (name: string) => request<Category>('/categories', { method: 'POST', body: JSON.stringify({ name }) }),
  updateCategory: (id: number, name: string) => request<Category>(`/categories/${id}`, { method: 'PUT', body: JSON.stringify({ name }) }),
  deleteCategory: (id: number) => request<void>(`/categories/${id}`, { method: 'DELETE' }),

  // Reports
  getAnnualReport: (year: number) => request<AnnualReport>(`/reports/annual?year=${year}`),

  // Search
  search: (q: string) => request<SearchResult[]>(`/search?q=${encodeURIComponent(q)}`),

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
