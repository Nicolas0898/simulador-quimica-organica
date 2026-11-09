export class Graph{
    /** @type {Map} */
    // Fazer conexões por peso
    adj_list = new Map()


    get_adj_list(){
        return new Map(this.adj_list)
    }

    get length(){
        return Array.from(this.adj_list.entries()).length
    }

    /**
     * @param {any} node 
     */
    add_node(node){
        this.adj_list.set(node,[])
    }

    remove_node(node){
        let copy = new Map(this.adj_list)
        for(let [nd,_] of copy){
            // console.log(nd)
            this.disconnect(node,nd)
        }
        this.adj_list.delete(node)
        //TODO: fazer ele desconectar do resto
    }
    get_all_nodes(){
        return Array.from(this.adj_list.keys())
    }

    get_connected_nodes(node){
        return this.adj_list.get(node)
    }

    is_node_in_graph(node){
        return this.adj_list.has(node)
    }

    /**
     * @param {any} node1 
     * @param {any} node2 
     */
    connect(node1,node2){
        this.adj_list.get(node1)?.push(node2)
        this.adj_list.get(node2)?.push(node1)
    }

    /**
     * @param {any} node1 
     * @param {any} node2 
     */
    disconnect(node1,node2){
        this.adj_list.set(node1,this.adj_list.get(node1).filter(x=>{return x!=node2}))
        this.adj_list.set(node2,this.adj_list.get(node2).filter(x=>{return x!=node1}))
    }

    /**
     * 
     * @param {any} node1 
     * @param {any} node2
     * @returns {boolean} 
     */
    is_connected(node1,node2){
        return this.adj_list.get(node1).indexOf(node2) != -1
    }

    *dfs(root,visited=[]){
        if(root == undefined) root = this.adj_list.keys().next().value
        console.log("root: ",root)
        if(this.adj_list.get(root) == undefined) console.log("ROOT FOR SOME FUCKING REASON HAS NOTHING IN THE MOLECULE")
        const list = this.adj_list.get(root).filter(x=>visited.indexOf(x)==-1)
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
        if(other==this) return 
        for(const i of other.get_all_nodes()){
            if(!this.adj_list.has(i)) this.add_node(i)
        }
        for(const [i,val] of other.get_adj_list()){
            this.adj_list.set(i,[...this.adj_list.get(i),...val])
        }
        for(const i of this.get_all_nodes()){
            i.molecule = this
        }
    }

}