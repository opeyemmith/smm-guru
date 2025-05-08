"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.GATEWAY_TIMEOUT = exports.SERVICE_UNAVAILABLE = exports.BAD_GATEWAY = exports.NOT_IMPLEMENTED = exports.INTERNAL_SERVER_ERROR = exports.TOO_MANY_REQUESTS = exports.UNPROCESSABLE_ENTITY = exports.CONFLICT = exports.METHOD_NOT_ALLOWED = exports.NOT_FOUND = exports.FORBIDDEN = exports.UNAUTHORIZED = exports.BAD_REQUEST = exports.PERMANENT_REDIRECT = exports.TEMPORARY_REDIRECT = exports.NOT_MODIFIED = exports.FOUND = exports.MOVED_PERMANENTLY = exports.NO_CONTENT = exports.ACCEPTED = exports.CREATED = exports.OK = void 0;
// 2xx Success
exports.OK = 200; // Standard success response
exports.CREATED = 201; // Resource was successfully created
exports.ACCEPTED = 202; // Request accepted, processing pending
exports.NO_CONTENT = 204; // Request successful, no content returned
// 3xx Redirection
exports.MOVED_PERMANENTLY = 301; // Resource has new permanent URI
exports.FOUND = 302; // Resource temporarily located at different URI
exports.NOT_MODIFIED = 304; // Resource hasn't changed since last request
exports.TEMPORARY_REDIRECT = 307; // Temporary redirect, keeps HTTP method
exports.PERMANENT_REDIRECT = 308; // Permanent redirect, keeps HTTP method
// 4xx Client Errors
exports.BAD_REQUEST = 400; // Invalid syntax or request cannot be fulfilled
exports.UNAUTHORIZED = 401; // Authentication needed
exports.FORBIDDEN = 403; // Client lacks access rights
exports.NOT_FOUND = 404; // Resource doesn't exist
exports.METHOD_NOT_ALLOWED = 405; // HTTP method not allowed
exports.CONFLICT = 409; // Request conflicts with server state
exports.UNPROCESSABLE_ENTITY = 422; // Request syntax correct but semantically invalid
exports.TOO_MANY_REQUESTS = 429; // Rate limit exceeded
// 5xx Server Errors
exports.INTERNAL_SERVER_ERROR = 500; // Generic server error
exports.NOT_IMPLEMENTED = 501; // Server doesn't support requested functionality
exports.BAD_GATEWAY = 502; // Invalid response from upstream server
exports.SERVICE_UNAVAILABLE = 503; // Server temporarily unavailable
exports.GATEWAY_TIMEOUT = 504; // Upstream server timeout
//# sourceMappingURL=status-code.js.map