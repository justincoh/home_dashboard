import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import DashboardPage from './pages/DashboardPage';
import ProjectsPage from './pages/ProjectsPage';
import ProjectDetailPage from './pages/ProjectDetailPage';
import MaintenancePage from './pages/MaintenancePage';
import UtilitiesPage from './pages/UtilitiesPage';
import UtilityDetailPage from './pages/UtilityDetailPage';
import ContractsPage from './pages/ContractsPage';
import ContractDetailPage from './pages/ContractDetailPage';
import VendorsPage from './pages/VendorsPage';
import VendorDetailPage from './pages/VendorDetailPage';
import QuotesPage from './pages/QuotesPage';
import QuoteDetailPage from './pages/QuoteDetailPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/projects" element={<ProjectsPage />} />
          <Route path="/projects/:id" element={<ProjectDetailPage />} />
          <Route path="/maintenance" element={<MaintenancePage />} />
          <Route path="/utilities" element={<UtilitiesPage />} />
          <Route path="/utilities/:id" element={<UtilityDetailPage />} />
          <Route path="/contracts" element={<ContractsPage />} />
          <Route path="/contracts/:id" element={<ContractDetailPage />} />
          <Route path="/vendors" element={<VendorsPage />} />
          <Route path="/vendors/:id" element={<VendorDetailPage />} />
          <Route path="/quotes" element={<QuotesPage />} />
          <Route path="/quotes/:id" element={<QuoteDetailPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
