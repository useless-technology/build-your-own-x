// const element = {
//     type: 'h1',
//     props: {
//         title: 'foo',
//         children: 'Hello'
//     }
// }

// const container = document.querySelector('#root')

// const node = document.createElement(element.type)
// node['title'] = element.props.title

// const text = document.createTextNode('')
// text['nodeValue'] = element.props.children

// node.appendChild(text)
// container.appendChild(node)

// @ts-check

const TEXT_ELEMENT = 'TEXT_ELEMENT'

const createTextElement = text => ({
    type: TEXT_ELEMENT,
    props: {
        nodeValue: text,
        children: []
    }
})

// `make` children always be an array
const createElement = (type, props, ...children) => ({
    type,
    props: {
        ...props,
        // The children array could also contain primitive values like strings or numbers.
        // React doesn’t wrap primitive values or create empty arrays when there aren’t children, but we do it.
        children: children.map(child =>
            typeof child === 'object' ? child : createTextElement(child)
        )
    }
})

const render = (element, container) => {
    const dom =
        element.type === TEXT_ELEMENT
            ? document.createTextNode('')
            : document.createElement(element.type)

    Object.keys(element.props)
        .filter(k => k !== 'children')
        .forEach(k => (dom[k] = element.props[k]))

    element.props.children.forEach(child => render(child, dom))

    container.appendChild(dom)
}

const Act = {
    createElement,
    render
}

/** @jsx Act.createElement */
const element = (
    <div id='foo'>
        <a href=''>bar</a>
    </div>
)

Act.render(element, document.getElementById('root'))
