import {h, render, Fragment, Portal} from "../src"

(function () {
    const container = document.getElementById('test1')

    const prevVNode = h('div', {
        style: {
            margin: '20px',
            width: '35px',
            height: '35px',
            background: 'red'
        },
        class: 'prev'
    })

    const nextVNode = h('div', {
        style: {
            width: '50px',
            height: '50px',
            background: 'blue',
            border: '5px solid black'
        }
    })

    render(prevVNode, container)

    const timer = setTimeout(() => {
        render(nextVNode, container)
        clearTimeout(timer)
    }, 3000)
})()
