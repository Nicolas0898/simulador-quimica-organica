import { Graph } from "./graph";

export class Molecule extends Graph{

    split_molecules(){
        var all_molecules = []
        for(let [atom,conns] of this.adj_list){
            let found = false
            /** @type {Molecule} */
            for(let mol of all_molecules){
                if(mol.is_node_in_graph(atom)){
                    found = true
                    atom.molecule = mol
                }
            }

            if(found) continue

            let connected = Array.from(atom.molecule.dfs(atom))
            console.log("connected:",connected)
            let new_mol = new Molecule()
            for(let conn of connected){
                new_mol.adj_list.set(conn,this.adj_list.get(conn))
            }
            console.log("new molecule: ",new_mol)
            all_molecules.push(new_mol)
            atom.molecule = new_mol
        }
        console.log("hey, splitting was requested!")
    }

    remove_node(node){
        super.remove_node(node)
        this.split_molecules()
    }

    count_atoms_in_molecule(root) {
        let search = this.dfs(root)
        let dict = new Map()
        let adj_list = this.adj_list

        for (let i of search) {
            let s = i.properties.symbol
            let h = "H"
            let stable_at = i.properties.stable_at ?? 8
            let eletrons_left = stable_at - i.properties.e_valence
            if (!dict.get(s)) {
                dict.set(s, 1)
            } else {
                dict.set(s, dict.get(s) + 1)
            }

            if (!dict.get(h)) {
                dict.set(h, eletrons_left - adj_list.get(i).length)
            } else {
                dict.set(h, dict.get(h) + eletrons_left - adj_list.get(i).length)
            }
        }

        return dict
    }

    get_molecule_bounding_box(){
        let minx,miny,maxx,maxy
        let search = this.molecule.dfs(this)
        /** @type {Atom} */
        for (let i of search) {
            if(!minx){
                minx = i.pos.x
                miny = i.pos.y
                maxx = i.pos.x
                maxy = i.pos.y
            }
            if(minx<i.pos.x){minx = i.pos.x}
            if(miny<i.pos.y){miny = i.pos.y}
            if(maxx>i.pos.x){maxx = i.pos.x}
            if(maxy>i.pos.y){maxy = i.pos.y}
        }
        return {x1:minx,y1:miny,x2:maxx,y2:maxy}
    }
}