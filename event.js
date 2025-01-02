const customTargets = new WeakMap()
const customEvents = new Map()

/**
 * @param {*} target - The CSS selector for the target elements
 * @param {string} selector - The CSS selector for the target elements
 * @param {string} eventType - The event to listen for (e.g., 'click')
 * @param {function(Event): void} [handler] - The callback function
 * @returns {void}
 */
function on(target, eventType, selector, handler) {
  target = getEventTarget(target)

  if (arguments.length === 3) {
    target.addEventListener(eventType, selector)
    return
  }
  const t = target
  target.addEventListener(eventType, event => {
    const target = event.currentTarget
    const path = event.composedPath()
    for (const element of path) {
      if (element === target) break
      if (element.matches(selector)) {
        event.delegateTarget = element
        handler(event)
        break
      }
    }
  }, {
    passive: true,
    capture: true
  })
}

function getEventTarget (target) {
  return target instanceof EventTarget
    ? target
    : customTargets.get(target) ||
        customTargets.set(target, new EventTarget()).get(target)
}

function getEventClass (type) {
  return customEvents.get(type) ||
    customEvents.set(type, class extends Event {
      constructor (type, detail) {
        super(type)
        Object.assign(this, detail)
      }
    }).get(type)
}

function dispatch (target, type, detail) {
  target = getEventTarget(target)
  const klass = getEventClass(type)
  target.dispatchEvent(new klass(type, detail))
}

export { on, dispatch }