import crypto from "crypto";

const ALGO = "aes-256-gcm";

const getKey = () => {
  const keyFromEnv = process.env.DATA_ENCRYPTION_KEY;
  if (!keyFromEnv) {
    throw new Error(
      "Missing DATA_ENCRYPTION_KEY (32-byte key in hex or base64) for crypto utilities"
    );
  }
  const isHex = /^[0-9a-fA-F]{64}$/.test(keyFromEnv);
  if (isHex) return Buffer.from(keyFromEnv, "hex");
  const buf = Buffer.from(keyFromEnv, "base64");
  if (buf.length !== 32) {
    throw new Error("Encryption key must be 32 bytes (256 bits)");
  }
  return buf;
};

const KEY = getKey();

export const encrypt = (text) => {
  if (text === undefined || text === null) return text;
  const plain = typeof text === "string" ? text : String(text);
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGO, KEY, iv);

  let encrypted = cipher.update(plain, "utf8", "hex");
  encrypted += cipher.final("hex");
  const tag = cipher.getAuthTag().toString("hex");

  return { iv: iv.toString("hex"), content: encrypted, tag };
};

export const decrypt = (payload) => {
  if (!payload) return payload;
  const { iv, content, tag } = payload;
  if (!(iv && content && tag)) return payload;
  const decipher = crypto.createDecipheriv(ALGO, KEY, Buffer.from(iv, "hex"));
  decipher.setAuthTag(Buffer.from(tag, "hex"));

  let decrypted = decipher.update(content, "hex", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
};
