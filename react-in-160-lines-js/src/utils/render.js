import setAttribute from './setAttribute';
import Component from './component.class';

const render = (vdom, parent = null) => {
  const mount = parent ? (el) => parent.appendChild(el) : (el) => el;
  if (typeof vdom === 'string' || typeof vdom === 'number') {
    return mount(document.createTextNode(vdom));
  } else if (typeof vdom === 'boolean' || vdom === null) {
    return mount(document.createTextNode(''));
  } else if (typeof vdom === 'object' && typeof vdom.type === 'function') {
    return Component.render(vdom, parent);
  } else if (typeof vdom === 'object' && typeof vdom.type === 'string') {
    const dom = mount(document.createElement(vdom.type));
    for (const child of [...vdom.children]) {
      render(child, dom);
    }
    for (const prop in vdom.props) {
      setAttribute(dom, prop, vdom.props[prop]);
    }
    return dom;
  } else {
    console.log(vdom, typeof vdom, typeof vdom.type);
    throw new Error(`Invalid VDOM: ${vdom}.`);
  }
};

export { render };
export default render;
