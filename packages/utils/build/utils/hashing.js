"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateKey = generateKey;
exports.encrypt = encrypt;
exports.decrypt = decrypt;
exports.generateApiKey = generateApiKey;
const crypto_1 = __importDefault(require("crypto"));
const crypto_constants_1 = require("../constants/crypto.constants");
// Generate a secure key from your secret
function generateKey(secret) {
    return crypto_1.default.createHash("sha256").update(secret).digest();
}
// Encryption function
function encrypt(text, secretKey) {
    // Generate key from secret
    const key = generateKey(secretKey);
    // Generate a random IV
    const iv = crypto_1.default.randomBytes(crypto_constants_1.IV_LENGTH);
    // Create cipher
    const cipher = crypto_1.default.createCipheriv(crypto_constants_1.ALGORITHM, key, iv);
    // Encrypt the text
    let encrypted = cipher.update(text, "utf8", "hex");
    encrypted += cipher.final("hex");
    return {
        iv: iv.toString("hex"),
        encryptedKeys: encrypted,
    };
}
// Decryption function
function decrypt(encryptedData, iv, secretKey) {
    // Generate key from secret
    const key = generateKey(secretKey);
    // Create decipher
    const decipher = crypto_1.default.createDecipheriv(crypto_constants_1.ALGORITHM, key, Buffer.from(iv, "hex"));
    // Decrypt the text
    let decrypted = decipher.update(encryptedData, "hex", "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
}
// Generate API Key
function generateApiKey(len = 32) {
    return crypto_1.default.randomBytes(len).toString("hex");
}
//# sourceMappingURL=hashing.js.map