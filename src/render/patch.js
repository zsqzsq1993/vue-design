/* functions related to patch */
import {VNodeFlags} from "../utils/flags.js"
import mount from "./mount.js"

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
