import { Hono } from "hono";
import addProviderRoute from "./v1/admin/provider.route";
import serviceRoute from "./v1/admin/services.route";
import categoriesRoute from "./v1/admin/categories.route";
import publicServiceRoute from "./v1/public/service.route";
import orderRoute from "./v1/dashboard/order.route";
import fundRoute from "./v1/dashboard/fund.route";
import walletRoute from "./v1/dashboard/wallet.route";

const routes = new Hono();

// Admin Route
routes.route("/admin/providers", addProviderRoute);
routes.route("/admin/services", serviceRoute);
routes.route("/admin/categories", categoriesRoute);

// Dashboard Route
routes.route("/dashboard/orders", orderRoute);
routes.route("/dashboard/fund", fundRoute);
routes.route("/dashboard/wallet", walletRoute);

// Public Route
routes.route("/services", publicServiceRoute);

export default routes;
