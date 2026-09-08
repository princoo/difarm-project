import { express } from '../util/cjsDeps';
import authRoute from './routes/auth.routes'
import userRoutes from './routes/user.routes'
import farmRoute from './routes/farm.routes'
import cattleRoute from './routes/cattle.routes'
import livestockRoute from './routes/livestock.routes'
import productionRoute from './routes/production.routes'
import productionTotalsRoute from './routes/productionTotals.routes'
import prodTransaction from './routes/productionTransaction.routes'
import stockRoute from './routes/stock.routes'
import wasteLogRoute from './routes/wasteLog.routes'
import stockTransactionsRoute from './routes/stockTransaction.routes'
import isAuthorized from '../middleware/isAuthorized.middleware';
import vaccinationRoute from '../router/routes/vaccination.routes';
import veterinarianRoute from '../router/routes/veterinarian.routes';
import inserminationRoute from '../router/routes/insermination.routes';
import activityLogRoute from '../router/routes/activityLog.routes';
import supplierRoute from '../router/routes/supplier.routes';
import medicineRoute from '../router/routes/medicine.routes';
import cropTypeRoute from '../router/routes/cropType.routes';
import growFieldRoute from '../router/routes/growField.routes';
import plantingRoute from '../router/routes/planting.routes';
import cropTreatmentRoute from '../router/routes/cropTreatment.routes';
import harvestRoute from '../router/routes/harvest.routes';
import cropPlanRoute from '../router/routes/cropPlan.routes';
import farmTaskRoute from '../router/routes/farmTask.routes';

const routes = express.Router();

routes.use('/auth', authRoute);
routes.use('/users', isAuthorized, userRoutes);
routes.use('/farms', isAuthorized, farmRoute)
routes.use('/cattles', isAuthorized, cattleRoute)
routes.use('/livestock', isAuthorized, livestockRoute)
routes.use('/productions', isAuthorized, productionRoute)
routes.use('/production-totals', isAuthorized, productionTotalsRoute)
routes.use('/production-transaction', isAuthorized, prodTransaction)
routes.use('/waste-logs', isAuthorized, wasteLogRoute)
routes.use('/stocks', isAuthorized, stockRoute)
routes.use('/stock-transactions', isAuthorized, stockTransactionsRoute)
routes.use('/suppliers', isAuthorized, supplierRoute)
routes.use('/vaccinations', isAuthorized, vaccinationRoute)
routes.use('/veterinarians', isAuthorized, veterinarianRoute)
routes.use('/inserminations', isAuthorized, inserminationRoute);
routes.use('/medicines', isAuthorized, medicineRoute);
routes.use('/crop-types', isAuthorized, cropTypeRoute);
routes.use('/fields', isAuthorized, growFieldRoute);
routes.use('/plantings', isAuthorized, plantingRoute);
routes.use('/treatments', isAuthorized, cropTreatmentRoute);
routes.use('/harvests', isAuthorized, harvestRoute);
routes.use('/crop-plan', isAuthorized, cropPlanRoute);
routes.use('/farm-tasks', isAuthorized, farmTaskRoute);
routes.use('/activity-logs', activityLogRoute);

export default routes;
