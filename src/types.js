export class Point{
    /**@type {number} */
    x
    /**@type {number} */
    y

    /**
     * @param {Point} point 
     */
    sum(point){
        var np = new Point(this.x,this.y)
        np.x+=point.x
        np.y+=point.y
        return np
    }

    /**
     * @param {Point} point 
     */
    subtract(point){
        var np = new Point(this.x,this.y)
        np.x-=point.x
        np.y-=point.y
        return np
    }

    /**
     * @param {Point} point 
     */
    multiply(point){
        var np = new Point(this.x,this.y)
        np.x*=point.x
        np.y*=point.y
        return np
    }

    /**
     * @param {number} number 
     */
    multiply_scalar(number){
        var np = new Point(this.x,this.y)
        np.x*=number
        np.y*=number
        return np
    }

    /**
     * 
     * @returns number
     */
    size(){
        return Math.sqrt(Math.pow(this.x,2) + Math.pow(this.y,2))
    }

    snap(gridsize,offset=0){
        var np = new Point(this.x,this.y)
        np.x = Math.round((np.x - offset??0)/gridsize)*gridsize + offset??0
        np.y = Math.round((np.y - offset??0)/gridsize)*gridsize + offset??0
        return np
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

    set(x,y){
        this.x = x
        this.y = y
        return this
    }

    rotate_rad(angle){
        var np = new Point(this.x,this.y)
        np.x = this.x * Math.cos(angle) + this.y * -Math.sin(angle)
        np.y = this.x * Math.sin(angle) + this.y * Math.cos(angle)
        return np
    }

    clone(){
        return new Point(this.x,this.y)
    }
}

export const svgNS = "http://www.w3.org/2000/svg"