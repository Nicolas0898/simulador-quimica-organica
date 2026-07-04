import { CameraHandler, gridsize } from '../user/camera'
import { atoms } from '../assets/atoms.json'
import { svgNS, Point } from '../types'
import { Molecule } from './molecule'

export class Atom {
    /** @type {CameraHandler} */
    world
    /** @type {svgElement} */
    svgElement
    /** @type {Point} */
    #pos
    /** @type {boolean} */
    dragging = false
    /** @type {Molecule} */
    molecule
    /** @type {svgElement} */
    line
    /** @type {Atom} */
    static hovering

    static atoms = []
    properties
    lines = []

    set pos(val) {
        this.#pos = val
        this.svgElement.setAttribute("x", val.x)
        this.svgElement.setAttribute("y", val.y)
    }

    get pos() {
        return this.#pos
    }


    /**
     * 
     * @param {CameraHandler} world 
     * @param {String} atom_name 
     * @param {Point} pos 
     * @param {Atom} molecule
     */
    constructor(world, atom_name, pos = new Point(0, 0), og) {
        Atom.atoms.push(this)
        if (!og) {
            this.molecule = new Molecule()
            this.molecule.add_node(this)
        } else {
            this.molecule = og.molecule
            og.molecule.add_node(this)
            og.molecule.connect(this, og)
        }

        // console.log(atoms)
        this.properties = atoms[atom_name]
        this.world = world
        this.svgElement = document.createElementNS(svgNS, "text")
        this.svgElement.innerHTML = atoms[atom_name].symbol
        world.add(this.svgElement)

        this.svgElement.setAttribute("text-anchor", "middle")
        this.svgElement.setAttribute("dominant-baseline", "middle")

        let same_pos = []


        do {
            console.log("a")
            same_pos = Atom.atoms.filter((x) => {
                if (x == this) return false
                return x.pos.equals(pos)
            })
            this.pos = pos
            if(same_pos.length > 0){
                pos.sum(new Point(0,gridsize))
            }
        } while (same_pos.length > 0)


        this.svgElement.classList.add("atom")
        this.svgElement.addEventListener("mousedown", this.clicked.bind(this))
        window.addEventListener("mouseup", this.released.bind(this))
        window.addEventListener("mousemove", this.mouse_moved.bind(this))
        this.svgElement.addEventListener("mouseenter", e => {
            Atom.hovering = this
            // console.log(this)
        })
        this.svgElement.addEventListener("mouseleave", e => {
            if (Atom.hovering == this)
                Atom.hovering = null

        })
    }


    update_line_pos(target, force_hover = null) {
        if (!this.line) return
        let np = new Point(this.#pos.x, this.#pos.y)
        let dir = new Point(target.x, target.y).subtract(np).normalize().multiply_scalar(10)
        // console.log(dir)
        np.sum(dir)
        this.line.setAttribute("x1", np.x)
        this.line.setAttribute("y1", np.y)

        // console.log(Atom.hovering)
        if (Atom.hovering == null && !force_hover) {
            this.line.setAttribute("x2", target.x)
            this.line.setAttribute("y2", target.y)
        } else {
            const tt = Atom.hovering ?? force_hover
            // console.log("agfas")
            let tp = new Point(tt.pos.x, tt.pos.y)
            let tpdir = new Point(tp.x, tp.y).subtract(np).normalize().multiply_scalar(-10)
            tp.sum(tpdir)
            this.line.setAttribute("x2", tp.x)
            this.line.setAttribute("y2", tp.y)
        }
    }

    clicked() {
        this.dragging = true
        // console.log("cricked")
        // console.log(this)

        this.line = document.createElementNS(svgNS, "line")
        this.line.setAttribute("x1", this.#pos.x)
        this.line.setAttribute("y1", this.#pos.y)
        this.line.setAttribute("x2", this.#pos.x)
        this.line.setAttribute("y2", this.#pos.y)
        this.lines.push(this.line)
        // this.line.setAttribute("x1",this.#pos.x)
        // this.line.setAttribute("y1",this.#pos.y)
        this.line.setAttribute("stroke-width", 2)
        this.line.setAttribute("stroke", "black")
        this.world.add(this.line)
    }

    released() {
        if (!this.dragging) return
        this.dragging = false



        if (!Atom.hovering) {
            let pos = this.world.getPositionInWorld(this.world.mousePosition)
            pos.snap(gridsize, 10)
            const newatm = new Atom(this.world, "C", pos, this)
            this.update_line_pos(pos, newatm)
        }else{
            this.molecule.merge(Atom.hovering.molecule)
            Atom.hovering.molecule = this.molecule
            this.molecule.connect(this,Atom.hovering)
        }
    }

    mouse_moved() {
        if (!this.dragging) return
        let mp = this.world.getPositionInWorld(this.world.mousePosition)
        this.update_line_pos(mp)
    }



    toString() {
        return this.properties.symbol
    }


    count_atoms_in_molecule(){
        return this.molecule.count_atoms_in_molecule(this)
    }
}

console.log(atoms)