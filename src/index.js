import h from './h.js'
import render from './render.js'

(function () {
    const app = document.getElementById('app')

    const vnode = h('div', {
        class: {
            'draggable': true,
            'win': true,
            'hello': true
        },
        style: {
            'border': '1px solid black',
            'width': '100px',
            'height': '100px',
            'display': 'flex',
            'justify-content': 'center',
            'align-items': 'center'
        },
        customer: 1,
        checked: true
    }, h('div', {
        style: {
            'width': '50px',
            'height': '50px',
            'background': 'red'
        },
        onclick() {
            alert('hello world')
        }
    }))

    render(vnode, app)
})()
