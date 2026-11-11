import './style.css'
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
  "KeyC",
  e=>{
    let pos = camera.getPositionInWorld(camera.mousePosition)
    pos = pos.snap(gridsize,10)
    const atm = new Atom(camera,"C",pos) 
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
  "KeyS",
  e=>{
    console.log(Atom.hovering?.molecule)
    console.log(Atom.hovering?.count_atoms_in_molecule())
    console.log(Atom.hovering.molecule.classifyCarbonChain())
    console.log(Atom.hovering.molecule.getBasicNomenclature())
    Atom.hovering.molecule.ui.update()
  }
)

keybinds.addBehaviour(
  "KeyD",
  e=>{
    Atom.hovering?.remove()
  }
)

keybinds.addBehaviour(
  "KeyY",
  e=>{
    console.log(Atom.hovering?.lines)
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




import hand from './icons/hand-index-thumb.svg'
import dash from './icons/dash-lg.svg'
import mouse from './icons/mouse.svg'
import x from './icons/x.svg'
UIHandler.addMode("Move",hand)
UIHandler.addMode("Selection",mouse)
UIHandler.addMode("Line",dash)
UIHandler.addMode("Delete",x)
UIHandler.setModeActive("Selection")
// keybinds.addBehaviour(
//   "0",
//   (e)=> {
//     if(camera.dragging) return
//     let pos = camera.getPositionInWorld(camera.mousePosition)
//     startpoint = pos
//     pos.snap(gridsize,10)

//     line = document.createElementNS(svgNS,"line")
//     camera.add(line)
    
//   },
//   (e)=>{
//     if (!line) return
//     let pos = camera.getPositionInWorld(camera.mousePosition)
//     pos.snap(gridsize,10)
//     updateLine(pos)
//     line = null
    
//   }
// )


// window.addEventListener("mousemove",()=>{
//     if(line){
//       let pos = camera.getPositionInWorld(camera.mousePosition)
//       pos.snap(gridsize,10)
//       updateLine(pos)
//     }
// })

console.log(atoms)