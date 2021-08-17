import render from './render';
import patch from './patch';

class Component {
  constructor(props) {
    this.props = props || {};
    this.state = null;
  }

  static render(vdom, parent = null) {
    const props = Object.assign({}, vdom.props, { children: vdom.children });
    if (Component.isPrototypeOf(vdom.type)) {
      const instance = new vdom.type(props);
      instance.componentWillMount();
      instance.base = render(instance.render(), parent);
      instance.base.__instance = instance;
      instance.base.__key = vdom.props.key;
      instance.componentDidMount();
      return instance.base;
    } else {
      return render(vdom.type(props), parent);
    }
  }

  static patch(dom, vdom, parent = dom.parentNode) {
    const props = Object.assign({}, vdom.props, { children: vdom.children });
    if (dom.__instance && dom.__instance.constructor === vdom.type) {
      dom.__instance.componentWillReceiveProps(props);
      dom.__instance.props = props;
      return patch(dom, dom.__instance.render(), parent);
    } else if (Component.isPrototypeOf(vdom.type)) {
      const ndom = Component.render(vdom, parent);
      return parent ? parent.replaceChild(ndom, dom) && ndom : ndom;
    } else if (!Component.isPrototypeOf(vdom.type)) {
      return patch(dom, vdom.type(props), parent);
    }
  }

  setState(nextState) {
    if (this.base && this.shouldComponentUpdate(this.props, nextState)) {
      const prevState = this.state;
      this.componentWillUpdate(this.props, nextState);
      this.state = nextState;
      patch(this.base, this.render());
      this.componentDidUpdate(this.props, prevState);
    } else {
      // maybe just do nothing?
      this.state = nextState;
    }
  }

  shouldComponentUpdate(nextProps, nextState) {
    return nextProps != this.props || nextState != this.state;
  }

  componentWillReceiveProps(nextProps) {
    return undefined;
  }

  componentWillUpdate(nextProps, nextState) {
    return undefined;
  }

  componentDidUpdate(prevProps, prevState) {
    return undefined;
  }

  componentWillMount() {
    return undefined;
  }

  componentDidMount() {
    return undefined;
  }

  componentWillUnmount() {
    return undefined;
  }
}

export { Component };
export default Component;
