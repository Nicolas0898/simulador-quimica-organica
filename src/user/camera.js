import { Point } from "../types"

const svgNS = "http://www.w3.org/2000/svg"
export class CameraHandler {
    /** @type {SVGGElement} */
    camera = document.getElementById("camera")
    camerapos = new Point(0, 0)
    lastpos = new Point(0, 0)
    svg
    enabled = true
    zoom = 1
    background = document.getElementById("background")
    dragging = false
    /** @type{Point} */
    mousePosition

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
        console.log("asa")
        this.svg = svg

        this.svg.addEventListener("mousedown", e => {
            if (!this.dragging) return
            let mousepos = this.getSVGCoordsFromEvent(e)
            this.lastpos = mousepos
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

        this.svg.addEventListener("mousemove", e => {
            this.mousePosition = new Point(e.clientX,e.clientY)
            if (!this.dragging) return
            const rect = this.svg.getBoundingClientRect();
            let mousepos = this.getSVGCoordsFromEvent(e)

            if (e.buttons == 1) {
                console.log()
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