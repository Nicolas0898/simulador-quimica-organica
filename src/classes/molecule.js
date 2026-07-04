import { Graph } from "./graph";

export class Molecule extends Graph{


    count_atoms_in_molecule(root) {
        let search = this.dfs(root)
        let dict = new Map()
        let adj_list = this.get_adj_list()

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
        for (let i of search) {
        
        }
    }
}