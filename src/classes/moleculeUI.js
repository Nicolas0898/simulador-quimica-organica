import { Molecule } from "./molecule";
import { svgNS } from "../types";
import { CameraHandler } from "../user/camera";

const padding = 15

export class moleculeUI{

    /** @type {Molecule} */
    #molecule
    #box
    #elements = []

    /** 
     * @param {Molecule} molecule 
     */
    constructor(molecule){
        this.#molecule = molecule
    }

    clearElements(){
        this.#box?.remove()
        for(let i of this.#elements){
            i.remove()
        }
        this.#elements = []
    }

    update(){
        this.clearElements()
        let rect = document.createElementNS(svgNS,"rect")

        const bb = this.#molecule.get_molecule_bounding_box()

        rect.setAttribute("x",bb.x1 - padding)
        rect.setAttribute("rx",5)
        rect.setAttribute("ry",5)
        rect.setAttribute("y",bb.y1 - padding)
        rect.setAttribute("width",bb.x2-bb.x1 + padding*2.0)
        rect.setAttribute("height",bb.y2-bb.y1 + padding*2.0)
        rect.setAttribute("stroke","rgb(100 100 255)")
        rect.setAttribute("fill","none")

        let atms = this.#molecule.count_atoms_in_molecule()
        let atmsS = ""
        let nomeclature = this.#molecule.getBasicNomenclature()
        
        if(nomeclature.supported){
            atmsS += `${nomeclature.name} (`
        }
        
        for(const [atom,n] of atms){
            if(n>1)
                atmsS+=`${atom}<tspan baseline-shift="sub" font-size="14u">${n}</tspan>`
            else if(n==1)
                atmsS+=`${atom}`
        }
        
        if(nomeclature.supported){atmsS+=")"}
        console.log(atmsS)


        const svText = document.createElementNS(svgNS,"text")
        svText.innerHTML = atmsS
        svText.setAttribute("x",bb.x1-padding)
        svText.setAttribute("y",bb.y1-padding-8)

        this.#elements.push(svText)

        CameraHandler.current.add(svText)
        CameraHandler.current.add(rect)
   
        this.#box = rect
    }


}