import { auth } from "./auth";

export type Session = typeof auth.$Infer.Session;

export const HonoSession = auth.$Infer.Session.session;
export const HonoUser = auth.$Infer.Session.user;

export interface HonoAuthSession {
  Variables: {
    user: typeof HonoUser | null;
    session: typeof HonoUser | null;
  };
}
