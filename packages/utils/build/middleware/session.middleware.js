"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const addSession = async (c, next, auth) => {
    const session = await auth.api.getSession({ headers: c.req.raw.headers });
    if (!session) {
        c.set("user", null);
        c.set("session", null);
        return next();
    }
    c.set("user", session.user);
    c.set("session", session.session);
    return next();
};
exports.default = addSession;
//# sourceMappingURL=session.middleware.js.map