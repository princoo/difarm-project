import { Routes, Route, Navigate } from '@/lib/router-compat';
import { ReactNode } from 'react';
import Login from '../app/auth/login';
import ChooseFarm from '@/app/choosefarm';
import ChooseDashboard from '@/app/choose-dashboard';
import CattleList from '@/app/dashboard/cattles';
import LivestockList from '@/app/dashboard/livestock';
import FarmsList from '@/app/dashboard/farms';
import FarmDetail from '@/app/dashboard/farms/FarmDetail';
import EditFarmPage from '@/app/dashboard/farms/EditFarmPage';
import InseminationRecords from '@/app/dashboard/insemination';
import Production from '@/app/dashboard/production';
import ProductionTotals from '@/app/dashboard/productionTotals';
import ProductionTransactions from '@/app/dashboard/productionTransactions';
import Reports from '@/app/dashboard/reports';
import StockManagement from '@/app/dashboard/stock';
import StockTransactionManagement from '@/app/dashboard/stock_transaction';
import Users from '@/app/dashboard/users';
import UserDetail from '@/app/dashboard/users/UserDetail';
import ActivityLogs from '@/app/dashboard/activityLogs';
import VaccineRecords from '@/app/dashboard/vaccine';
import Veterinarians from '@/app/dashboard/veterians';
import WasteLogManagement from '@/app/dashboard/waste';
import Widget from '@/app/dashboard/Widget';
import ProfilePage from '@/app/profile';
import AdminLayout from '@/components/Admin/DefaultLayout';
import Home from "@/app/home";
import Health from "@/app/dashboard/health";
import AboutUs from "@/app/home/About";
import ServicesCard from "@/app/home/Service";
import MetricsPage from "@/app/dashboard/OverView/MetricsPage";
import Overview from "@/app/dashboard/OverView";
import FarmProfilePage from "@/app/dashboard/farms/FarmProfilePage";
import CropTypesPage from "@/app/dashboard/agriculture/crop-types";
import FieldsPage from "@/app/dashboard/agriculture/fields";
import PlantingsPage from "@/app/dashboard/agriculture/plantings";
import HarvestsPage from "@/app/dashboard/agriculture/harvests";
import CropPlanPage from "@/app/dashboard/agriculture/crop-plan";
import ActivitiesPage from "@/app/dashboard/activities";
import SchedulePage from "@/app/dashboard/farmbrite/schedule";
import ResourcesPage from "@/app/dashboard/farmbrite/resources";
import MarketDashboardPage from "@/app/dashboard/farmbrite/market";
import MarketProductsPage from "@/app/dashboard/farmbrite/market/products";
import MarketOrdersPage from "@/app/dashboard/farmbrite/market/orders";
import MarketSettingsPage from "@/app/dashboard/farmbrite/market/settings";
import TimesheetsPage from "@/app/dashboard/farmbrite/schedule/timesheets";
import LocationMapPage from "@/app/dashboard/farmbrite/plantings/location-map";
import YieldComparisonPage from "@/app/dashboard/farmbrite/plantings/yield-comparison";
import EquipmentPage from "@/app/dashboard/farmbrite/resources/equipment";
import WarehousesPage from "@/app/dashboard/farmbrite/resources/warehouses";
import AccountingTransactionsPage from "@/app/dashboard/farmbrite/accounting/transactions";
import PlStatementPage from "@/app/dashboard/farmbrite/accounting/pl";
import CashFlowPage from "@/app/dashboard/farmbrite/accounting/cash-flow";
import BalanceSheetPage from "@/app/dashboard/farmbrite/accounting/balance-sheet";
import BudgetingPage from "@/app/dashboard/farmbrite/accounting/budgeting";
import ContactsPage from "@/app/dashboard/farmbrite/contacts";
import FarmMapPage from "@/app/dashboard/farmbrite/farm-map";
import ClimatePage from "@/app/dashboard/farmbrite/climate";
import FarmCategoryGuard from "@/components/auth/FarmCategoryGuard";

const Ag = ({ children }: { children: ReactNode }) => (
  <FarmCategoryGuard require="AGRICULTURE">{children}</FarmCategoryGuard>
);


