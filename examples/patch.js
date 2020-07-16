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
})();

// patch text
(function () {
    const container = document.getElementById('test2')

    const prev = h('div',{}, 'hello')

    const next = h('div', {}, 'world')

    render(prev, container)

    setTimeout(() => {
        render(next, container)
    }, 2000)
})();

// patch Fragment
(function () {
    const container = document.getElementById('test3')

    const prev = h(Fragment,{}, h('div', {}, 'hello'))

    const next = h(Fragment,{}, [
        h('div', {}, 'hi'),
        h('div', {}, 'world')
    ])

    render(prev, container)

    setTimeout(() => {
        render(next, container)
    }, 2000)
})();

// patch Portal
(function () {
    const container = document.getElementById('portal1')

    const prev = h(Portal,{target: '#portal1'}, h('div', {}, 'hello'))

    const next = h(Portal,{target: '#portal2'}, [
        h('div', {}, 'hi'),
        h('div', {}, 'world')
    ])

    render(prev, container)

    setTimeout(() => {
        render(next, container)
    }, 2000)
})();
