import './style.css'
import { svgNS, Point} from './types'
import { CameraHandler,gridsize } from './user/camera'
import { KeybindHandler } from './user/keybindHandler'
import { Graph } from './classes/graph'
import { Molecule } from './classes/molecule'
import { atoms } from './assets/atoms.json'
import { Atom } from './classes/atom'

const app = document.getElementById("app")
const camera = new CameraHandler(app)
const keybinds = new KeybindHandler(window)

keybinds.addBehaviour(
  "Space",
  e=>{
    camera.dragging = true 
    camera.camera.style.cursor = "move";
  },
  e=> {
    camera.dragging = false
    camera.camera.style.cursor = "default";
  }
)

keybinds.addBehaviour(
  "KeyC",
  e=>{
    let pos = camera.getPositionInWorld(camera.mousePosition)
    pos.snap(gridsize,10)
    const atm = new Atom(camera,"C",pos) 
  }
)

keybinds.addBehaviour(
  "KeyO",
  e=>{
    let pos = camera.getPositionInWorld(camera.mousePosition)
    pos.snap(gridsize,10)
    const atm = new Atom(camera,"O",pos) 
  }
)

keybinds.addBehaviour(
  "KeyS",
  e=>{
    console.log(Atom.hovering.molecule)
    console.log(Atom.hovering.count_atoms_in_molecule())
  }
)


let startpoint
let line
function updateLine(pos){
    line.setAttribute("x1",startpoint.x)
    line.setAttribute("y1",startpoint.y)
    line.setAttribute("x2",pos.x)
    line.setAttribute("y2",pos.y)
    line.setAttribute("stroke-width",2)
    line.setAttribute("stroke","black")
}


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