import './style.css'
import { svgNS, Point} from './types'
import { CameraHandler } from './viewport/camera'
import { KeybindHandler } from './viewport/keybindHandler'

const app = document.getElementById("app")

const camera = new CameraHandler(app)
const keybinds = new KeybindHandler(window)

keybinds.addBehaviour(
  "Space",
  e=> camera.dragging = true ,
  e=> camera.dragging = false
)

keybinds.addBehaviour(
  "KeyE",
  (e)=> {
    console.log(camera.mousePosition)
    let dot = document.createElementNS(svgNS,"circle")
    let pos = camera.getPositionInWorld(camera.mousePosition)
    dot.setAttribute("r",2)
    dot.setAttribute("cx",pos.x)
    dot.setAttribute("cy",pos.y)

    camera.camera.appendChild(dot)
  } 
)

// camera.setZoom(2)