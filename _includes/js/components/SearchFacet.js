
import Base from "./Base.js"
import { createElement } from "./lib.js"


const STYLE = `
  .wrapper {
    font-size: .8em;
    border: solid #343a40 1px;
    border-radius: .25rem;
    overflow: hidden;
    margin-bottom: 2em;
    width: 28em;
  }

  .name {
    font-size: inherit;
    background-color: #343a40;
    color: #ccc;
    padding: .5em;
    font-weight: bold;
    margin-bottom: 0;
    cursor: pointer;
    white-space: nowrap;
    display: flex;
  }

  .collapsed-icon {
    font-weight: bold;
    color: #ccc;
    font-family: monospace;
    font-size: 1.4em;
    margin-left: auto;
  }

  .show-more {
    text-align: center;
    font-size: 1em;
    background-color: #f4f4f4;
    color: #888;
    padding: .1em 0;
    cursor: pointer;
  }

  .value {
    white-space: nowrap;
    padding: .2em .5em;
    border-top: solid #eee 1px;
    position: relative;
    cursor: pointer;
    color: #444;
    background-color: #fff;
    display: flex;
  }

  .value-name {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    padding-right: 1em;
  }

  .value-doc-count {
    margin-left: auto;
  }
`

const ValueElement = (value, selected, docCount) => createElement(
  `<div class="value">
     <span class="value-name">${value}</span>
     <span class="value-doc-count">${docCount}</span>
   </div>`
)

export default class SearchFacet extends Base {
  connectedCallback () {
    super.connectedCallback(STYLE)

    const name = this.getAttribute("name")
    const values = JSON.parse(this.getAttribute("values"))

    const wrapperEl = createElement(
      `<div class="wrapper">
         <h1 class="name">
           ${name}
           <span class="collapsed-icon">-</span>
        </h1>
        <div class="values"></div>
        <div class="show-more">
          show fewer
        </div>
      </div>`
    )
    this.shadow.appendChild(wrapperEl)

    const valuesEl = wrapperEl.querySelector(".values")
    for (const [ name, selected, docCount ] of values) {
      valuesEl.appendChild(ValueElement(name, selected, docCount))
    }

  }
}

customElements.define("search-facet", SearchFacet)
