declare module "pizzip" {
  interface PizZipFile {
    asText(): string;
    asBinary(): string;
    asUint8Array(): Uint8Array;
    asNodeBuffer(): Buffer;
  }

  interface GenerateOptions {
    type?: "nodebuffer" | "arraybuffer" | "blob" | "uint8array" | "base64" | "string";
    compression?: "STORE" | "DEFLATE";
    compressionOptions?: { level?: number };
  }

  class PizZip {
    constructor(data?: Buffer | ArrayBuffer | Uint8Array | string, options?: object);
    file(name: string): PizZipFile | null;
    file(name: string, data: string | Buffer | Uint8Array, options?: object): this;
    generate(options?: GenerateOptions): Buffer | string | Uint8Array;
  }

  export = PizZip;
}
