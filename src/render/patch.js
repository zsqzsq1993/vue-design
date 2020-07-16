/* functions related to patch */
import {VNodeFlags} from "../utils/flags.js"
import mount from "./mount.js"
import {ChildrenFlags} from "../utils/flags"

export default function patch(prevVNode, vnode, container) {
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

    // patch children
    patchChildren(
        prevVNode.childFlags,
        prevVNode.children,
        vnode.childFlags,
        vnode.children,
        el
    )
}

function patchChildren(
    prevChildFlags,
    prevChildren,
    nextChildFlags,
    nextChildren,
    container
) {
    // prev choice * next choice
    switch (prevChildFlags) {
        case ChildrenFlags.NO_CHILDREN:
            switch (nextChildFlags) {
                // none - none: do nothing
                case ChildrenFlags.NO_CHILDREN:
                    break

                // none-single: mount new
                case ChildrenFlags.SINGLE_VNODE:
                    mount(nextChildren, container)
                    break

                // none-multiple: periodically mount new
                default:
                    for (let key in nextChildren) {
                        mount(nextChildren[key], container)
                    }
                    break
            }
            break

        case ChildrenFlags.SINGLE_VNODE:
            switch (nextChildFlags) {
                // single - none: remove old
                case ChildrenFlags.NO_CHILDREN:
                    container.removeChild(prevChildren.el)
                    break

                // single - single: remove old and add new
                case ChildrenFlags.SINGLE_VNODE:
                    patch(prevChildren, nextChildren, container)
                    break

                // single - multiple: remove old and periodically mount new
                default:
                    container.removeChild(prevChildren.el)
                    for (let key in nextChildren) {
                        mount(nextChildren[key], container)
                    }
                    break
            }
            break

        default:
            switch (nextChildFlags) {
                // multiple - none: periodically remove old
                case ChildrenFlags.NO_CHILDREN:
                    for (let key in prevChildren) {
                        container.removeChild(prevChildren[key])
                    }
                    break

                // multiple - single: periodically remove old and add new
                case ChildrenFlags.SINGLE_VNODE:
                    for (let key in prevChildren) {
                        container.removeChild(prevChildren[key])
                    }
                    mount(nextChildren, container)
                    break

                // multiple - multiple: core! diff algorithm!
                // can be simplified by periodically remove and periodically add
                default:
                    for (let key in prevChildren) {
                        container.removeChild(prevChildren[key])
                    }
                    for (let key in nextChildren) {
                        mount(nextChildren[key], container)
                    }
                    break
            }
            break
    }
}


export function patchData(el, key, prevVal, nextVal, isSVG) {
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
