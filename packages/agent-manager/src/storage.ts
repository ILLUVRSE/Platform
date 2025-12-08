export type StoragePutParams = {
  bucket?: string;
  key: string;
  body: string | Buffer;
};

export class StorageClient {
  constructor(private baseUrl: string = "s3://illuvrse-dev") {}

  async putObject(params: StoragePutParams) {
    const bucket = params.bucket ?? "assets";
    const url = `${this.baseUrl}/${bucket}/${params.key}`;
    // Stub: in a real client, upload to MinIO/S3. For now, log for visibility.
    console.info("[storage.put]", url);
    return { url };
  }

  url(bucket: string, key: string) {
    return `${this.baseUrl}/${bucket}/${key}`;
  }
}
