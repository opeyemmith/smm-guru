import type { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import type { HTTPResponseError } from "hono/types";
import type { ContentfulStatusCode } from "hono/utils/http-status";
export declare const errorHandler: (err: Error | HTTPResponseError, c: Context) => Promise<Response & import("hono").TypedResponse<{
    error?: string | undefined;
    success: boolean;
    name: string;
    message: string;
    result: any;
}, 100 | 102 | 103 | 200 | 201 | 202 | 203 | 206 | 207 | 208 | 226 | 300 | 301 | 302 | 303 | 305 | 306 | 307 | 308 | 400 | 401 | 402 | 403 | 404 | 405 | 406 | 407 | 408 | 409 | 410 | 411 | 412 | 413 | 414 | 415 | 416 | 417 | 418 | 421 | 422 | 423 | 424 | 425 | 426 | 428 | 429 | 431 | 451 | 500 | 501 | 502 | 503 | 504 | 505 | 506 | 507 | 508 | 510 | 511 | -1, "json">>;
export declare class ValidationError extends HTTPException {
    details: Record<string, any>;
    message: string;
    constructor(message: string, details?: Record<string, any>, statusCode?: ContentfulStatusCode);
}
//# sourceMappingURL=handler.error.d.ts.map