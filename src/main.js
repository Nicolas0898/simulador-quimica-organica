import './style.css'
import { CameraHandler } from './viewport/camera'

const svgNS = "http://www.w3.org/2000/svg"
const app = document.getElementById("app")

const camera = new CameraHandler(app)
// camera.setZoom(2)