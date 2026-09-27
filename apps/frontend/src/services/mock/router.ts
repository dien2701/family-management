import type { HandlerContext } from './context'

export type Query = Record<string, unknown>

export type MockRequest = {
  method: string
  path: string
  params: Record<string, string>
  query: Query
  body: unknown
}

export type Handler = (request: MockRequest, context: HandlerContext) => unknown | Promise<unknown>

type Route = { method: string; segments: string[]; handler: Handler }

const split = (path: string) => path.split('/').filter(Boolean)

/** Định tuyến theo method và mẫu path (`/members/:id`). Chỉ những endpoint có handler mới bị giả lập. */
export class MockRouter {
  private readonly routes: Route[] = []

  on(method: string, pattern: string, handler: Handler): this {
    this.routes.push({ method: method.toUpperCase(), segments: split(pattern), handler })
    return this
  }

  match(method: string, path: string) {
    const segments = split(path)
    for (const route of this.routes) {
      if (route.method !== method.toUpperCase() || route.segments.length !== segments.length)
        continue
      const params: Record<string, string> = {}
      const ok = route.segments.every((part, i) => {
        const actual = segments[i]!
        if (part.startsWith(':')) {
          params[part.slice(1)] = decodeURIComponent(actual)
          return true
        }
        return part === actual
      })
      if (ok) return { handler: route.handler, params }
    }
    return null
  }
}
