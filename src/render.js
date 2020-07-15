import {VNodeFlags, ChildrenFlags} from "./flags.js"

export default function (vnode, container) {
    const prevVNode = container.vnode
    if (prevVNode) {
        if (vnode) {
            patch(prevVNode, vnode, container)
            container.vnode = vnode
        } else {
            container.removeChild(prevVNode.el)
            container.vnode = null
        }
    } else {
        if (vnode) {
            mount(vnode, container)
            container.vnode = vnode
        }
    }
}

function mount(vnonde, container, isSVG) {
    const {flags} = vnonde
    if (!flags) {
        return
    }
    if (flags & VNodeFlags.ELEMENT) {
        mountElement(vnonde, container, isSVG)
    } else if (flags & VNodeFlags.COMPONENT) {
        mountComponent(vnonde, container, isSVG)
    } else if (flags & VNodeFlags.TEXT) {
        mountText(vnonde, container, isSVG)
    } else if (flags & VNodeFlags.FRAGMENT) {
        mountFragment(vnonde, container, isSVG)
    } else if (flags & VNodeFlags.PORTAL) {
        mountPortal(vnonde, container, isSVG)
    }
}

function mountElement(vnode, container, isSVG) {
    const domProp = /^[A-Z]|^(?:value|checked|selected|muted)$/

    // create dom element
    isSVG = isSVG | vnode.flags & VNodeFlags.ELEMENT_SVG
    const el = isSVG
        ? document.createElementNS('http://www.w3.org/2000/svg', vnode.tag)
        : document.createElement(vnode.tag)
        vnode.el = el

    // handle vnodeData
    if (vnode.data) {
        const data = vnode.data
        for (const name in data) {
            switch (name) {
                case 'style':
                    for (let key in data.style) {
                        el.style[key] = data.style[key]
                    }
                    break
                case 'class':
                    if (isSVG) {
                        el.setAttribute('class', data.class)
                    } else {
                        el.className = data.class
                    }
                    break
                default:
                    if (domProp.test(name)) {
                        el[name] = data[name]
                    } else {
                        el.setAttribute(name, data[name])
                    }
                    break
            }
        }
    }

    // handle vnodeChildren
    const {children, childFlags} = vnode
    if (childFlags && childFlags !== ChildrenFlags.NO_CHILDREN) {
        if (childFlags & ChildrenFlags.SINGLE_VNODE) {
            mount(children, el, isSVG)
        } else if (childFlags & ChildrenFlags.KEYED_VNODES) {
            for (let i=0, len=children.length; i < len; i++) {
                const child = children[i]
                mount(child, el, isSVG)
            }
        }
    }

    container.appendChild(el)
}
