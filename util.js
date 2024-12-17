
/**
 * Non-null casting like TypeScript's [Non-null Assertion Operator][1].
 *
 * It removes `null` and `undefined` from a type without doing any explicit
 * checking. It's effectively a type assertion that `value` isn’t `null` or
 * `undefined`. Just like other type assertions, this doesn’t change the runtime
 * behavior of your code, so it’s important to only use it when you know that
 * the value can’t be `null` or `undefined`.
 *
 * [1]: https://www.typescriptlang.org/docs/handbook/2/everyday-types.html#non-null-assertion-operator-postfix-
 *
 * @template T
 * @param {T} [value] - The value to assert as non-null
 * @returns {NonNullable<T>} `value` unchanged
 */
function nn(value) {
  return /** @type {NonNullable<T>} */ (value);
}

const template = document.createElement('template')

// funktion för att interpolera HTML med attribut och värden
function html(strings, ...values) {
  let i = 0
  let str = strings[0]

  // Skapa data-attribut för varje värde i interpoleringen
  for (let x of values) {
    const lastSpaceIndex = str.lastIndexOf(' ')
    const lastWord = str.slice(lastSpaceIndex + 1, -1)
    str = str.slice(0, lastSpaceIndex) +  ` data-x${i++}="${lastWord}" ` + strings[i]
  }


  template.innerHTML = str
  let dom = template.content.cloneNode(true)

  // Koppla tillbaka värden till DOM-elementen
  while (i) {
    const x = dom.querySelector(`[data-x${--i}]`)
    const attribute = x.dataset['x'+i]
    delete x.dataset['x'+i]

    // Om attributnamnet börjar med 'on', bind det med addEventListener
    attribute.startsWith('on')
      ? x.addEventListener(attribute.slice(2), values[i])
      : (x[attribute] = values[i])
  }

  return dom
}

// Centrera kartan till marker-positionen
globalThis.centerMapOnMarker = function centerMapOnMarker(marker) {
  const position = marker.position
  if (position) {
    map.setCenter(position)
  } else {
    console.error('Marker position is not defined')
  }
}

export {
  nn,
  html
}