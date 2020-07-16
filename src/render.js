import {VNodeFlags, ChildrenFlags} from "./flags.js"
import {createTextNode} from "./h.js"

/* render function */
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

/* functions related to mount */
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

/* functions related to patch */
function patch(prevVNode, vnode, container) {
    const preFlags = prevVNode.flags
    const nextFlags = vnode.flags

    if (preFlags !== nextFlags) {
        replaceVNode(prevVNode, vnode, container)
    } else if (nextFlags & VNodeFlags.ELEMENT) {
        patchElement(prevVNode, vnode, container)
    } else if (nextFlags & VNodeFlags.TEXT) {
        patchText(prevVNode, vnode, container)
    } else if (nextFlags & VNodeFlags.COMPONENT) {
        patchComponent(prevVNode, vnode, container)
    } else if (nextFlags & VNodeFlags.FRAGMENT) {
        patchFragment(prevVNode, vnode, container)
    } else if (nextFlags & VNodeFlags.PORTAL) {
        patchPortal(prevVNode, vnode, container)
    } else {
        throw new Error('flags error.')
    }
}

function replaceVNode(preVNode, vnode, container) {
    container.removeChild(preVNode.el)
    mount(vnode, container)
}

function patchElement(prevVNode, vnode, container) {
    if (prevVNode.tag !== vnode.tag) {
        replaceVNode(prevVNode, vnode, container)
        return
    }

    const el = (vnode.el = prevVNode.el)

    // patch vnodeData
    const nextData = vnode.data
    const prevData = prevVNode.data

    if (nextData) {
        for(let key in nextData) {
            const nextVal = nextData[key]
            const prevVal = prevData[key] // might be undefined
            patchData(el, key, prevVal, nextVal)
        }
    }

    if (prevData) {
        for (let key in prevData) {
            if (!nextData.hasOwnProperty(key)) {
                const nextVal = null
                const prevVal = prevData[key]
                patchData(el, key, prevVal, nextVal)
            }
        }
    }
}

function patchData(el, key, prevVal, nextVal, isSVG) {
    const domProp = /^[A-Z]|^(?:value|checked|selected|muted)$/

    switch (key) {
        case 'style':
            for (let k in nextVal) {
                el.style[k] = nextVal[k]
            }
            for (let k in prevVal) {
                if (!nextVal.hasOwnProperty(k)) {
                    el.style[k] = ''
                }
            }
            break
        case 'class':
            if (isSVG) {
                el.setAttribute('class', nextVal)
            } else {
                el.className = nextVal
            }
            break
        default:
            if (key[0] === 'o' && key[1] === 'n') {
                if (nextVal) {
                    el.addEventListener(key.slice(2), nextVal)
                }
                if (prevVal) {
                    el.removeEventListener(key.slice(2), prevVal)
                }
            }
            if (domProp.test(key)) {
                el[key] = nextVal
            } else {
                el.setAttribute(key, nextVal)
            }
            break
    }
}
