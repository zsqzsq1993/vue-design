/* functions related to patch */
import {VNodeFlags, ChildrenFlags} from "../utils/flags.js"
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

function patchComponent(prevVNode, vnode, container) {
    // 检查是否两个组件为不同的组件，若果是，直接进行替换
    if (prevVNode.tag !== vnode.tag) {
        replaceVNode(prevVNode, vnode, container)
    }
    // 检查标志位是否为有状态的组件，进行数据props的更新
    if (vnode.flags & VNodeFlags.COMPONENT_STATEFUL_NORMAL) {
        // 获取实例，并让新的VNode的children引用也指向实例
        const instance = (vnode.children = prevVNode.children)
        // 更新props
        instance.$props = vnode.data
        // 更新
        instance._update()
    // 函数式组件的情况
    } else {
        // 新的vnode上是没有handler的，应指向prevVNode上的
        const handler = (vnode.handler = prevVNode.handler)
        // 对handler上的内容进行更新
        handler.prev = prevVNode
        handler.next = vnode
        handler.container = container
        // 直接调用_update()函数对其重新拆包
        handler._update()
    }
}

function patchText(prevVNode, vnode, container) {
    if (prevVNode.children !== vnode.children) {
        prevVNode.el.nodeValue = vnode.children
    }
    vnode.el = prevVNode.el
}

function patchFragment(prevVNode, vnode, container) {
    patchChildren(
        prevVNode.childFlags,
        prevVNode.children,
        vnode.childFlags,
        vnode.children,
        container
    )
    if (vnode.childFlags & ChildrenFlags.NO_CHILDREN) {
        vnode.el = prevVNode.el
    } else if (vnode.childFlags & ChildrenFlags.SINGLE_VNODE) {
        vnode.el = vnode.children.el
    } else if (vnode.childFlags & ChildrenFlags.KEYED_VNODES) {
        vnode.el = vnode.children[0].el
    }
}

function patchPortal(prevVNode, vnode, container) {
    const oldTarget = typeof prevVNode.tag === 'string'
        ? document.querySelector(prevVNode.tag)
        : prevVNode.tag

    patchChildren(
        prevVNode.childFlags,
        prevVNode.children,
        vnode.childFlags,
        vnode.children,
        //prevVNode.tag,
        oldTarget
    )

    vnode.el = prevVNode.el

    if(prevVNode.tag !== vnode.tag) {
        const target = typeof vnode.tag === 'string'
            ? document.querySelector(vnode.tag)
            : vnode.tag

        if (vnode.childFlags & ChildrenFlags.NO_CHILDREN) {
        } else if (vnode.childFlags & ChildrenFlags.SINGLE_VNODE) {
            target.appendChild(vnode.children.el)
        } else if (vnode.childFlags & ChildrenFlags.KEYED_VNODES) {
            for (let key in vnode.children) {
                target.appendChild(vnode.children[key].el)
            }
        }
    }
}

