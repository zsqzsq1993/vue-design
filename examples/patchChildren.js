import {h, render} from "../src/index.js"

// non - single
(function () {
    const container = document.getElementsByClassName('none-single')[0]

    const prev = h('span',{})

    const next = h('span',{},' hello')

    render(prev, container)

    setTimeout(() => {
        render(next, container)
    }, 2000)
})();

// non - multiple
(function () {
    const container = document.getElementsByClassName('none-multiple')[0]

    const prev = h('span',{})

    const next = h('span',{},[
        h('span',{}, ' hello '),
        h('span',{}, 'world'),
    ])

    render(prev, container)

    setTimeout(() => {
        render(next, container)
    }, 2000)
})();

// single - none
(function () {
    const container = document.getElementsByClassName('single-none')[0]

    const prev = h('span',{})

    const next = h('span',{},' hello')

    render(next, container)

    setTimeout(() => {
        render(prev, container)
    }, 2000)
})();

// single - single
(function () {
    const container = document.getElementsByClassName('single-single')[0]

    const prev = h('span',{}, h('span', {}, h('span', {
        style: {
            display: 'inline-block',
            margin: '4px',
            width: '4px',
            height: '4px',
            border: '2px solid black'
        }
    })))

    const next = h('span',{}, h('span', {}, h('span', {
        style: {
            display: 'inline-block',
            margin: '4px',
            width: '4px',
            height: '4px',
            border: '5px dashed black'
        }
    })))

    render(prev, container)

    setTimeout(() => {
        render(next, container)
    }, 2000)
})();

// single - multiple
(function () {
    const container = document.getElementsByClassName('single-multiple')[0]

    const prev = h('span', {}, ' hello')

    const next = h('span', {}, [
        h('span', {}, ' hi'),
        h('span', {}, ' world'),
    ])

    render(prev, container)

    setTimeout(() => {
        render(next, container)
    }, 2000)
})();

// multiple - none
(function () {
    const container = document.getElementsByClassName('multiple-none')[0]

    const prev = h('span')

    const next = h('span', {}, [
        h('span', {}, ' hi'),
        h('span', {}, ' world'),
    ])

    render(next, container)

    setTimeout(() => {
        render(prev, container)
    }, 2000)
})();

// multiple - single
(function () {
    const container = document.getElementsByClassName('multiple-single')[0]

    const prev = h('span', {}, ' hello')

    const next = h('span', {}, [
        h('span', {}, ' hi'),
        h('span', {}, ' world'),
    ])

    render(next, container)

    setTimeout(() => {
        render(prev, container)
    }, 2000)
})();

// multiple - multiple
(function () {
    const container = document.getElementsByClassName('multiple-multiple')[0]

    const prev = h('span', {}, [
        h('span', {}, ' hello'),
        h('span', {}, ' dolly'),
    ])

    const next = h('span', {}, [
        h('span', {}, ' hi'),
        h('span', {}, ' vera'),
    ])

    render(prev, container)

    setTimeout(() => {
        render(next, container)
    }, 2000)
})();


