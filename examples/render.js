import {h, render, Fragment, Portal} from "../src"

(function () {
    const app = document.getElementById('test1');

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
    }, 'hellow world'))

    render(vnode, app)
})();

(function () {
    const app = document.getElementById('test2');
    const vnode = h(Fragment, {}, [
        h('li',{}, '你'),
        h('li',{}, '好'),
        h('li',{}, '吗'),
    ])
    render(vnode, app)
})();

(function () {
    const app = document.getElementById('test3');

    const vnode = h(Portal, {
        target: '#portal'
    }, [
        h('div',{}, 'how'),
        h('div',{}, 'are'),
        h('div',{}, 'you'),
    ])
    render(vnode, app)
})();

(function () {
    const app = document.getElementById('test4');

    const MyFunctionalComponent = function () {
        return h(
            'div',
            {},
            'I am in functional component.'
        )
    }

    class MyStateFulComponent {
        render() {
            return h(
                'div',
                {},
                'I am in stateful component.'
            )
        }
    }

    const vnode = h(Fragment, {}, [
        h(MyFunctionalComponent),
        h(MyStateFulComponent)
    ])

    render(vnode, app)
})();
