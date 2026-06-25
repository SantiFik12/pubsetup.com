import {
  createStartHandler,
  defaultStreamHandler,
} from '@tanstack/react-start/server'
import type { Register } from '@tanstack/react-router'
import type { RequestHandler } from '@tanstack/react-start/server'
import { runWithCloudflareEnv, type CloudflareEnv } from './lib/cloudflare-env.server'

const fetch = createStartHandler(defaultStreamHandler)

export type ServerEntry = { fetch: RequestHandler<Register> }

export function createServerEntry(entry: ServerEntry): ServerEntry {
  return {
    async fetch(request, env?: CloudflareEnv, ctx?: unknown) {
      return runWithCloudflareEnv(env ?? {}, () =>
        entry.fetch(request, { context: { cloudflare: { env, ctx } } } as any),
      )
    },
  }
}

export default createServerEntry({ fetch })
