
import { Graph } from "./graph";

const ROOTS = {
    1: "met", 2: "et", 3: "prop", 4: "but", 5: "pent",
    6: "hex", 7: "hept", 8: "oct", 9: "non", 10: "dec"
};

const ALKYL = {
    1: "metil", 2: "etil", 3: "propil",
    4: "butil", 5: "pentil", 6: "hexil"
};

const MULTIPLIERS = { 2: "di", 3: "tri", 4: "tetra" };

const unique = values => [...new Set(values ?? [])];
const symbolOf = atom => atom?.properties?.symbol;

function graphHasCycle(nodes, getNeighbors) {
    const visited = new Set();

    for (const start of nodes) {
        if (visited.has(start)) continue;

        const stack = [[start, null]];

        while (stack.length) {
            const [node, parent] = stack.pop();

            if (visited.has(node)) continue;
            visited.add(node);

            for (const next of getNeighbors(node)) {
                if (next === parent) continue;
                if (visited.has(next)) return true;
                stack.push([next, node]);
            }
        }
    }

    return false;
}

function getTreePath(start, target, adjacency) {
    const queue = [start];
    const previous = new Map([[start, null]]);

    for (let i = 0; i < queue.length; i++) {
        const node = queue[i];

        if (node === target) break;

        for (const next of adjacency.get(node) ?? []) {
            if (previous.has(next)) continue;

            previous.set(next, node);
            queue.push(next);
        }
    }

    if (!previous.has(target)) return null;

    const path = [];

    for (let node = target; node !== null; node = previous.get(node)) {
        path.push(node);
    }

    return path.reverse();
}

function compareLocants(a, b) {
    const n = Math.max(a.length, b.length);

    for (let i = 0; i < n; i++) {
        if (a[i] === undefined) return -1;
        if (b[i] === undefined) return 1;
        if (a[i] !== b[i]) return a[i] - b[i];
    }

    return 0;
}

function compareScores(a, b) {
    for (let i = 0; i < Math.max(a.length, b.length); i++) {
        const av = a[i] ?? 0;
        const bv = b[i] ?? 0;

        if (av !== bv) return av - bv;
    }

    return 0;
}

export class Molecule extends Graph {

    split_molecules() {
        const all_molecules = [];
        const visited = new Set();

        for (const atom of this.get_all_nodes()) {
            if (visited.has(atom)) continue;

            const connected = Array.from(this.dfs(atom));
            const new_mol = new Molecule();

            for (const conn of connected) {
                new_mol.adj_list.set(conn, this.adj_list.get(conn));
                conn.molecule = new_mol;
                visited.add(conn);
            }

            all_molecules.push(new_mol);
        }

        return all_molecules;
    }

    remove_node(node) {
        super.remove_node(node);
        return this.split_molecules();
    }

    count_atoms_in_molecule(root) {
        const dict = new Map();
        const adj_list = this.adj_list;

        for (const atom of this.dfs(root)) {
            const symbol = atom.properties.symbol;
            const stable_at = atom.properties.stable_at ?? 8;
            const electrons_left = stable_at - atom.properties.e_valence;

            dict.set(symbol, (dict.get(symbol) ?? 0) + 1);

            dict.set(
                "H",
                (dict.get("H") ?? 0) +
                electrons_left - adj_list.get(atom).length
            );
        }

        return dict;
    }

    get_molecule_bounding_box() {
        const atoms = this.get_all_nodes();

        if (!atoms.length) return null;

        let minx = Infinity;
        let miny = Infinity;
        let maxx = -Infinity;
        let maxy = -Infinity;

        for (const atom of atoms) {
            minx = Math.min(minx, atom.pos.x);
            miny = Math.min(miny, atom.pos.y);
            maxx = Math.max(maxx, atom.pos.x);
            maxy = Math.max(maxy, atom.pos.y);
        }

        return { x1: minx, y1: miny, x2: maxx, y2: maxy };
    }

    getUniqueNeighbors(atom) {
        return unique(this.get_connected_nodes(atom));
    }

    // Retorna a ordem da ligação: 1, 2 ou 3.
    getBondOrder(atom1, atom2) {
        const a = (this.get_connected_nodes(atom1) ?? [])
            .filter(x => x === atom2).length;

        const b = (this.get_connected_nodes(atom2) ?? [])
            .filter(x => x === atom1).length;

        return Math.min(a, b);
    }

