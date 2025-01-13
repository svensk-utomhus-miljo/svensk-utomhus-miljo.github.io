/**
 * @typedef {Object} Context
 * @property {Request} request - The HTTP request object
 * @property {URL} url - The URL of the request
 * @property {Object|null} match - The result of a URL pattern match
 * @property {Object} metadata - Arbitrary metadata associated with the request
 * @property {Response} response - The response object
 * @property {Event} event - The event triggering the request
 */

/**
 * @typedef {(ctx: Context) => boolean} Matcher
 * A function that determines whether the current context matches the route.
 */

/**
 * @typedef {(ctx: Context) => Promise<Response|undefined>|Response|undefined} Handler
 * A function that handles the request if the route matches.
 */

/**
 * @typedef {Object} RouterOptions
 * @property {Array<[string, Matcher, Handler[]]>} [routes] - Initial routes for the router
 */

/**
 * Router creates a routing object that handles HTTP requests.
 * @param {RouterOptions} [options={}] - Configuration options for the router
 */
function Router({ routes = [] } = {}) {
  return {
    __proto__: new Proxy({}, {
      get: (target, prop, receiver) => (matcher, ...handlers) => {
        if (typeof matcher !== 'function') {
          const pattern = typeof matcher === 'object' || matcher?.startsWith('http')
            ? new URLPattern(matcher)
            : new URLPattern({ pathname: matcher })
          matcher = o => (o.match = pattern.exec(o.url))
        }
        return routes.push([
          prop.toUpperCase(),
          matcher,
          handlers,
        ]) && receiver
      }
    }),
    routes,
    /**
     * Handles an HTTP request event.
     * @param {FetchEvent} event - The fetch event to handle
     * @param {Partial<Context>} [ctx={}] - The initial context for the request
     * @returns {Promise<Response|undefined>}
     */
    async handle (event, ctx = {}) {
      let response
      ctx.url = new URL(event.request.url)
      ctx.event = event
      ctx.request = event.request
      ctx.match = undefined
      ctx.response = {
        status: 200,
        headers: new Headers(),
        body: null
      }
      ctx.metadata = {}
      for (let [method, matcher, handlers] of routes) {
        const matchMethod = method === 'ALL' || method === ctx.request.method
        if (matchMethod && matcher(ctx)) {
          for (let handler of handlers) {
            if ((response = await handler(ctx)) !== undefined) return response
          }
        }
      }
    }
  }
}

export { Router }