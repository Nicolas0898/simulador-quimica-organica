import { CameraHandler, gridsize } from '../user/camera'
import { atoms } from '../assets/atoms.json'
import { svgNS, Point } from '../types'
import { Molecule } from './molecule'
import UI from "../classes/ui"

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
    draw = this.drawSingleLine
    /** @type {Atom} */
    static #hovering
    static get hovering(){
        return this.#hovering
    }
    static set hovering(val){
        this.#hovering = val
        if(val){
            val.showPopup()
        }else{
            UI.hidePopup()
        }
    }

    static atoms = []
    properties
    lines = new Map()

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
                pos = pos.sum(new Point(0,gridsize))
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

    // Target é a posição
    // force_hover é para obrigar a função a dar hover em um átomo
    update_line_pos(target, force_hover = null) {
        if (!this.line) return
        
        // Cria uma circuferência em torno do atomo selecionado e poisiciona o 
        // ponto de acordo com a direção do mouse
        let np = new Point(this.#pos.x, this.#pos.y)
        np = this.offsetPoint(np,target)

        // console.log(Atom.hovering)
        // Verifica se ele NÃO está com o mouse em cima de outro átomo
        if ( (Atom.hovering == null || Atom.hovering == this) && !force_hover) {
            // pega e define o ponto final da linha de acordo com o target
            // tp= Target Pos (normalmente a posição do mouse)
            this.line.setAttribute("x2", target.x)
            this.line.setAttribute("y2", target.y)

            this.line.setAttribute("x1", np.x)
            this.line.setAttribute("y1", np.y)

        } else {
            const tt = Atom.hovering ?? force_hover
            // console.log("agfas")

            // refaz o esquema da circuferência do ponto mas apontando para o átomo a ser conectado
            np = new Point(this.#pos.x, this.#pos.y)
            dir = new Point(tt.pos.x, tt.pos.y).subtract(np).normalize().multiply_scalar(10)
            np = np.sum(dir)
            if (!isNaN(np.x) && !isNaN(np.y)){
                this.line.setAttribute("x1", np.x)
                this.line.setAttribute("y1", np.y)
            }

            // faz o mesmo esquema da circuferência mas pro outro átomoc
            let tp = new Point(tt.pos.x, tt.pos.y)
            let tpdir = new Point(tp.x, tp.y).subtract(np).normalize().multiply_scalar(-10)
            tp = tp.sum(tpdir)
            this.line.setAttribute("x2", tp.x)
            this.line.setAttribute("y2", tp.y)
        }
    }

    clicked() {
        this.dragging = true
        // console.log("cricked")
        // console.log(this)

        this.line = this.draw(this.pos,this.pos)
        // this.lines.push(this.line)
        // this.line.setAttribute("x1",this.#pos.x)
        // this.line.setAttribute("y1",this.#pos.y)
        
        this.world.add(this.line[0])
    }

    released() {
        if (!this.dragging) return
        this.dragging = false


        if (Atom.hovering == this){
            for(let l of this.line){
                l.remove()
            }
            return
        }

        let otherpos
        let otheratom
        if (!Atom.hovering) {
            let pos = this.world.getPositionInWorld(this.world.mousePosition)
            pos = pos.snap(gridsize, 10)
            const newatm = new Atom(this.world, "C", pos, this)
            otherpos = pos
            otheratom = newatm
        }else{
            if(this.lines.has(Atom.hovering) || Atom.hovering.lines.has(this)){
                // console.log("sdgkçasjdhufglkdf")
                this.remove_line_with(Atom.hovering)
            }

            this.molecule.merge(Atom.hovering.molecule)
            Atom.hovering.molecule = this.molecule
            this.molecule.connect(this,Atom.hovering)
            otherpos = Atom.hovering.pos
            Atom.hovering.showPopup()

            otheratom = Atom.hovering

            const conamt = this.getConnCountWith(Atom.hovering)
            console.log("CONN AMT:",conamt)
            switch(conamt){
                case 1: this.draw=this.drawSingleLine; break;
                case 2: this.draw=this.drawDoubleLine; break;
                case 3: this.draw=this.drawTripleLine; break;
            }
        }
        
        
        for(let l of this.line){
            l.remove()
        }
        
        const [p1,p2] = this.offsetBoth(this.pos,otherpos)
        console.log(this.draw)
        let lns = this.draw(p1,p2)
        this.lines.set(otheratom,lns)
        this.draw = this.drawSingleLine

    }


    styleLine(line){
        line.setAttribute("stroke-width", 2)
        line.setAttribute("stroke", "black")
    }


    /**
     * 
     * @param {Point} point 
     * @param {Point} towards 
     * @param {number} radius 
     */
    offsetPoint(point,towards,radius=10){
        let np = new Point(point.x, point.y)
        let dir = new Point(towards.x, towards.y).subtract(np).normalize().multiply_scalar(radius)
        np = np.sum(dir)
        return np
    }

    offsetBoth(point,towards,radius=10){
        return [this.offsetPoint(point,towards,radius),this.offsetPoint(towards,point,radius)]
    }

    /**
     * 
     * @param {Point} pointA 
     * @param {Point} pointB 
     * @param {Array} lines 
     */
    // Lines é uma array para manter a mesma sintaxe de outros métodos
    drawSingleLine(pointA,pointB,lines=null){
        if(!lines){
            lines=[document.createElementNS(svgNS, "line")]
            this.world.add(lines[0])
        }

        
        lines[0].setAttribute("x1", pointA.x)
        lines[0].setAttribute("y1", pointA.y)
        lines[0].setAttribute("x2", pointB.x)
        lines[0].setAttribute("y2", pointB.y)
        this.styleLine(lines[0])

        return lines
    }

      /**
     * 
     * @param {Point} pointA 
     * @param {Point} pointB 
     * @param {Array} lines 
     */
    drawDoubleLine(pointA,pointB,lines=null,distance=3){
        if(!lines){
            lines=[document.createElementNS(svgNS, "line"),document.createElementNS(svgNS, "line")]
            this.world.add(lines[0])
            this.world.add(lines[1])
        }

        const dir = pointA.subtract(pointB).normalize()
        const rotated = dir.rotate_rad(Math.PI/2)
        const summedA1 = pointA.sum(rotated.multiply_scalar(distance))
        const summedB1 = pointB.sum(rotated.multiply_scalar(distance))
        const summedA2 = pointA.sum(rotated.multiply_scalar(-distance))
        const summedB2 = pointB.sum(rotated.multiply_scalar(-distance))
        lines[0].setAttribute("x1", summedA1.x)
        lines[0].setAttribute("y1", summedA1.y)
        lines[0].setAttribute("x2", summedB1.x)
        lines[0].setAttribute("y2", summedB1.y)
        
        lines[1].setAttribute("x1", summedA2.x)
        lines[1].setAttribute("y1", summedA2.y)
        lines[1].setAttribute("x2", summedB2.x)
        lines[1].setAttribute("y2", summedB2.y)
        this.styleLine(lines[0])
        this.styleLine(lines[1])

        return lines
    }

    /**
     * 
     * @param {Point} pointA 
     * @param {Point} pointB 
     * @param {Array} lines 
     */
    drawTripleLine(pointA,pointB,lines=null,distance=3){
        if(!lines){
            lines=[
                document.createElementNS(svgNS, "line"),
                document.createElementNS(svgNS, "line"),
                document.createElementNS(svgNS, "line")
            ]
            this.world.add(lines[0])
            this.world.add(lines[1])
            this.world.add(lines[2])
        }

        this.drawSingleLine(pointA,pointB,[lines[0]])
        this.drawDoubleLine(pointA,pointB,[lines[1],lines[2]],distance)

        return lines
    }

    mouse_moved() {
        if (!this.dragging) return
        let mp = this.world.getPositionInWorld(this.world.mousePosition)
        // this.update_line_pos(mp)
        let target = (Atom.hovering&&Atom.hovering!=this)?Atom.hovering.pos:mp

        const p1 = this.offsetPoint(this.pos,target)
        const p2 = this.offsetPoint(target,this.pos)
        this.draw(p1,p2,this.line)
    }



    toString() {
        return this.properties.symbol
    }


    count_atoms_in_molecule(){
        return this.molecule.count_atoms_in_molecule(this)
    }

    remove_line_with(atom){
        this.lines.get(atom)?.forEach(e => {console.log("aaa:",e); e.remove()})
        atom.lines.get(this)?.forEach(e => {console.log("aaa:",e); e.remove()})  
    }

    remove(){
        if(Atom.hovering == this){
            Atom.hovering = null
        }
        // console.log("-------------------")
        // console.log(this.molecule.get_all_nodes(this))
        for(let atom of this.molecule.get_connected_nodes(this)){
            this.remove_line_with(atom)
        }
        this.svgElement.remove()
        Atom.atoms = Atom.atoms.filter(el=>{return el!=this})
        this.molecule.remove_node(this)

        
    }

    showPopup(){
        // const connected = this.molecule.get_connected_nodes(this)
        // console.log(this.properties)
        const n = this.getConnectedN()
        // stable at
        const stat = (this.properties.stable_at??8)
        // texto do hidrogênio
        const hg = ((stat-this.properties.e_valence)-n)!=0?`<i style="font-size: 0.75em; color:lightgrey;">(+${(stat-this.properties.e_valence)-n}H)</i>`:""
        let HTML = `
        <b>Átomo de ${this.properties.name} (${this.properties.symbol})</b>
        <hr>
        Ligações: ${n}${hg}/${stat-this.properties.e_valence}<br>

        `

        if(this.properties.symbol == "C"){
            HTML+=`
                Tipo do carbono: ${this.getCarbonType()} <br>
                Hibridização: ${this.getCarbonHybridisation()}
            `
        }

        UI.showPopup(HTML)
        
    }

    getConnectedAtoms(){
        return this.molecule.get_connected_nodes(this)
    }
    getConnectedN(){
        const connected = this.getConnectedAtoms()
        return connected.length
    }

    getConnCountWith(atom){
        return this.getConnectedAtoms().filter(x=>{return x==atom}).length
    }

    getCarbonType(){
        const atms = this.getUniqueConnected().filter(x=>{return x.properties.symbol=="C"})
        const n = atms.length
        if(n==0||n==1) return "Primário"
        if(n==2) return "Secúndario"
        if(n==3) return "Terciário"
        if(n==4) return "Quartenário"
    }

    getUniqueConnected(){
        const atms = this.getConnectedAtoms()
        var arr = []
        var n = 0

        // console.log(atms)
        for(let a of atms){
            const result = arr.indexOf(a)
            if(result==-1){
                n++
                arr.push(a)
            }
        }

        return arr
    }

    getEqualAmnt(){
        const atms = this.getConnectedAtoms()
        var arr = []
        var n = 0

        // console.log(atms)
        for(let a of atms){
            const result = arr.indexOf(a)
            if(result==-1){
                arr.push(a)
            }else{
                n++
        }

        }
        
        return n
    }

    getCarbonHybridisation(){
        //HACK:
        const n = 4 - this.getEqualAmnt()
        

        if(n==4) return "sp³"
        if(n==3) return "sp²"
        if(n==2) return "sp"
    }
}

console.log(atoms)