    getCarbonNeighbors(atom) {
        return this.getUniqueNeighbors(atom)
            .filter(a => symbolOf(a) === "C");
    }

    // Classificação da cadeia carbônica.
    classifyCarbonChain() {
        const atoms = this.get_all_nodes();

        const carbons = atoms.filter(a => symbolOf(a) === "C");

        const heavyAtoms = atoms.filter(a => symbolOf(a) !== "H");
        const heavySet = new Set(heavyAtoms);

        const cyclic = graphHasCycle(
            heavyAtoms,
            a => this.getUniqueNeighbors(a)
                .filter(n => heavySet.has(n))
        );

        // Ramificação: carbono ligado a mais de dois carbonos distintos.
        const branchPoints = carbons.filter(
            c => this.getCarbonNeighbors(c).length > 2
        );

        // Identifica heteroátomos entre carbonos.
        const intercalatedHeteroatoms = heavyAtoms.filter(atom => {
            if (symbolOf(atom) === "C") return false;

            const sidesWithCarbon = this.getUniqueNeighbors(atom)
                .filter(neighbor => symbolOf(neighbor) !== "H")
                .filter(start => {
                    const visited = new Set([atom]);
                    const stack = [start];

                    while (stack.length) {
                        const current = stack.pop();

                        if (visited.has(current)) continue;
                        visited.add(current);

                        if (symbolOf(current) === "C") return true;

                        for (const next of this.getUniqueNeighbors(current)) {
                            if (
                                symbolOf(next) !== "H" &&
                                !visited.has(next)
                            ) {
                                stack.push(next);
                            }
                        }
                    }

                    return false;
                });

            return sidesWithCarbon.length >= 2;
        });

        // Identifica ligações duplas e triplas C-C.
        const multipleBonds = [];

        for (const c of carbons) {
            for (const other of this.getCarbonNeighbors(c)) {
                if (carbons.indexOf(c) < carbons.indexOf(other)) {
                    const order = this.getBondOrder(c, other);

                    if (order > 1) {
                        multipleBonds.push({
                            atom1: c,
                            atom2: other,
                            order
                        });
                    }
                }
            }
        }

        return {
            aberta: !cyclic,
            fechada: cyclic,

            normal: branchPoints.length === 0,
            ramificada: branchPoints.length > 0,

            homogenea: intercalatedHeteroatoms.length === 0,
            heterogenea: intercalatedHeteroatoms.length > 0,

            saturada: multipleBonds.length === 0,
            insaturada: multipleBonds.length > 0,

            pontosDeRamificacao: branchPoints,
            heteroatomosIntercalados: intercalatedHeteroatoms,
            ligacoesMultiplas: multipleBonds
        };
    }


