import { Molecule } from "./molecule";
import { svgNS } from "../types";
import { CameraHandler } from "../user/camera";
import UI from "./ui"

const padding = 15

export class moleculeUI{

    /** @type {Molecule} */
    #molecule
    #box
    #elements = []
    #nomeclature
    #composition

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

    showPopup(){
        let html = `<b>`

        let classificacao = this.#molecule.classifyCarbonChain()

        if(this.#nomeclature?.supported){
            html += `${this.#nomeclature.name} (`
        }


        for(const [atom,n] of this.#composition){
            if(n>1)
                html+=`${atom}<sub>${n}</sub>`
            else if(n==1)
                html+=`${atom}`
        }
        if(this.#nomeclature?.supported) html+=")"
        html+="</b><hr>"

        if(this.#nomeclature?.supported){
            html+=`<b>Grupo funcional: </b>${this.#nomeclature.group}<br>`
        }else if (this.#nomeclature){
            html+=`<span class="warning"><b>Nomeclatura indisponível:</b> ${this.#nomeclature.reason}<br></span>`
        }

        let a = classificacao.aberta?"Aberta":"Fechada"
        let b = classificacao.saturada?"Saturada":"Fechada"
        let c = classificacao.heterogenea?"Heterogênea":"Homogênea"
        let d = classificacao.normal?"Normal":"Ramificada"
        html += `<b>Forma: </b>${a}<br><b>Saturação: </b>${b}<br><b>Homogenidade: </b>${c}<br><b>Ramificação: </b>${d}<br>`

       UI.showPopup(html) 
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
        rect.setAttribute("stroke-width",2)

        let atms = this.#molecule.count_atoms_in_molecule()
        let atmsS = " "
        let nomeclature = this.#molecule.getBasicNomenclature()
        
        this.#nomeclature = nomeclature
        if(nomeclature.supported){
            atmsS += `${nomeclature.name} (`
        }
       
        
        this.#composition = atms
        for(const [atom,n] of atms){
            if(n>1)
                atmsS+=`${atom}<tspan baseline-shift="sub" font-size="14u">${n}</tspan>`
            else if(n==1)
                atmsS+=`${atom}`
        }
        
        if(nomeclature.supported){atmsS+=")"}
        // console.log(atmsS)


        const svText = document.createElementNS(svgNS,"text")
        if(nomeclature.supported)
            atmsS+=` <tspan fill='rgb(100 100 255)'>&#128712;</tspan>`
        else
            atmsS+=` <tspan font-weight="bold" fill='rgb(211, 180, 118)'>&#9888;</tspan>`
        svText.innerHTML = atmsS
        svText.setAttribute("x",bb.x1-padding)
        svText.setAttribute("y",bb.y1-padding-10)

        this.#elements.push(svText)

        CameraHandler.current.add(svText)
        CameraHandler.current.add(rect)
  
        
        rect.addEventListener("mouseenter",this.showPopup.bind(this))            
        svText.addEventListener("mouseenter",this.showPopup.bind(this))            
        rect.addEventListener("mouseout",()=> {UI.hidePopup()})
        svText.addEventListener("mouseout",()=> {UI.hidePopup()})
        this.#box = rect
    }


}