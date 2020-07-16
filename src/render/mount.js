/* functions related to mount */
import {ChildrenFlags, VNodeFlags} from "../utils/flags.js"
import {createTextNode} from "../h/h.js"
import {patchData} from "./patch.js"

export default function mount(vnonde, container, isSVG) {
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
            patchData(el, name, null, data[name], isSVG)
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

function mountComponent(vnode, container, isSVG) {
    if (vnode.flags & VNodeFlags.COMPONENT_FUNCTIONAL) {
        mountFunctionalComponent(vnode, container, isSVG)
    } else if (vnode.flags & VNodeFlags.COMPONENT_STATEFUL) {
        mountStatefulComponent(vnode, container, isSVG)
    }
}

function mountFunctionalComponent(vnode, container, isSVG) {
    const $vnode = vnode.tag()
    vnode.el = $vnode.el
    mount($vnode, container, isSVG)
}

function mountStatefulComponent(vnode, container, isSVG) {
    const instance = new vnode.tag()
    instance.$vnode = instance.render()
    vnode.el = instance.$el = instance.$vnode.el
    mount(instance.$vnode, container, isSVG)
}

function mountText(vnode, container) {
    const el = document.createTextNode(vnode.children)
    vnode.el = el
    container.appendChild(el)
}

function mountFragment(vnode, container, isSVG) {
    const {childFlags, children} = vnode
    if (childFlags & ChildrenFlags.SINGLE_VNODE) {
        mount(children, container, isSVG)
        vnode.el = children.el
    } else if (childFlags & ChildrenFlags.KEYED_VNODES) {
        for (let i=0, len = children.length; i < len; i++) {
            const child = children[i]
            mount(child, container, isSVG)
        }
        vnode.el = children[0].el
    } else {
        const placeholder = createTextNode('')
        mountText(placeholder, container)
        vnode.el = placeholder.el
    }
}

function mountPortal(vnonde, container, isSVG) {
    const {childFlags, children} = vnonde
    let target = vnonde.tag
    target = typeof target === 'string'
        ? document.querySelector(target)
        : target
    if (childFlags & ChildrenFlags.SINGLE_VNODE) {
        mount(children, target, isSVG)
    } else if (childFlags & ChildrenFlags.KEYED_VNODES) {
        for (let i=0, len = children.length; i < len; i++) {
            const child = children[i]
            mount(child, target, isSVG)
        }
    }

    const placeholder = createTextNode('')
    mountText(placeholder, container)
    vnonde.el = placeholder.el
}