    getBasicNomenclature() {
        const unsupported = reason => ({
            supported: false,
            name: null,
            reason
        });

        const atoms = this.get_all_nodes();
        const carbons = atoms.filter(a => symbolOf(a) === "C");

        if (!carbons.length) {
            return unsupported("A molécula não contém carbono.");
        }

        if (carbons.length > 10) {
            return unsupported("O limite implementado é de 10 carbonos.");
        }

        const carbonAdj = new Map(
            carbons.map(c => [c, this.getCarbonNeighbors(c)])
        );

        const carbonCycle = graphHasCycle(
            carbons,
            c => carbonAdj.get(c)
        );

        const carbonEdges = [];

        for (const c of carbons) {
            for (const n of carbonAdj.get(c)) {
                if (carbons.indexOf(c) < carbons.indexOf(n)) {
                    const order = this.getBondOrder(c, n);

                    if (order > 3) {
                        return unsupported("Ordem de ligação maior que 3.");
                    }

                    if (order > 1) {
                        carbonEdges.push({ a: c, b: n, order });
                    }
                }
            }
        }

        // Reconhecimento de funções orgânicas.
        const groups = {
            acid: [],
            aldehyde: [],
            ketone: [],
            alcohol: []
        };

        const allowedO = new Set();
        let unsupportedCarbonyl = false;

        for (const c of carbons) {
            const oxygens = this.getUniqueNeighbors(c)
                .filter(a => symbolOf(a) === "O");

            const doubleO = oxygens.filter(
                o => this.getBondOrder(c, o) === 2
            );

            const singleO = oxygens.filter(
                o => this.getBondOrder(c, o) === 1
            );

            for (const o of doubleO) allowedO.add(o);

            if (doubleO.length) {
                const acidO = singleO.find(
                    o => this.getCarbonNeighbors(o).length === 1
                );

                const esterO = singleO.some(
                    o => this.getCarbonNeighbors(o).length >= 2
                );

                const amideN = this.getUniqueNeighbors(c).some(
                    a => symbolOf(a) === "N" &&
                        this.getBondOrder(c, a) === 1
                );

                if (acidO) {
                    groups.acid.push(c);
                    allowedO.add(acidO);
                } else if (
                    esterO ||
                    amideN ||
                    singleO.length > 0
                ) {
                    unsupportedCarbonyl = true;
                } else {
                    const carbonCount = carbonAdj.get(c).length;

                    if (carbonCount <= 1) {
                        groups.aldehyde.push(c);
                    } else if (carbonCount === 2) {
                        groups.ketone.push(c);
                    } else {
                        unsupportedCarbonyl = true;
                    }
                }
            }
        }

        const acidOxygens = new Set();

        for (const c of groups.acid) {
            for (const o of this.getUniqueNeighbors(c)) {
                if (
                    symbolOf(o) === "O" &&
                    this.getBondOrder(c, o) === 1 &&
                    this.getCarbonNeighbors(o).length === 1
                ) {
                    acidOxygens.add(o);
                }
            }
        }

        // Reconhece álcoois.
        for (const c of carbons) {
            for (const o of this.getUniqueNeighbors(c).filter(
                a => symbolOf(a) === "O"
            )) {
                if (
                    this.getBondOrder(c, o) === 1 &&
                    this.getCarbonNeighbors(o).length === 1 &&
                    !acidOxygens.has(o)
                ) {
                    groups.alcohol.push(c);
                    allowedO.add(o);
                }
            }
        }

        if (unsupportedCarbonyl) {
            return unsupported(
                "Ésteres, amidas e outros derivados de carbonila ainda não são reconhecidos."
            );
        }

        const groupTypes = Object.keys(groups)
            .filter(k => groups[k].length > 0);

        const totalGroupSites = Object.values(groups)
            .reduce((sum, sites) => sum + sites.length, 0);

        if (groupTypes.length > 1 || totalGroupSites > 1) {
            return unsupported(
                "A molécula possui mais de uma função orgânica."
            );
        }

        const group = groupTypes[0] ?? null;
        const functionalSite = group ? groups[group][0] : null;

        // Verifica elementos ainda não suportados.
        for (const atom of atoms) {
            const s = symbolOf(atom);

            if (
                s !== "C" &&
                s !== "H" &&
                !(s === "O" && allowedO.has(atom))
            ) {
                return unsupported(
                    `O elemento ${s} ainda não é suportado.`
                );
            }
        }

        const chainInfo = this.classifyCarbonChain();

        // Tratamento de ciclos simples.
        if (chainInfo.fechada) {
            if (!carbonCycle) {
                return unsupported(
                    "Cadeias cíclicas com heteroátomos no anel não são suportadas."
                );
            }

            if (
                group ||
                carbonAdj.size < 3 ||
                !carbons.every(c => carbonAdj.get(c).length === 2)
            ) {
                return unsupported(
                    "Só são suportados anéis carbônicos simples, sem ramificações ou funções."
                );
            }

            if (carbonEdges.length > 1) {
                return unsupported(
                    "Anéis com mais de uma ligação múltipla não são suportados."
                );
            }

            const root = ROOTS[carbons.length];

            const ending = carbonEdges.length === 0
                ? "ano"
                : carbonEdges[0].order === 2
                    ? "eno"
                    : "ino";

            return {
                supported: true,
                name: `ciclo${root}${ending}`,
                reason: null
            };
        }

        // Verifica se os carbonos formam uma única cadeia conectada.
        const components = [];
        const visited = new Set();

        for (const start of carbons) {
            if (visited.has(start)) continue;

            const component = [];
            const stack = [start];

            visited.add(start);

            while (stack.length) {
                const node = stack.pop();
                component.push(node);

                for (const next of carbonAdj.get(node)) {
                    if (!visited.has(next)) {
                        visited.add(next);
                        stack.push(next);
                    }
                }
            }

            components.push(component);
        }

        if (components.length !== 1) {
            return unsupported(
                "Os carbonos não formam uma única cadeia contínua."
            );
        }

        if (carbonCycle) {
            return unsupported(
                "A estrutura cíclica é mais complexa que um anel simples."
            );
        }

        // Encontra todos os caminhos possíveis entre pares de carbonos.
        const paths = [];

        for (let i = 0; i < carbons.length; i++) {
            for (let j = i; j < carbons.length; j++) {
                const path = getTreePath(
                    carbons[i],
                    carbons[j],
                    carbonAdj
                );

                if (path) paths.push(path);
            }
        }

        // Prioridade: função orgânica, insaturação e tamanho.

        // Seleção da cadeia principal.
        // A cadeia precisa conter:
        // 1. A função orgânica principal, se existir.
        // 2. TODAS as ligações múltiplas C-C.
        // 3. O maior número possível de carbonos.

        const containsBond = (path, a, b) => {
            for (let i = 0; i < path.length - 1; i++) {
                if (
                    (path[i] === a && path[i + 1] === b) ||
                    (path[i] === b && path[i + 1] === a)
                ) {
                    return true;
                }
            }

            return false;
        };

        // Primeiro, exige que a cadeia contenha a função orgânica.
        let eligiblePaths = paths.filter(path =>
            !functionalSite || path.includes(functionalSite)
        );

        if (!eligiblePaths.length) {
            return unsupported(
                "Não foi possível encontrar uma cadeia principal contendo a função orgânica."
            );
        }

        // Depois, exige que todas as insaturações estejam na cadeia.
        if (carbonEdges.length > 0) {
            eligiblePaths = eligiblePaths.filter(path =>
                carbonEdges.every(edge =>
                    containsBond(path, edge.a, edge.b)
                )
            );

            if (!eligiblePaths.length) {
                return unsupported(
                    "Não existe uma única cadeia principal que contenha todas as insaturações. Insaturações em ramificações diferentes ainda não são suportadas."
                );
            }
        }

        // Finalmente, escolhe a maior cadeia entre as candidatas válidas.
        eligiblePaths.sort((a, b) => b.length - a.length);

        const parentPath = eligiblePaths[0];


        if (
            !parentPath ||
            (functionalSite && !parentPath.includes(functionalSite))
        ) {
            return unsupported(
                "Não foi possível encontrar uma cadeia principal adequada."
            );
        }

        // Localiza insaturações na cadeia principal.
        const chainUnsaturations = [];

        for (let i = 0; i < parentPath.length - 1; i++) {
            const order = this.getBondOrder(
                parentPath[i],
                parentPath[i + 1]
            );

            if (order > 1) {
                chainUnsaturations.push({
                    index: i + 1,
                    order
                });
            }
        }

        if (chainUnsaturations.length !== carbonEdges.length) {
            return unsupported(
                "Há ligação múltipla em uma ramificação, ainda não suportada."
            );
        }

        if (chainUnsaturations.length > 1) {
            return unsupported(
                "Dienos, diínos e múltiplas ligações ainda não são suportados."
            );
        }

        // Identifica ramificações.
        function getBranches(path) {
            const inChain = new Set(path);
            const seen = new Set();
            const branches = [];

            for (let i = 0; i < path.length; i++) {
                const anchor = path[i];

                for (const start of carbonAdj.get(anchor)) {
                    if (inChain.has(start) || seen.has(start)) continue;

                    const component = [];
                    const stack = [[start, anchor]];

                    while (stack.length) {
                        const [node, previous] = stack.pop();

                        if (seen.has(node) || inChain.has(node)) continue;

                        seen.add(node);
                        component.push(node);

                        for (const next of carbonAdj.get(node)) {
                            if (
                                next !== previous &&
                                !inChain.has(next) &&
                                !seen.has(next)
                            ) {
                                stack.push([next, node]);
                            }
                        }
                    }

                    const branchSet = new Set(component);

                    for (const node of component) {
                        const internalDegree = carbonAdj.get(node)
                            .filter(n => branchSet.has(n)).length;

                        if (
                            internalDegree > 2 ||
                            (node === start && internalDegree > 1)
                        ) {
                            return {
                                ok: false,
                                reason: "Ramificação complexa não suportada."
                            };
                        }

                        for (const n of carbonAdj.get(node)) {
                            if (branchSet.has(n) || n === anchor) {
                                if (this.getBondOrder(node, n) !== 1) {
                                    return {
                                        ok: false,
                                        reason: "Ramificação com ligação múltipla não suportada."
                                    };
                                }
                            }
                        }
                    }

                    if (!ALKYL[component.length]) {
                        return {
                            ok: false,
                            reason: "Tamanho de ramificação não suportado."
                        };
                    }

                    branches.push({
                        position: i + 1,
                        size: component.length
                    });
                }
            }

            return { ok: true, branches };
        }

        // Testa as duas orientações da cadeia principal.
        const orientations = [
            parentPath,
            [...parentPath].reverse()
        ].map(path => {
            const index = new Map(
                path.map((atom, i) => [atom, i + 1])
            );

            const functionLocants = functionalSite
                ? [index.get(functionalSite)]
                : [];

            const unsaturationLocants = chainUnsaturations
                .map(b => {
                    const a = path.indexOf(parentPath[b.index - 1]);
                    const z = path.indexOf(parentPath[b.index]);

                    return Math.min(a, z) + 1;
                })
                .sort((a, b) => a - b);

            const branchResult = getBranches.call(this, path);

            const branchLocants = branchResult.ok
                ? branchResult.branches
                    .map(b => b.position)
                    .sort((a, b) => a - b)
                : [];

            return {
                path,
                index,
                functionLocants,
                unsaturationLocants,
                branchLocants,
                branchResult,
                key: [
                    functionLocants,
                    unsaturationLocants,
                    branchLocants
                ]
            };
        });

        orientations.sort((a, b) => {
            for (let i = 0; i < 3; i++) {
                const result = compareLocants(a.key[i], b.key[i]);

                if (result !== 0) return result;
            }

            return 0;
        });

        const chosen = orientations[0];

        if (!chosen.branchResult.ok) {
            return unsupported(chosen.branchResult.reason);
        }

        // Agrupa ramificações iguais.
        const branchGroups = new Map();

        for (const branch of chosen.branchResult.branches) {
            if (!branchGroups.has(branch.size)) {
                branchGroups.set(branch.size, []);
            }

            branchGroups.get(branch.size).push(branch.position);
        }

        const substituents = [...branchGroups.entries()]
            .map(([size, locants]) => ({
                alkyl: ALKYL[size],
                text: `${locants.sort((a, b) => a - b).join(",")}-${MULTIPLIERS[locants.length] ?? ""}${ALKYL[size]}`
            }))
            .sort((a, b) =>
                a.alkyl.localeCompare(b.alkyl, "pt")
            )
            .map(x => x.text);

        // Montagem do nome principal.
        const root = ROOTS[chosen.path.length];

        const unsaturation = chainUnsaturations[0] ?? null;

        const unsatLocant = unsaturation
            ? chosen.unsaturationLocants[0]
            : null;

        const functionLocant = functionalSite
            ? chosen.index.get(functionalSite)
            : null;

        const core = unsaturation
            ? `${root}-${unsatLocant}-${unsaturation.order === 2 ? "en" : "in"}`
            : `${root}an`;

        let parentName;

        if (group === "acid") {
            if (functionLocant !== 1) {
                return unsupported(
                    "O carbono do ácido precisa ser o carbono 1."
                );
            }

            parentName = `${core}oico`;

        } else if (group === "aldehyde") {
            if (functionLocant !== 1) {
                return unsupported(
                    "O carbono do aldeído precisa ser o carbono 1."
                );
            }

            parentName = `${core}al`;

        } else if (group === "ketone") {
            parentName = `${core}-${functionLocant}-ona`;

        } else if (group === "alcohol") {
            parentName = chosen.path.length <= 2
                ? `${root}anol`
                : `${core}-${functionLocant}-ol`;

        } else if (unsaturation) {
            parentName = chosen.path.length === 2
                ? `${root}${unsaturation.order === 2 ? "eno" : "ino"}`
                : `${root}-${unsatLocant}-${unsaturation.order === 2 ? "eno" : "ino"}`;

        } else {
            parentName = `${root}ano`;
        }

        const substituentPrefix = substituents.length
            ? substituents.join("-")
            : "";

        const name = group === "acid"
            ? `ácido ${substituentPrefix}${parentName}`
            : `${substituentPrefix}${parentName}`;

        return {
            supported: true,
            name,
            reason: null
        };
    }
}