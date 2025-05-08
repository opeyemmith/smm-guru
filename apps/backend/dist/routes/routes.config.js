import { Hono } from "hono";
import apiKeyRoute from "./api-keys/api-keys.route.js";
import handlerRoute from "./handler/handler.route.js";
import orderCronRoute from "./cron/order.cron.js";
const routes = new Hono();
// Api key routes
routes.route("/api-key", apiKeyRoute);
// Handler Route
routes.route("/handler", handlerRoute);
// Cron Route
routes.route("/cron/order", orderCronRoute);
export default routes;
