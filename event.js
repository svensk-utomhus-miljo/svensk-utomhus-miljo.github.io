/**
 * @param {*} target - The CSS selector for the target elements
 * @param {string} selector - The CSS selector for the target elements
 * @param {string} eventType - The event to listen for (e.g., 'click')
 * @param {function(Event): void} handler - The callback function
 * @returns {void}
 */
function on(target, eventType, selector, handler) {
  target.addEventListener(eventType, event => {
    const target = event.target
    if (target.matches(selector)) {
      handler(event)
    }
  }, {
    passive: true,
    capture: true
  })
}

export { on }