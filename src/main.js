import './style.css'
import 'bootstrap/dist/css/bootstrap.css'
import { svgNS, Point} from './types'
import { CameraHandler,gridsize } from './user/camera'
import { KeybindHandler } from './user/keybindHandler'
import { Graph } from './classes/graph'
import { Molecule } from './classes/molecule'
import { atoms } from './assets/atoms.json'
import { Atom } from './classes/atom'
import UIHandler from "./classes/ui.js"

const app = document.getElementById("app")
const camera = new CameraHandler(app)
const keybinds = new KeybindHandler(window)
console.log(UIHandler)
// UIHandler.showPopup("Átomo de <b>Teste</b>")



let lmode
keybinds.addBehaviour(
  "Space",
  e=>{
    lmode = UIHandler.activeMode
    UIHandler.setModeActive("Move")
    // camera.dragging = true 
    
    camera.camera.style.cursor = "move";
  },
  e=> {
    // camera.dragging = false
    camera.camera.style.cursor = "default";
    UIHandler.setModeActive(lmode )
  }
)

keybinds.addBehaviour(
  "ShiftLeft",
  e=>{
    lmode = UIHandler.activeMode
    UIHandler.setModeActive("Selection")
  },
  e=> {
    UIHandler.setModeActive(lmode)
  }
)

keybinds.addBehaviour(
  "KeyC",
  e=>{
    let pos = camera.getPositionInWorld(camera.mousePosition)
    pos = pos.snap(gridsize,10)
    const atm = new Atom(camera,"C",pos) 
  }
)

keybinds.addBehaviour(
  "KeyN",
  e=>{
    let pos = camera.getPositionInWorld(camera.mousePosition)
    pos = pos.snap(gridsize,10)
    const atm = new Atom(camera,"N",pos) 
  }
)

keybinds.addBehaviour(
  "KeyO",
  e=>{
    let pos = camera.getPositionInWorld(camera.mousePosition)
    pos = pos.snap(gridsize,10)
    const atm = new Atom(camera,"O",pos) 
  }
)

keybinds.addBehaviour(
  "KeyH",
  e=>{
    let pos = camera.getPositionInWorld(camera.mousePosition)
    pos = pos.snap(gridsize,10)
    const atm = new Atom(camera,"H",pos) 
  }
)

function delFunc(){
  Atom.hovering?.remove()
  if(Atom.line_hovering){
    /**
     * @type {}
     * @type {Atom}
     * @type {Atom}
     */
    const [line,a1,a2] = Atom.line_hovering
    a1.disconnect_once(a2)
  }
}


keybinds.addBehaviour( "KeyD", delFunc)
keybinds.addBehaviour( "Delete", delFunc)

keybinds.addBehaviour(
  "KeyY",
  e=>{
    console.log(Atom.hovering?.lines)
    console.log(Atom.hovering?.molecule)
  }
)


keybinds.addBehaviour("Digit1",e=>{UIHandler.setModeActive("Move")})
keybinds.addBehaviour("Digit2",e=>{UIHandler.setModeActive("Selection")})
keybinds.addBehaviour("Digit3",e=>{UIHandler.setModeActive("Line")})
keybinds.addBehaviour("Digit4",e=>{UIHandler.setModeActive("Delete")})

keybinds.addBehaviour(
  "2",
  e=>{
    if(UIHandler.activeMode=="Line" && !Atom.hovering){
      let a = new Atom(camera,"C",camera.getPositionInWorld(camera.mousePosition).snap(gridsize,10))
      a.clicked()
    }
  }

)



UIHandler.setWorld(camera)
import hand from './icons/hand-index-thumb.svg'
import dash from './icons/dash-lg.svg'
import mouse from './icons/mouse.svg'
import x from './icons/x.svg'
UIHandler.addMode("Move",hand)
UIHandler.addMode("Selection",mouse)
UIHandler.addMode("Line",dash)
UIHandler.addMode("Delete",x)
UIHandler.setModeActive("Selection")

UIHandler.addAtomToTopbar("C")
UIHandler.addAtomToTopbar("H")
UIHandler.addAtomToTopbar("O")

document.getElementById("helpDialog").showModal()
console.log(atoms)

document.addEventListener('pointerdown', (event) => {
  // Release implicit touch capture so other elements can detect pointerenter/pointerover
  if (event.target.hasPointerCapture(event.pointerId)) {
    event.target.releasePointerCapture(event.pointerId);
  }
});