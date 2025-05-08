import { Resend } from "resend";
import { RESEND_API_KEY } from "../env";

const resend = new Resend(RESEND_API_KEY);

export default resend;