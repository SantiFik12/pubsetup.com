import { AsyncLocalStorage } from 'node:async_hooks'

export interface SendEmailBinding {
  send(message: unknown): Promise<void>
}

export interface CloudflareEnv extends Record<string, unknown> {
  SEND_EMAIL?: SendEmailBinding
}

const storage = new AsyncLocalStorage<CloudflareEnv>()

export function runWithCloudflareEnv<T>(env: CloudflareEnv, callback: () => T): T {
  return storage.run(env, callback)
}

export function getCloudflareEnv(): CloudflareEnv {
  return storage.getStore() ?? {}
}