function replaceVNode(preVNode, vnode, container) {
    // 如果是组件VNode，需要调用被删除组件的unmounted函数来解除钩子
    if (preVNode.flags & VNodeFlags.COMPONENT_STATEFUL_NORMAL) {
        const instance = preVNode.children
        instance.unmounted && instance.unmounted()
    }
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

                // single - single: repeat patch
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
                        container.removeChild(prevChildren[key].el)
                    }
                    break

                // multiple - single: periodically remove old and add new
                case ChildrenFlags.SINGLE_VNODE:
                    for (let key in prevChildren) {
                        container.removeChild(prevChildren[key].el)
                    }
                    mount(nextChildren, container)
                    break

                // multiple - multiple: core! diff algorithm!
                // can be simplified by periodically remove and periodically add
                default:
                    // without using key
                    function simple() {
                        const prevLength = prevChildren.length
                        const nextLength = nextChildren.length
                        const shorterLength = prevLength < nextLength
                            ? prevLength
                            : nextLength
                        for (let i=0; i < shorterLength; i++) {
                            patch(prevChildren[i], nextChildren[i], container)
                        }
                        if (nextLength === shorterLength) {
                            for (let i=shorterLength; i < prevLength; i++) {
                                container.removeChild(prevChildren[i].el)
                            }
                        } else {
                            for (let i=shorterLength; i< nextLength; i++) {
                                mount(nextChildren[i], container)
                            }
                        }
                    }

                    // react的diff算法
                    function react() {
                        // 最大索引标志位
                        let lastIndex = 0
                        // 外层遍历所有新children
                        for (let i=0, nextLen = nextChildren.length; i < nextLen; i++) {
                            // 是否找到标志位
                            let find = false
                            // 当前新child
                            const nextVNode = nextChildren[i]

                            // 内层遍历所有旧children
                            for (let j=0, prevLen = prevChildren.length; j < prevLen; j++) {
                                // 当前旧child
                                const prevVNode = prevChildren[j]
                                // 对key值进行判断
                                if (prevVNode.key === nextVNode.key) {
                                    // 标志为找到
                                    find = true
                                    // 先打布丁
                                    patch(prevVNode, nextVNode, container)
                                    // 判断旧vnode指向的el是否需要根据新vnode交换位置
                                    if (j < lastIndex) {
                                        // 需要移动
                                        const refNode = nextChildren[i-1].el.nextSibling
                                        container.insertBefore(prevVNode.el, refNode)
                                    } else {
                                        // 无需移动，更新最大索引
                                        lastIndex = j
                                    }
                                }
                            }

                            // 若果没有找到相同key值的旧child
                            if (!find) {
                                // 新child为新添加，要进行挂载
                                const refNode = i - 1 < 0
                                    ? prevChildren[0].el
                                    : nextChildren[i-1].el.nextSibling
                                mount(nextVNode, container, false, refNode)
                            }
                        }

                        // 再遍历一次旧的children
                        for (let j=0, prevLen = prevChildren.length; j < prevLen; j++) {
                            // 当前旧child
                            const prevChild = prevChildren[j]
                            // 是否存在new child与当前旧child的值相等
                            const has = nextChildren.find(
                                nextChild => nextChild.key === prevChild.key
                            )
                            if (!has) {
                                // 如果没有，需要移除
                                container.removeChild(prevChild.el)
                            }
                        }
                    }

                    // vue2的diff算法（双端比较）
                    function vue2() {
                        // 初始化双端的索引值
                        let prevStartIndex = 0
                        let prevEndIndex = prevChildren.length - 1
                        let nextStartIndex = 0
                        let nextEndIndex = nextChildren.length - 1

                        // 初始化双端的value
                        let prevStart = prevChildren[prevStartIndex]
                        let prevEnd = prevChildren[prevEndIndex]
                        let nextStart = nextChildren[nextStartIndex]
                        let nextEnd = nextChildren[nextEndIndex]

                        // 循环比较
                        while(prevStartIndex <= prevEndIndex
                        && nextStartIndex <= nextEndIndex) {
                            // 由于之前移动prevChildren中可能会存在undefined
                            if (!prevStart) {
                                // 跳过
                                prevStart = prevChildren[++prevStartIndex]
                            } else if (!prevEnd) {
                                // 跳过
                                prevEnd = prevChildren[--prevEndIndex]
                            } else

                            // 开始四次双端比较
                            if (prevStart.key === nextStart.key) {
                                // 先patch，无需移动
                                patch(prevStart, nextStart, container)
                                // 更新索引及端值
                                prevStart = prevChildren[++prevStartIndex]
                                nextStart = nextChildren[++nextStartIndex]
                            } else if (prevEnd.key === nextEnd.key) {
                                // 先patch，无需移动
                                patch(prevEnd, nextEnd, container)
                                // 更新索引及端值
                                prevEnd = prevChildren[--prevEndIndex]
                                nextEnd = nextChildren[--nextEndIndex]
                            } else if (prevStart.key === nextEnd.key) {
                                // 先patch，需要将当前prevStart.el移动至"最后"
                                patch(prevStart, nextEnd, container)
                                container.insertBefore(prevStart.el, prevEnd.el.nextSibling)
                                // 更新索引及端值
                                prevStart = prevChildren[++prevStartIndex]
                                nextEnd = nextChildren[--nextEndIndex]
                            } else if (prevEnd.key === nextStart.key) {
                                // 先patch，需要将当前prevEnd.el移动至"最前"
                                patch(prevEnd, nextStart, container)
                                container.insertBefore(prevEnd.el, prevStart.el)
                                // 更新索引及端值
                                prevEnd = prevChildren[--prevEndIndex]
                                nextStart = nextChildren[++nextStartIndex]
                            } else {
                                // 若在双端无法匹配，则将nextStart进行遍历匹配
                                const find = prevChildren.find(
                                    prevChild => prevChild === nextStart
                                )

                                if (find) {
                                    // 若有匹配项，先patch，再移动
                                    const prevChild = prevChildren[find]
                                    patch(prevChild, nextStart, container)
                                    container.insertBefore(prevChild.el, prevStart.el)
                                    // 需要将原VNode数组位置置为undefined
                                    prevChildren[find] = undefined
                                } else {
                                    // 若无匹配项，为新元素，直接挂载在"最前"
                                    mount(nextStart, container, false, prevStart.el)
                                }

                                // 无论如何，都需要更新nextStart & nextStartIndex
                                nextStart = nextChildren[++nextStartIndex]
                            }
                        }

                        // 处理忽略添加的新节点
                        if (prevEndIndex < prevStartIndex) {
                            for (let i = nextStartIndex; i <= nextEndIndex; i++) {
                                mount(nextChildren[i], container, false, prevStart.el)
                            }
                        }

                        // 处理忽略删除的旧节点
                        if (nextEndIndex < nextStartIndex) {
                            for (let i = prevStartIndex; i <= prevEndIndex; i++) {
                                container.removeChild(prevChildren[i].el)
                            }
                        }

                    }

                    vue2()
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
