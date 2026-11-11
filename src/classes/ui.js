import { Point } from "../types"
import { CameraHandler } from "../user/camera"

class UI{
    #popupActive = false
    /**@type {HTMLDivElement} */
    #sidebar
    /**@type {HTMLDivElement} */
    #popup
    activeFunction = null

    constructor(){
        this.#sidebar = document.getElementById("sidebar")
        this.#popup = document.getElementById("popup")

    }
        
    isPopupActive(){
        return this.#popupActive
    }
    
    showPopup(html,fixed=false){
        if(this.activeFunction){
            document.removeEventListener("mousemove",this.activeFunction)
        }
        this.#popup.classList.remove("popup-hidden")
        this.#popup.innerHTML = html
        this.activeFunction = this.#popupFrame.bind(this)
        document.addEventListener("mousemove",this.activeFunction)
    }
    
    /** @param {MouseEvent} mousePos  */
    #popupFrame(mousePos){
        const padding=5
        const popupRect = this.#popup.getBoundingClientRect()
        this.#popup.style.top = `${mousePos.clientY - popupRect.height - padding}px`
        this.#popup.style.left = `${mousePos.clientX - popupRect.width/2}px`
        if(mousePos.clientY<(popupRect.height)){
            this.#popup.style.top = `${mousePos.clientY + padding}px`
        }
        if(mousePos.clientX<(popupRect.width/2)){
            this.#popup.style.left = `${mousePos.clientX }px`
        }
        if(mousePos.clientX>(window.innerWidth-popupRect.width/2)){
            this.#popup.style.left = `${mousePos.clientX - popupRect.width}px`
        }
        // console.log(popupRect.height)
        // console.log(this,mousePos.clientY)
        
    }
    
    hidePopup(){
        document.removeEventListener("mousemove",this.activeFunction)
        this.activeFunction = null
        this.#popup.classList.add("popup-hidden")
    }

    addMode(icon){

    }

}

const UIInstance = Object.seal(new UI)
export default UIInstance