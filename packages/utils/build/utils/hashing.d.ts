export declare function generateKey(secret: string): Buffer;
export declare function encrypt(text: string, secretKey: string): {
    iv: string;
    encryptedKeys: string;
};
export declare function decrypt(encryptedData: string, iv: string, secretKey: string): string;
export declare function generateApiKey(len?: number): string;
//# sourceMappingURL=hashing.d.ts.map