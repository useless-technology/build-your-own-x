// @ts-check

const isEvent = k => k.startsWith('on')
const isProperty = k => k !== 'children' && !isEvent(k)

const TEXT_ELEMENT = 'TEXT_ELEMENT'
const PLACEMENT = 'PLACEMENT'
const DELETION = 'DELETION'
const UPDATE = 'UPDATE'

let nextUnitOfWork = null
let currentRoot = null
let wipRoot = null
let deletions = null
let wipFiber = null
let hookIndex = null

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

const createDom = fiber => {
    const dom =
        fiber.type === TEXT_ELEMENT
            ? document.createTextNode('')
            : document.createElement(fiber.type)

    updateDom(dom, {}, fiber.props)

    return dom
}

const updateDom = (dom, prevProps, nextProps) => {
    Object.keys(prevProps)
        .filter(isEvent)
        .filter(k => !(k in nextProps) || prevProps[k] !== nextProps[k])
        .forEach(k => {
            const eventType = k.toLowerCase().substring(2)
            dom.removeEventLister(eventType, prevProps[k])
        })

    Object.keys(prevProps)
        .filter(isProperty)
        .filter(k => !(k in nextProps))
        .forEach(k => (dom[k] = ''))

    Object.keys(nextProps)
        .filter(isProperty)
        .filter(k => prevProps[k] !== nextProps[k])
        .forEach(k => (dom[k] = nextProps[k]))

    Object.keys(nextProps)
        .filter(isEvent)
        .filter(k => prevProps[k] !== nextProps[k])
        .forEach(k => {
            const eventType = k.toLowerCase().substring(2)
            dom.addEventListener(eventType, nextProps[k])
        })
}

const commitRoot = () => {
    deletions.forEach(commitWork)
    commitWork(wipRoot.child)
    currentRoot = wipRoot
    wipRoot = null
}

const commitWork = fiber => {
    if (!fiber) {
        return
    }

    let domParentFiber = fiber.parent
    console.log(domParentFiber)
    while (!domParentFiber.dom) {
        domParentFiber = domParentFiber.parent
    }
    const domParent = domParentFiber.dom
    if (fiber.effectTag === PLACEMENT && fiber.dom != null) {
        domParent.appendChild(fiber.dom)
    } else if (fiber.effectTag === UPDATE && fiber.dom != null) {
        updateDom(fiber.dom, fiber.alternate.props, fiber.props)
    } else if (fiber.effectTag === DELETION) {
        commitDeletion(fiber, domParent)
    }

    commitWork(fiber.child)
    commitWork(fiber.sibling)
}

const commitDeletion = (fiber, domParent) => {
    if (fiber.dom) {
        domParent.removeChild(fiber.dom)
    } else {
        commitDeletion(fiber.child, domParent)
    }
}

const render = (element, container) => {
    wipRoot = {
        dom: container,
        props: {
            children: [element]
        },
        alternate: currentRoot
    }
    deletions = []
    nextUnitOfWork = wipRoot
}

const workLoop = deadline => {
    let shouldYield = false

    // still have next work & should not be yielded(have enough remaining time)
    while (nextUnitOfWork && !shouldYield) {
        nextUnitOfWork = performUnitOfWork(nextUnitOfWork)
        shouldYield = deadline.timeRemaining() < 1
    }

    if (!nextUnitOfWork && wipRoot) {
        commitRoot()
    }

    requestIdleCallback(workLoop)
}

requestIdleCallback(workLoop)

/**
 * add the element to the DOM
 * create fibers for the element's children
 * select next unit of work and return it
 */
const performUnitOfWork = fiber => {
    const isFunctionComponent = fiber.type instanceof Function

    if (isFunctionComponent) {
        updateFunctionComponent(fiber)
    } else {
        updateHostComponent(fiber)
    }

    if (fiber.child) {
        return fiber.child
    }
    let nextFiber = fiber
    while (nextFiber) {
        if (nextFiber.sibling) {
            return nextFiber.sibling
        }
        nextFiber = nextFiber.parent
    }
}

const updateHostComponent = fiber => {
    if (!fiber.dom) {
        fiber.dom = createDom(fiber)
    }
    reconcileChildren(fiber, fiber.props.children)
}

const updateFunctionComponent = fiber => {
    wipFiber = fiber
    hookIndex = 0
    wipFiber.hooks = []
    // exe fuc
    const children = [fiber.type(fiber.props)]
    reconcileChildren(fiber, children)
}

// To organize the units of work, use fiber tree(a special data structure)

const reconcileChildren = (wipFiber, elements) => {
    let index = 0
    let oldFiber = wipFiber.alternate && wipFiber.alternate.child
    let prevSibling = null

    // *
    while (index < elements.length || oldFiber != null) {
        const element = elements[index]
        let newFiber = null

        const sameType = oldFiber && element && oldFiber.type === element.type

        if (sameType) {
            newFiber = {
                type: element.type,
                props: element.props,
                dom: oldFiber.dom,
                paren: wipFiber,
                alternate: oldFiber,
                effectTag: UPDATE
            }
        }

        if (element && !sameType) {
            newFiber = {
                type: element.type,
                props: element.props,
                dom: null,
                parent: wipFiber,
                alternate: null,
                effectTag: PLACEMENT
            }
        }

        if (oldFiber && !sameType) {
            oldFiber.effectTag = DELETION
            deletions.push(oldFiber)
        }

        if (oldFiber) {
            oldFiber = oldFiber.sibling
        }

        if (index === 0) {
            wipFiber.child = newFiber
        } else if (element) {
            // @ts-ignore
            prevSibling.sibling = newFiber
        }

        prevSibling = newFiber
        index++
    }
}

const useState = initial => {
    const oldHook =
        wipFiber.alternate &&
        wipFiber.alternate.hooks &&
        wipFiber.alternate.hooks[hookIndex]
    const hook = {
        state: oldHook ? oldHook.state : initial,
        queue: []
    }
    const actions = oldHook ? oldHook.queue : []
    actions.forEach(action => (hook.state = action(hook.state)))

    const setState = action => {
        hook.queue.push(action)
        wipRoot = {
            dom: currentRoot.dom,
            props: currentRoot.props,
            alternate: currentRoot
        }
        nextUnitOfWork = wipRoot
        deletions = []
    }

    wipFiber.hooks.push(hook)
    hookIndex++
    return [hook.state, setState]
}

/**
 * Test
 */

/** @jsx createElement */
const Counter = () => {
    const [state, setState] = useState(1)
    return (
        <h1
            onClick={() => setState(c => c + 1)}
            // @ts-ignore
            style='user-select: none'
        >
            Counter is {state}
        </h1>
    )
}
const element = <Counter />
const container = document.getElementById('root')

render(element, container)
