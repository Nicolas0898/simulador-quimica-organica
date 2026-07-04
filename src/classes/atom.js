import { CameraHandler } from '../user/camera'
import { atoms } from '../assets/atoms.json'
import { svgNS, Point} from '../types'
import { Graph } from './graph'

export class Atom{
    /** @type {CameraHandler} */
    world
    svgElement
    /** @type {Point} */
    #pos
    dragging = false
    molecule
    line
    static hovering

    set pos(val){
        this.#pos = val
        this.svgElement.setAttribute("x",val.x)
        this.svgElement.setAttribute("y",val.y)
    }

    get pos(){
        return this.#pos
    }


    /**
     * 
     * @param {CameraHandler} world 
     * @param {String} atom_name 
     * @param {Point} pos 
     */
    constructor(world,atom_name,pos=new Point(0,0)){
        this.molecule = new Graph()
        
        console.log(atoms)
        this.world = world
        this.svgElement = document.createElementNS(svgNS,"text")
        this.svgElement.innerHTML = atoms[atom_name].symbol
        world.add(this.svgElement)
        
        this.svgElement.setAttribute("text-anchor","middle")
        this.svgElement.setAttribute("dominant-baseline","middle")
        
        this.pos = pos

        this.svgElement.classList.add("atom")
        this.svgElement.addEventListener("mousedown",this.clicked.bind(this))
        window.addEventListener("mouseup",this.released.bind(this))
        window.addEventListener("mousemove",this.mouse_moved.bind(this))
        this.svgElement.addEventListener("mouseenter",e=>{
            Atom.hovering = this
            console.log(this)
        })
        this.svgElement.addEventListener("mouseleave",e=>{
            if (Atom.hovering == this)
                Atom.hovering = null
            
        })
    }


    update_line_pos(target){
        if(!this.line) return
        let np = new Point(this.#pos.x,this.#pos.y)
        let dir = new Point(target.x,target.y).subtract(np).normalize().multiply_scalar(10)
        // console.log(dir)
        np.sum(dir)
        this.line.setAttribute("x1",np.x)
        this.line.setAttribute("y1",np.y)

        console.log(Atom.hovering)
        if(Atom.hovering == null){
            this.line.setAttribute("x2",target.x)
            this.line.setAttribute("y2",target.y)
        }else{
            console.log("agfas")
            let tp = new Point(Atom.hovering.pos.x,Atom.hovering.pos.y)
            let tpdir = new Point(tp.x,tp.y).subtract(np).normalize().multiply_scalar(-10)
            tp.sum(tpdir)
            this.line.setAttribute("x2",tp.x)
            this.line.setAttribute("y2",tp.y)
        }
    }

    clicked(){
        this.dragging = true
        console.log("cricked")
        console.log(this)
        
        this.line = document.createElementNS(svgNS,"line")
        this.line.setAttribute("x1",this.#pos.x)
        this.line.setAttribute("y1",this.#pos.y)
        this.line.setAttribute("x2",this.#pos.x)
        this.line.setAttribute("y2",this.#pos.y)
        // this.line.setAttribute("x1",this.#pos.x)
        // this.line.setAttribute("y1",this.#pos.y)
        this.line.setAttribute("stroke-width",2)
        this.line.setAttribute("stroke","black")
        this.world.add(this.line)
    }

    released(){
        if(!this.dragging) return
        this.dragging = false
    }
    
    mouse_moved(){
        if(!this.dragging) return
        let mp = this.world.getPositionInWorld(this.world.mousePosition)
        this.update_line_pos(mp)
    }
}

console.log(atoms)