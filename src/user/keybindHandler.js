class Action{
    key
    downBehaviour
    upBehavior

    constructor(key,down,up){
        this.key = key
        this.downBehaviour = down
        this.upBehavior = up
    }
}


export class KeybindHandler{
    /** @type {HTMLElement} */
    app
    actions={}

    constructor(app){
        this.app = app
        this.actions = {}

        this.app.addEventListener("keydown",this.keydown.bind(this))
        this.app.addEventListener("keyup",this.keyup.bind(this))
        this.app.addEventListener("mousedown",this.keydown.bind(this))
        this.app.addEventListener("mouseup",this.keyup.bind(this))

        this.app.addEventListener('contextmenu', e => e.preventDefault(), { capture: true });

    }

    keydown(e){
        this.actions[e.code??e.button]?.downBehaviour?.(e)
    }

    keyup(e){
        this.actions[e.code??e.button]?.upBehavior?.(e)
    }

    addBehaviour(code,downBehaviour,upBehavior){
        this.actions[code] = new Action(code,downBehaviour,upBehavior)
    }


}