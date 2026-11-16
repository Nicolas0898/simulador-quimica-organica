import { Point } from "../types"
import UI from "../classes/ui"

const svgNS = "http://www.w3.org/2000/svg"
export class CameraHandler {
    /** @type {CameraHandler} */
    static current
    camera = document.getElementById("camera")
    camerapos = new Point(0, 0)
    lastpos = new Point(0, 0)
    svg
    enabled = true
    mouseDown = false
    zoom = 1
    background = document.getElementById("background")
    activePointer = new Map()
    prevDistance = -1
    // dragging = false
    get dragging(){
        return UI.activeMode=="Move" && this.activePointer.size<=1
    }
    /** @type{Point} */
    mousePosition = new Point(0,0)

    getSVGCoordsFromEvent(e) {
        return this.getSVGCoords(new Point(e.clientX, e.clientY))
    }

    /**
     * 
     * @param {Point} pos 
     * @returns SVGPoint
     */
    getSVGCoords(pos) {
        const point = this.svg.createSVGPoint();
        point.x = pos.x;
        point.y = pos.y;

        // Inverse the Screen CTM to map screen pixels back to SVG world units
        const svgMatrix = this.svg.getScreenCTM().inverse();
        return point.matrixTransform(svgMatrix);
    }

    /**
     * 
     * @param {Point} pos 
     * @returns Point
     */
    getPositionInWorld(pos) {
        let worldpos = this.getSVGCoords(pos)

        const point = new Point((worldpos.x) / (this.zoom) - this.camerapos.x, (worldpos.y) / (this.zoom) - this.camerapos.y)
        return point
    }

    /**
     * 
     * @param {SVGElement} svg 
     */
    constructor(svg) {
        CameraHandler.current = this
        // console.log("asa")
        this.svg = svg
        this.svg.addEventListener("pointerdown", e => {
            this.prevDistance = -1
            this.activePointer.set(e.pointerId,e)

            this.mouseDown = true
            if (!this.dragging) return
            let mousepos = this.getSVGCoordsFromEvent(e)
            this.lastpos = mousepos

        })

        this.svg.addEventListener("pointerup",e=>{
            this.activePointer.delete(e.pointerId)
            this.mouseDown = false
        })

        this.svg.addEventListener("wheel", e => {
            let mousepos = this.getSVGCoordsFromEvent(e)
            const zoomamt = 1.1
            const factor = e.wheelDelta > 0 ? zoomamt : 1 / zoomamt
            if (this.zoom * factor < 0.2 || this.zoom * factor > 20) return

            let finalPos = { x: (mousepos.x) / (this.zoom * factor) - this.camerapos.x, y: (mousepos.y) / (this.zoom * factor) - this.camerapos.y }
            let targetPos = { x: (mousepos.x) / (this.zoom) - this.camerapos.x, y: (mousepos.y) / (this.zoom) - this.camerapos.y }

            this.camerapos.x += finalPos.x - targetPos.x
            this.camerapos.y += finalPos.y - targetPos.y
            this.setZoom(this.zoom * factor)
            // console.log(this.zoom)
            // this.camerapos.x += mousepos.x*factor
        })

        this.svg.addEventListener("pointermove", e => {
            this.mousePosition.set(e.clientX,e.clientY)
            this.activePointer.set(e.pointerId,e)

            if(UI.isMobile()){
                // console.log("AA",this.activePointer.size)
                // console.log(this.activePointer)
                if(this.activePointer.size === 2){
                    const [p1, p2] = Array.from(this.activePointer.values());
                    const currentDistance = Math.hypot(p1.clientX - p2.clientX, p1.clientY - p2.clientY);
                    
                    if(this.prevDistance<0){
                        this.prevDistance = currentDistance
                    }
                    let diff = (currentDistance - this.prevDistance)/100.0

                    this.prevDistance = currentDistance
                    console.log(currentDistance,diff)
                    if(this.zoom + diff>0){

                        this.setZoom(this.zoom + diff)
                    }
                    console.log(this.zoom)

                }

            }

            if (!this.dragging) return
            const rect = this.svg.getBoundingClientRect();
            let mousepos = this.getSVGCoordsFromEvent(e)

            if (e.buttons == 1) {
                // console.log()
                let diff = { x: mousepos.x - this.lastpos.x, y: mousepos.y - this.lastpos.y }
                this.lastpos = mousepos
                this.camerapos.x += (diff.x / this.zoom)
                this.camerapos.y += (diff.y / this.zoom)

                this.update()
            }
        })



    }

    update() {
        this.camera.setAttribute("transform", `scale(${this.zoom},${this.zoom}) translate(${this.camerapos.x},${this.camerapos.y})`)
        this.background.setAttribute("x", -(this.camerapos.x))
        this.background.setAttribute("y", -(this.camerapos.y))
    }

    /**
     * 
     * @param {number} zoom 
     */
    setZoom(zoom) {
        this.zoom = zoom
        this.update()
    }

    /**
     * 
     * @returns number
     */
    getZoom() {
        return this.zoom
    }

    add(element){
        this.camera.appendChild(element)
    }
}

export const gridsize = 40