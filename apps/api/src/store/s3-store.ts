import { GetObjectCommand, NoSuchKey, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

import { MemoryStore, type SerializedMemoryState } from "./memory-store.js";

async function bodyToString(body: unknown): Promise<string> {
  if (typeof body === "string") {
    return body;
  }
  if (body && typeof body === "object" && "transformToString" in body) {
    return (body as { transformToString(): Promise<string> }).transformToString();
  }
  if (body && typeof body === "object" && Symbol.asyncIterator in body) {
    const chunks: Uint8Array[] = [];
    for await (const chunk of body as AsyncIterable<Uint8Array>) {
      chunks.push(chunk);
    }
    return Buffer.concat(chunks).toString("utf8");
  }
  return "";
}

export class S3Store extends MemoryStore {
  private readonly client = new S3Client({});

  constructor(
    private readonly bucket: string,
    private readonly key: string,
    defaultTrialDays = 14
  ) {
    super(defaultTrialDays, false);
  }

  override async initialize(): Promise<void> {
    const snapshot = await this.loadSnapshot();
    if (snapshot) {
      this.restoreState(snapshot);
      return;
    }

    await this.persist();
  }

  override async createMagicLink(email: string, orgName?: string) {
    const result = await super.createMagicLink(email, orgName);
    await this.persist();
    return result;
  }

  override async consumeMagicLink(tokenHash: string) {
    const result = await super.consumeMagicLink(tokenHash);
    if (result) {
      await this.persist();
    }
    return result;
  }

  override async createRefreshToken(userId: string, orgId: string, tokenHash: string, expiresAt: string) {
    await super.createRefreshToken(userId, orgId, tokenHash, expiresAt);
    await this.persist();
  }

  override async revokeRefreshToken(tokenHash: string) {
    await super.revokeRefreshToken(tokenHash);
    await this.persist();
  }

  override async createDeviceCode(userId: string, orgId: string, expiresAt: string) {
    const result = await super.createDeviceCode(userId, orgId, expiresAt);
    await this.persist();
    return result;
  }

  override async consumeDeviceCode(code: string, deviceId: string, extensionVersion: string | null) {
    const result = await super.consumeDeviceCode(code, deviceId, extensionVersion);
    if (result) {
      await this.persist();
    }
    return result;
  }

  override async publishPolicy(orgId: string, userId: string, input: Parameters<MemoryStore["publishPolicy"]>[2]) {
    const result = await super.publishPolicy(orgId, userId, input);
    await this.persist();
    return result;
  }

  override async recordEvents(
    orgId: string,
    userId: string,
    deviceId: string | undefined,
    events: Parameters<MemoryStore["recordEvents"]>[3]
  ) {
    const result = await super.recordEvents(orgId, userId, deviceId, events);
    await this.persist();
    return result;
  }

  override async createJustification(orgId: string, userId: string, payload: Parameters<MemoryStore["createJustification"]>[2]) {
    const result = await super.createJustification(orgId, userId, payload);
    await this.persist();
    return result;
  }

  override async updateBilling(update: Parameters<MemoryStore["updateBilling"]>[0]) {
    const result = await super.updateBilling(update);
    await this.persist();
    return result;
  }

  override async cleanupExpiredRecords() {
    await super.cleanupExpiredRecords();
    await this.persist();
  }

  private async loadSnapshot(): Promise<SerializedMemoryState | null> {
    try {
      const response = await this.client.send(
        new GetObjectCommand({
          Bucket: this.bucket,
          Key: this.key
        })
      );
      if (!response.Body) {
        return null;
      }
      const contents = await bodyToString(response.Body);
      if (!contents.trim()) {
        return null;
      }
      const snapshot = JSON.parse(contents) as SerializedMemoryState;
      if (snapshot.version !== 1) {
        throw new Error(`Unsupported store snapshot version: ${snapshot.version}`);
      }
      return snapshot;
    } catch (error) {
      if (
        error instanceof NoSuchKey ||
        (typeof error === "object" &&
          error !== null &&
          "name" in error &&
          ((error as { name?: string }).name === "NoSuchKey" ||
            (error as { name?: string }).name === "NoSuchBucket"))
      ) {
        return null;
      }
      throw error;
    }
  }

  private async persist(): Promise<void> {
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: this.key,
        Body: JSON.stringify(this.snapshotState(), null, 2),
        ContentType: "application/json"
      })
    );
  }
}
