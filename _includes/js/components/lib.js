
export function createElement (DOMString) {
  // Return an HTML element object for the given DOM string.
  const wrapper = document.createElement("div")
  wrapper.innerHTML = DOMString.trim()
  const el = wrapper.firstChild
  wrapper.removeChild(el)
  return el
}
