export class Graph{
    /** @type {Map} */
    #adj_list = new Map()


    get_adj_list(){
        return new Map(this.#adj_list)
    }

    get length(){
        return Array.from(this.#adj_list.entries()).length
    }

    /**
     * @param {any} node 
     */
    add_node(node){
        this.#adj_list.set(node,[])
    }

    get_all_nodes(node){
        return Array.from(this.#adj_list.keys())
    }

    /**
     * @param {any} node1 
     * @param {any} node2 
     */
    connect(node1,node2){
        this.#adj_list.get(node1)?.push(node2)
        this.#adj_list.get(node2)?.push(node1)
    }

    /**
     * @param {any} node1 
     * @param {any} node2 
     */
    disconnect(node1,node2){
        this.#adj_list.set(node1,this.#adj_list.get(node1).filter(x=>x!=node2))
        this.#adj_list.set(node2,this.#adj_list.get(node2).filter(x=>x!=node1))
    }

    /**
     * 
     * @param {any} node1 
     * @param {any} node2
     * @returns {boolean} 
     */
    is_connected(node1,node2){
        return this.#adj_list.get(node1).indexOf(node2) != -1
    }

    *dfs(root,visited=[]){
        if(root == undefined) root = this.#adj_list.keys().next().value
        const list = this.#adj_list.get(root).filter(x=>visited.indexOf(x)==-1)
        visited.push(root)
        // console.log("root: ",root," vis: ",visited," list: ",list)
        yield root


        for(const item of list){
            if(visited.indexOf(item)!=-1) continue
            const search = this.dfs(item,visited)
            
            for(const i of search){
                yield i
            }
        }
        
    }

    /**
     * 
     * @param {graph} other 
     */
    merge(other){
        for(const i of other.get_all_nodes()){
            this.add_node(i)
        }
        for(const [i,val] of other.get_adj_list()){
            this.#adj_list.set(i,val)
        }
    }

}