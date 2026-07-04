export class Point{
    /**@type {number} */
    x
    /**@type {number} */
    y

    /**
     * @param {Point} point 
     */
    sum(point){
        this.x+=point.x
        this.y+=point.y
        return this
    }

    /**
     * @param {Point} point 
     */
    subtract(point){
        this.x-=point.x
        this.y-=point.y
        return this
    }

    /**
     * @param {Point} point 
     */
    multiply(point){
        this.x*=point.x
        this.y*=point.y
        return this
    }

    /**
     * @param {number} number 
     */
    multiply_scalar(number){
        this.x*=number
        this.y*=number
        return this
    }

    /**
     * 
     * @returns number
     */
    size(){
        return Math.sqrt(Math.pow(this.x,2) + Math.pow(this.y,2))
    }

    snap(gridsize,offset){
        this.x = Math.round((this.x - offset??0)/gridsize)*gridsize + offset??0
        this.y = Math.round((this.y - offset??0)/gridsize)*gridsize + offset??0
    }

    normalize(){
        const mg = this.size()
        return new Point(this.x/mg,this.y/mg)
    }

    equals(other){
        return this.x==other.x && this.y==other.y
    }

    /**
     * @param {number} x
     * @param {number} y  
     */
    constructor(x,y){
        this.x = x
        this.y = y
    }
}

export const svgNS = "http://www.w3.org/2000/svg"