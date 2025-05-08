import crypto from "crypto";
import { ALGORITHM, IV_LENGTH } from "../constants/crypto.constants";

// Generate a secure key from your secret
export function generateKey(secret: string): Buffer {
    return crypto.createHash("sha256").update(secret).digest();
  }
  
  // Encryption function
  export function encrypt(
    text: string,
    secretKey: string
  ): { iv: string; encryptedKeys: string } {
    // Generate key from secret
    const key = generateKey(secretKey);
  
    // Generate a random IV
    const iv = crypto.randomBytes(IV_LENGTH);
  
    // Create cipher
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  
    // Encrypt the text
    let encrypted = cipher.update(text, "utf8", "hex");
    encrypted += cipher.final("hex");
  
    return {
      iv: iv.toString("hex"),
      encryptedKeys: encrypted,
    };
  }
  
  // Decryption function
  export function decrypt(
    encryptedData: string,
    iv: string,
    secretKey: string
  ): string {
    // Generate key from secret
    const key = generateKey(secretKey);
  
    // Create decipher
    const decipher = crypto.createDecipheriv(
      ALGORITHM,
      key,
      Buffer.from(iv, "hex")
    );
  
    // Decrypt the text
    let decrypted = decipher.update(encryptedData, "hex", "utf8");
    decrypted += decipher.final("utf8");
  
    return decrypted;
  }
  
  // Generate API Key
  export function generateApiKey(len = 32) {
    return crypto.randomBytes(len).toString("hex");
  }