import './style.css'
import { svgNS, Point} from './types'
import { CameraHandler } from './user/camera'
import { KeybindHandler } from './user/keybindHandler'
import { graph } from './classes/graph'
import { atoms } from './assets/atoms.json'

const app = document.getElementById("app")
const gridsize = 40
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


keybinds.addBehaviour(
  "0",
  (e)=> {
    if(camera.dragging) return
    let pos = camera.getPositionInWorld(camera.mousePosition)
    startpoint = pos
    pos.snap(gridsize,10)

    line = document.createElementNS(svgNS,"line")
    camera.add(line)
    
  },
  (e)=>{
    if (!line) return
    let pos = camera.getPositionInWorld(camera.mousePosition)
    pos.snap(gridsize,10)
    updateLine(pos)
    line = null
    
  }
)

window.addEventListener("mousemove",()=>{
    if(line){
      let pos = camera.getPositionInWorld(camera.mousePosition)
      pos.snap(gridsize,10)
      updateLine(pos)
    }
})


const g = new graph()
g.add_node("a")
g.add_node("b")
g.add_node("c")
g.add_node("d")
g.add_node("e")
g.add_node("f")
g.add_node("g")
g.connect("a","g")
g.connect("a","b")
g.connect("b","c")
g.connect("c","d")
g.connect("d","e")
g.connect("d","f")
g.connect("d","g")
// g.connect("a","g")

console.log(g)
console.log(g.is_connected("a","b"))
console.log(g.length)

// dfs = depth first search (algoritmo pra pesquisa dentro de gráfico)
let search = g.dfs()
console.log("-=-=-")
console.log(search)
console.log(search.next())
console.log(search.next())
console.log(search.next())
console.log(search.next())
console.log(search.next())
console.log(search.next())
console.log(search.next())

let connected_nodes = Array.from(g.dfs())
console.log(connected_nodes)
// camera.setZoom(2)