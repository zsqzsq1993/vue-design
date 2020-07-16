import {VNodeFlags, ChildrenFlags} from "./flags.js"

export const Fragment = Symbol()

export const Portal = Symbol()

export default function (tag, data = null, children = null) {
    // Generate flags
    let flags = null
    if (typeof tag === 'string') {
        flags = tag === 'svg'
            ? VNodeFlags.ELEMENT_SVG
            : VNodeFlags.ELEMENT_HTML
        if (data && data.class) {
            data.class = normalizeClass(data.class)
        }
    } else if (tag === Fragment) {
        flags = VNodeFlags.FRAGMENT
    } else if (tag === Portal) {
        flags = VNodeFlags.PORTAL
        tag = data && data.target
    } else if (tag !== null && typeof tag === 'object') {
        flags = tag.functional
            ? VNodeFlags.COMPONENT_FUNCTIONAL
            : VNodeFlags.COMPONENT_STATEFUL_NORMAL
    } else if (typeof tag === 'function') {
        flags = tag.prototype && tag.prototype.render
            ? VNodeFlags.COMPONENT_STATEFUL_NORMAL
            : VNodeFlags.COMPONENT_FUNCTIONAL
    }

    // Generate childFlags
    let childFlags = null
    if (Array.isArray(children)) {
        if (children.length === 0) {
            childFlags = ChildrenFlags.NO_CHILDREN
        } else if (children.length === 1) {
            childFlags = ChildrenFlags.SINGLE_VNODE
            children = children[0]
        } else {
            childFlags = ChildrenFlags.KEYED_VNODES
            children = normalizeVNodes(children)
        }
    } else if (children == null) {
        childFlags = ChildrenFlags.NO_CHILDREN
    } else if (children._isVNode) {
        childFlags = ChildrenFlags.SINGLE_VNODE
    } else {
        childFlags = ChildrenFlags.SINGLE_VNODE
        children = createTextNode(children)
    }

    return {
        _isVNode: true,
        flags,
        childFlags,
        tag,
        data,
        children,
        el: null
    }
}

function normalizeClass(data) {
    let retClass = ''
    if (typeof data === 'string') {
        retClass = data
    } else if (Array.isArray(data)) {
        for(let val of data) {
            retClass += normalizeClass(val) + ' '
        }
    } else if (data !== null && typeof data === 'object') {
        for (let name in data) {
            if (data[name]) {
                retClass += name + ' '
            }
        }
    }
    return retClass.trim()
}

function normalizeVNodes(children) {
    const retArray = []

    for (let idx in children) {
        const child = children[idx]
        if (!child.key) {
            child.key = '|' + idx
        }
        retArray[idx] = child
    }

    return retArray
}

export function createTextNode(text) {
    return {
        _isVNode: true,
        tag: null,
        flags: VNodeFlags.TEXT,
        children: text,
        childFlags: ChildrenFlags.NO_CHILDREN
    }
}
