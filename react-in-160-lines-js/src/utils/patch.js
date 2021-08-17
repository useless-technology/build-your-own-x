import render from './render';
import setAttribute from './setAttribute';
import Component from './component.class';

const patch = (dom, vdom, parent = dom.parentNode) => {
  const replace = parent ? (el) => parent.replaceChild(el, dom) && el : (el) => el;

  if (typeof vdom === 'object' && typeof vdom.type === 'function') {
    // component vdom && any kind dom
    // function component
    return Component.patch(dom, vdom, parent);
  } else if (typeof vdom !== 'object' && dom instanceof Text) {
    // primitive vdom && text dom
    // both text and compare their content
    return dom.textContent !== vdom ? replace(render(vdom, parent)) : dom;
  } else if (typeof vdom === 'object' && dom instanceof Text) {
    // complex vdom && text dom
    // different type
    return replace(render(vdom, parent));
  } else if (typeof vdom === 'object' && dom.nodeName !== vdom.type.toUpperCase()) {
    // complex vdom && element dom with different type
    // different tag name ? => nodeName is not same with tagName
    return replace(render(vdom, parent));
  } else if (typeof vdom === 'object' && dom.nodeName === vdom.type.toUpperCase()) {
    // complex vdom && element dom with same type
    const pool = {};
    const active = document.activeElement;
    [...dom.childNodes].map((child, index) => {
      const key = child.__key || `__index_${index}`;
      pool[key] = child;
    });
    [...vdom.children].map((child, index) => {
      const key = (child.props && child.props.key) || `__index_${index}`;
      // if same key, compare them, or append new child
      dom.appendChild(pool[key] ? patch(pool[key], child) : render(child, dom));
      delete pool[key];
    });
    for (const key in pool) {
      const instance = pool[key].__instance;
      if (instance) {
        instance.componentWillUnmount();
      }
      // why not use delete pool[key], because it remove real dom in html
      pool[key].remove();
    }
    for (const attr of dom.attributes) dom.removeAttribute(attr.name);
    for (const prop in vdom.props) setAttribute(dom, prop, vdom.props[prop]);
    active.focus();
    return dom;
  }
};

export { patch };
export default patch;