export default function AppRoutes() {
    return (
        <>
        {/* <Header />
        <Sidebar /> */}
        <Routes>
            <Route path="/" element={<Navigate to="/home" />} />
            <Route path="*" element={<Navigate to="/home" />} />
            {/* <Route path="/about" element={<AboutUs />}/> */}
            {/* <Route path="/services" element={<ServicesCard />}/> */}
            <Route path="login" element={<Login />} />
            <Route path="home" element={<Home />} />
            <Route path="choose-farm" element={<ChooseFarm />} />
            <Route path="choose-dashboard" element={<ChooseDashboard />} />
            <Route path="account/:year?" element={<AdminLayout />}>

                {/* <Route index element={<DashboardOverview />} /> */}
                <Route index element={<Overview />} />
                <Route path='farm-profile' element={<FarmProfilePage />} />
                <Route path='profile' element={<ProfilePage />} />
                <Route path='farms' element={<FarmsList />} />
                <Route path='farms/:farmId' element={<FarmDetail />} />
                <Route path='farms/:farmId/edit' element={<EditFarmPage />} />
                <Route path='users' element={<Users />} />
                <Route path='users/detail/:userId' element={<UserDetail />} />
                <Route path='activity-logs' element={<ActivityLogs />} />
                <Route path='production' element={<Production />} />
                <Route path='reports' element={<Reports />} />
                <Route path='stock' element={<StockManagement />} />
                <Route path='waste-logs' element={<WasteLogManagement />} />
                <Route path='production_totals' element={<ProductionTotals />} />
                <Route path='production_transactions' element={<ProductionTransactions />} />
                <Route path='stock_transactions' element={<StockTransactionManagement />} />
                <Route path='crop-types' element={<CropTypesPage />} />
                <Route path='fields' element={<FieldsPage />} />
                <Route path='plantings' element={<PlantingsPage />} />
                <Route path='harvests' element={<HarvestsPage />} />
                <Route path='crop-plan' element={<CropPlanPage />} />
                <Route path='activities' element={<ActivitiesPage />} />
                <Route path='schedule' element={<Ag><SchedulePage /></Ag>} />
                <Route path='schedule/timesheets' element={<Ag><TimesheetsPage /></Ag>} />
                <Route path='plantings/location-map' element={<Ag><LocationMapPage /></Ag>} />
                <Route path='harvests/yield-comparison' element={<Ag><YieldComparisonPage /></Ag>} />
                <Route path='resources' element={<Ag><ResourcesPage /></Ag>} />
                <Route path='resources/equipment' element={<Ag><EquipmentPage /></Ag>} />
                <Route path='resources/warehouses' element={<Ag><WarehousesPage /></Ag>} />
                <Route path='accounting' element={<Ag><AccountingTransactionsPage /></Ag>} />
                <Route path='accounting/transactions' element={<Ag><AccountingTransactionsPage /></Ag>} />
                <Route path='accounting/pl' element={<Ag><PlStatementPage /></Ag>} />
                <Route path='accounting/cash-flow' element={<Ag><CashFlowPage /></Ag>} />
                <Route path='accounting/balance-sheet' element={<Ag><BalanceSheetPage /></Ag>} />
                <Route path='accounting/budgeting' element={<Ag><BudgetingPage /></Ag>} />
                <Route path='market' element={<Ag><MarketDashboardPage /></Ag>} />
                <Route path='market/products' element={<Ag><MarketProductsPage /></Ag>} />
                <Route path='market/orders' element={<Ag><MarketOrdersPage /></Ag>} />
                <Route path='market/settings' element={<Ag><MarketSettingsPage /></Ag>} />
                <Route path='contacts' element={<Ag><ContactsPage /></Ag>} />
                <Route path='farm-map' element={<Ag><FarmMapPage /></Ag>} />
                <Route path='climate' element={<Ag><ClimatePage /></Ag>} />
                <Route path='health' element={<FarmCategoryGuard require="LIVESTOCK"><Health /></FarmCategoryGuard>} />
                <Route path='cattle' element={<FarmCategoryGuard require="LIVESTOCK"><CattleList /></FarmCategoryGuard>} />
                <Route path='livestock' element={<FarmCategoryGuard require="LIVESTOCK"><LivestockList /></FarmCategoryGuard>} />
            </Route>
            <Route path="stock/" element={<AdminLayout />}>

                <Route index element={<Widget />} />
            </Route>
        </Routes>
        </>
    );
}
