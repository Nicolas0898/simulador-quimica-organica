const svgNS = "http://www.w3.org/2000/svg"
export class CameraHandler{
    /** @type {SVGGElement} */
    camera = document.getElementById("camera")
    camerapos = {x:0,y:0}
    lastpos = {x:0,y:0}
    svg
    enabled=true
    zoom = 1

    getSVGCoords(event) {
        const point = this.svg.createSVGPoint();
        point.x = event.clientX;
        point.y = event.clientY;
    
        // Inverse the Screen CTM to map screen pixels back to SVG world units
        const svgMatrix = this.svg.getScreenCTM().inverse();
        return point.matrixTransform(svgMatrix);
    }

    /**
     * 
     * @param {SVGElement} svg 
     */
    constructor(svg){
        console.log("asa")
        this.svg = svg

        var circle = document.createElementNS(svgNS,"circle")
        circle.setAttribute("r",5)
        this.camera.appendChild(circle)
        
        var circle2 = document.createElementNS(svgNS,"circle")
        circle2.setAttribute("r",5)
        circle2.setAttribute("fill","blue")
        this.camera.appendChild(circle2)

        var circle3 = document.createElementNS(svgNS,"circle")
        circle3.setAttribute("r",5)
        circle3.setAttribute("fill","green")
        this.camera.appendChild(circle3)
       
        var circle4 = document.createElementNS(svgNS,"circle")
        circle4.setAttribute("r",5)
        circle4.setAttribute("fill","pink")
        this.camera.appendChild(circle4)
        
        var circle5 = document.createElementNS(svgNS,"circle")
        circle5.setAttribute("r",5)
        circle5.setAttribute("fill","lightgreen")
        this.camera.appendChild(circle5)

        this.svg.addEventListener("mousedown",e=>{
            let mousepos = this.getSVGCoords(e)
            this.lastpos = mousepos
        })

        this.svg.addEventListener("wheel",e=>{
            let mousepos = this.getSVGCoords(e)
            console.log(mousepos)
            const zoomamt = 1.1
            const factor = e.wheelDelta>0 ? zoomamt : 1/zoomamt
            if (this.zoom*factor < 0.2 || this.zoom*factor > 20) return 

            let finalPos = {x:(mousepos.x)/(this.zoom*factor) - this.camerapos.x,y:(mousepos.y)/(this.zoom*factor) - this.camerapos.y} 
            let targetPos = {x:(mousepos.x)/(this.zoom) - this.camerapos.x,y:(mousepos.y)/(this.zoom) - this.camerapos.y} 

            console.log(mousepos,finalPos)

            var testc = document.createElementNS(svgNS,"circle")
            testc.setAttribute("r",1)
            testc.setAttribute("fill","purple")
            testc.setAttribute("cx",targetPos.x)
            testc.setAttribute("cy",targetPos.y)
            this.camera.appendChild(testc)

            this.camerapos.x += finalPos.x-targetPos.x
            this.camerapos.y += finalPos.y-targetPos.y
            this.setZoom(this.zoom*factor)
            // console.log(this.zoom)
            // this.camerapos.x += mousepos.x*factor
        })

        this.svg.addEventListener("mousemove",e=>{
        const rect = this.svg.getBoundingClientRect();
        let mousepos = this.getSVGCoords(e)
        
        circle.setAttribute("cx",mousepos.x)
        circle.setAttribute("cy",mousepos.y)
        console.log(mousepos)
        
        circle3.setAttribute("cx",-this.camerapos.x)
        circle3.setAttribute("cy",-this.camerapos.y)

        circle2.setAttribute("cx",(mousepos.x)/this.zoom - this.camerapos.x)
        circle2.setAttribute("cy",(mousepos.y)/this.zoom - this.camerapos.y)

        circle4.setAttribute("cx",(mousepos.x)/(this.zoom * 1.05) - this.camerapos.x)
        circle4.setAttribute("cy",(mousepos.y)/(this.zoom * 1.05) - this.camerapos.y)

        circle5.setAttribute("cx",(mousepos.x)/(this.zoom / 1.05) - this.camerapos.x)
        circle5.setAttribute("cy",(mousepos.y)/(this.zoom / 1.05) - this.camerapos.y)
        if(e.buttons==1){
            console.log()
            let diff = {x:mousepos.x-this.lastpos.x,y:mousepos.y-this.lastpos.y}
            this.lastpos = mousepos
            this.camerapos.x+=(diff.x/this.zoom)
            this.camerapos.y+=(diff.y/this.zoom)

            this.update()
        }
        })

    }

    update(){
        this.camera.setAttribute("transform",`scale(${this.zoom},${this.zoom}) translate(${this.camerapos.x},${this.camerapos.y})`)
    }

    /**
     * 
     * @param {number} zoom 
     */
    setZoom(zoom){
        this.zoom = zoom
        this.update()
    }

    /**
     * 
     * @returns number
     */
    getZoom(){
        return this.zoom
    }
}
