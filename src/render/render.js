import mount from "./mount.js"
import patch from "./patch.js"

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

