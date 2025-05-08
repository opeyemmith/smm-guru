/**
 * HTTP Status Code Constants
 * @module StatusCodes
 *
 * 2xx Success Codes
 * @constant {number} OK - 200: Request succeeded normally
 * @constant {number} CREATED - 201: Request succeeded and new resource created
 * @constant {number} ACCEPTED - 202: Request accepted but processing not completed
 * @constant {number} NO_CONTENT - 204: Request succeeded but no content to return
 *
 * 3xx Redirection Codes
 * @constant {number} MOVED_PERMANENTLY - 301: Resource permanently moved to new URL
 * @constant {number} FOUND - 302: Resource temporarily moved to new URL
 * @constant {number} NOT_MODIFIED - 304: Resource not modified since last request
 * @constant {number} TEMPORARY_REDIRECT - 307: Temporary redirect with same HTTP method
 * @constant {number} PERMANENT_REDIRECT - 308: Permanent redirect with same HTTP method
 *
 * 4xx Client Error Codes
 * @constant {number} BAD_REQUEST - 400: Server cannot process due to client error
 * @constant {number} UNAUTHORIZED - 401: Authentication required
 * @constant {number} FORBIDDEN - 403: Server refuses to authorize request
 * @constant {number} NOT_FOUND - 404: Requested resource not found
 * @constant {number} METHOD_NOT_ALLOWED - 405: HTTP method not allowed for resource
 * @constant {number} CONFLICT - 409: Request conflicts with current state
 * @constant {number} UNPROCESSABLE_ENTITY - 422: Request well-formed but semantically invalid
 * @constant {number} TOO_MANY_REQUESTS - 429: User sent too many requests
 *
 * 5xx Server Error Codes
 * @constant {number} INTERNAL_SERVER_ERROR - 500: Generic server error
 * @constant {number} NOT_IMPLEMENTED - 501: Server does not support requested functionality
 * @constant {number} BAD_GATEWAY - 502: Invalid response from upstream server
 * @constant {number} SERVICE_UNAVAILABLE - 503: Server temporarily unavailable
 * @constant {number} GATEWAY_TIMEOUT - 504: Upstream server failed to respond in time
 */
export declare const OK = 200;
export declare const CREATED = 201;
export declare const ACCEPTED = 202;
export declare const NO_CONTENT = 204;
export declare const MOVED_PERMANENTLY = 301;
export declare const FOUND = 302;
export declare const NOT_MODIFIED = 304;
export declare const TEMPORARY_REDIRECT = 307;
export declare const PERMANENT_REDIRECT = 308;
export declare const BAD_REQUEST = 400;
export declare const UNAUTHORIZED = 401;
export declare const FORBIDDEN = 403;
export declare const NOT_FOUND = 404;
export declare const METHOD_NOT_ALLOWED = 405;
export declare const CONFLICT = 409;
export declare const UNPROCESSABLE_ENTITY = 422;
export declare const TOO_MANY_REQUESTS = 429;
export declare const INTERNAL_SERVER_ERROR = 500;
export declare const NOT_IMPLEMENTED = 501;
export declare const BAD_GATEWAY = 502;
export declare const SERVICE_UNAVAILABLE = 503;
export declare const GATEWAY_TIMEOUT = 504;
//# sourceMappingURL=status-code.d.ts.map