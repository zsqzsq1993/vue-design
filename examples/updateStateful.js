import {render, h} from "../src"
// initiative update
(function () {
    const app = document.getElementById('test1')

    class Parent {
        localData = 'hello world'

        render() {
            return h('div',{}, this.localData)
        }

        mounted() {
            setTimeout(() => {
                this.localData = 'shit world'

                this._update()
            }, 2000)
        }
    }

    const vnode = h(Parent)
    render(vnode, app)
})();

// passive update
(function () {
    const app = document.getElementById('test2')

    class Parent {
        localData = 'hello world'

        render() {
            return h(
                Child,
                {
                    text: this.localData
                }
            )
        }

        mounted() {
            setTimeout(() => {
                this.localData = 'shit world'
                this._update()
            }, 2000)
        }
    }

    class Child {
        render() {
            return h(
                'div',
                null,
                this.$props.text
            )
        }
    }

    render(h(Parent), app)
})();

// replace children component
(function () {
    const app = document.getElementById('test3')

    class Parent {
        isOne = true

        mounted() {
            setTimeout(() => {
                this.isOne = false
                this._update()
            }, 2000)
        }

        render() {
            return this.isOne
                ? h(Child1)
                : h(Child2)
        }
    }

    class Child1 {
        render() {
            return h(
                'div',
                null,
                'hello world'
            )
        }
    }

    class Child2 {
        render() {
            return h(
                'div',
                null,
                'shit world'
            )
        }
    }

    render(h(Parent), app)
})();

(function () {
    const app = document.getElementById('test4')

    class Parent {
        localData = 'hello world'

        render() {
            return h(
                Child,
                {
                    text: this.localData
                }
            )
        }

        mounted() {
            setTimeout(() => {
                this.localData = 'shit world'
                this._update()
            }, 2000)
        }
    }

    function Child(props) {
        return h(
            'div',
            null,
            props.text
        )
    }

    render(h(Parent), app)
})()
