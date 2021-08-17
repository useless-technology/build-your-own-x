const setAttribute = (dom, key, value) => {
  if (typeof value === 'function' && key.startsWith('on')) {
    const eventType = key.slice(2).toLowerCase();
    // avoid null / undefined
    dom.__handlers = dom.__handlers || {};
    // cover old event listener
    dom.removeEventListener(eventType, dom.__handlers[eventType]);
    dom.__handlers[eventType] = value;
    dom.addEventListener(eventType, dom.__handlers[eventType]);
  } else if (key === 'checked' || key === 'value' || key === 'className') {
    dom[key] = value;
  } else if (key === 'style' && typeof value === 'object') {
    // may be moved to dom[key] = value
    Object.assign(dom.style, value);
  } else if (key === 'ref' && typeof value === 'function') {
    value(dom);
  } else if (key === 'key') {
    dom.__key = value;
  } else if (typeof value !== 'object' && typeof value !== 'function') {
    dom.setAttribute(key, value);
  }
};

export { setAttribute };
export default setAttribute;
