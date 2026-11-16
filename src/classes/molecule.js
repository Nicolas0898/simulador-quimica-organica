
import { Graph } from "./graph";
import { moleculeUI } from "./moleculeUI";

const PRIORITYLIST = { C: 1, H: 2, O: 3 }
const ROOTS = {
    1: "met", 2: "et", 3: "prop", 4: "but", 5: "pent",
    6: "hex", 7: "hept", 8: "oct", 9: "non", 10: "dec"
};

const ALKYL = {
    1: "metil", 2: "etil", 3: "propil",
    4: "butil", 5: "pentil", 6: "hexil"
};


const MULTIPLIERS = { 2: "di", 3: "tri", 4: "tetra" };

const ALKOXY = {
    1: "metoxi",
    2: "etoxi",
    3: "propoxi",
    4: "butoxi",
    5: "pentoxi",
    6: "hexoxi"
};

// Retorna uma cadeia linear conectada a partir de um átomo.
// Retorna null caso exista ramificação ou ciclo.
function getLinearCarbonPath(start, adjacency) {
    if (!adjacency.has(start)) return null;

    const component = new Set();
    const stack = [start];

    while (stack.length) {
        const node = stack.pop();

        if (component.has(node)) continue;

        component.add(node);

        for (const next of adjacency.get(node) ?? []) {
            if (!component.has(next)) stack.push(next);
        }
    }

    const degree = node =>
        (adjacency.get(node) ?? [])
            .filter(next => component.has(next)).length;

    const degrees = [...component].map(degree);

    if (degrees.some(d => d > 2)) return null;

    const edgeCount =
        degrees.reduce((sum, d) => sum + d, 0) / 2;

    if (edgeCount !== component.size - 1) return null;

    if (component.size === 1) return [start];

    const ends = [...component].filter(node => degree(node) === 1);

    if (ends.length !== 2) return null;

    const path = [];
    let previous = null;
    let current = ends[0];

    while (current !== undefined) {
        path.push(current);

        const next = (adjacency.get(current) ?? [])
            .filter(node =>
                component.has(node) && node !== previous
            );

        previous = current;
        current = next[0];
    }

    return path.length === component.size ? path : null;
}

function isSaturatedPath(path, molecule) {
    for (let i = 0; i < path.length - 1; i++) {
        if (molecule.getBondOrder(path[i], path[i + 1]) !== 1) {
            return false;
        }
    }

    return true;
}

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

    ui = new moleculeUI(this)

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

        all_molecules.forEach(m => m.ui.update())
        this.ui.clearElements()
        return all_molecules;
    }

    merge(other) {
        super.merge(other)
        this.ui.clearElements()
        other.ui.clearElements()
    }

    remove_node(node) {
        super.remove_node(node);
        return this.split_molecules();
    }

    disconnect(node1, node2, split = false) {
        super.disconnect(node1, node2)
        if (split) this.split_molecules()
    }

    disconnect_once(node1, node2, split = false) {
        super.disconnect_once(node1, node2)
        if (split) this.split_molecules()
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

        const sortedMap = new Map(
            [...dict].sort(([keyA], [keyB]) => { console.log(keyA, keyB, PRIORITYLIST[keyA], PRIORITYLIST[keyB]); return (PRIORITYLIST[keyA] ?? 10) - (PRIORITYLIST[keyB] ?? 10) })
        );
        console.log("BEFORE MAP: ", dict)
        console.log("SORTED MAP:", sortedMap)
        return sortedMap;
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
        let resultGroup = null;

        const unsupported = reason => ({
            supported: false,
            name: null,
            group: resultGroup,
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

        const oxygens = atoms.filter(a => symbolOf(a) === "O");
        const heavyAtoms = atoms.filter(a => symbolOf(a) !== "H");

        // ======================================================
        // BENZENO E FENOL
        // ======================================================

        let aromaticRing = false;

        if (
            carbons.length === 6 &&
            carbons.every(c => carbonAdj.get(c).length === 2)
        ) {
            const reached = new Set([carbons[0]]);
            const stack = [carbons[0]];

            while (stack.length) {
                const current = stack.pop();

                for (const next of carbonAdj.get(current)) {
                    if (!reached.has(next)) {
                        reached.add(next);
                        stack.push(next);
                    }
                }
            }

            const ringEdges = [];

            for (const c of carbons) {
                for (const n of carbonAdj.get(c)) {
                    if (carbons.indexOf(c) < carbons.indexOf(n)) {
                        ringEdges.push({
                            a: c,
                            b: n,
                            order: this.getBondOrder(c, n)
                        });
                    }
                }
            }

            const doubleEdges = ringEdges.filter(e => e.order === 2);

            // Detecta a estrutura de Kekulé do benzeno:
            // 6 carbonos, 6 ligações no anel e 3 duplas alternadas.
            aromaticRing =
                reached.size === 6 &&
                ringEdges.length === 6 &&
                doubleEdges.length === 3 &&
                carbons.every(c =>
                    carbonAdj.get(c).filter(
                        n => this.getBondOrder(c, n) === 2
                    ).length === 1
                );

            if (aromaticRing) {
                const outside = heavyAtoms.filter(
                    a => symbolOf(a) !== "C"
                );

                // Benzeno.
                if (outside.length === 0) {
                    resultGroup = "Hidrocarboneto aromático";

                    return {
                        supported: true,
                        name: "benzeno",
                        group: resultGroup,
                        reason: null
                    };
                }

                // Fenol: um único oxigênio ligado diretamente ao anel.
                if (
                    outside.length === 1 &&
                    symbolOf(outside[0]) === "O"
                ) {
                    const phenolO = outside[0];

                    const neighbors = this.getUniqueNeighbors(phenolO)
                        .filter(a => symbolOf(a) !== "H");

                    if (
                        neighbors.length === 1 &&
                        carbons.includes(neighbors[0]) &&
                        this.getBondOrder(phenolO, neighbors[0]) === 1
                    ) {
                        resultGroup = "Fenol";

                        return {
                            supported: true,
                            name: "fenol",
                            group: resultGroup,
                            reason: null
                        };
                    }
                }

                resultGroup = "Hidrocarboneto aromático";

                return unsupported(
                    "Somente benzeno e fenol simples são suportados."
                );
            }
        }

        // ======================================================
        // ÉSTERES: R-COO-R'
        // ======================================================

        const esterCandidates = [];

        for (const c of carbons) {
            const oxygenNeighbors = this.getUniqueNeighbors(c)
                .filter(a => symbolOf(a) === "O");

            const doubleO = oxygenNeighbors.filter(
                o => this.getBondOrder(c, o) === 2
            );

            if (doubleO.length !== 1) continue;

            for (const bridgeO of oxygenNeighbors) {
                if (
                    bridgeO === doubleO[0] ||
                    this.getBondOrder(c, bridgeO) !== 1
                ) continue;

                const bridgeNeighbors = this.getUniqueNeighbors(bridgeO)
                    .filter(a => symbolOf(a) !== "H");

                const otherCarbon = bridgeNeighbors.find(
                    a => a !== c && symbolOf(a) === "C"
                );

                if (
                    bridgeNeighbors.length === 2 &&
                    bridgeNeighbors.includes(c) &&
                    otherCarbon
                ) {
                    esterCandidates.push({
                        carbonyl: c,
                        carbonylO: doubleO[0],
                        bridgeO,
                        alkoxyCarbon: otherCarbon
                    });
                }
            }
        }

        if (esterCandidates.length) {
            resultGroup = "Éster";

            if (esterCandidates.length !== 1) {
                return unsupported("Ésteres múltiplos ainda não são suportados.");
            }

            const {
                carbonyl,
                carbonylO,
                bridgeO,
                alkoxyCarbon
            } = esterCandidates[0];

            // Parte derivada do ácido.
            const acidPath = getLinearCarbonPath(carbonyl, carbonAdj);

            // Parte derivada do álcool.
            const alkylPath = getLinearCarbonPath(alkoxyCarbon, carbonAdj);

            const acidSet = new Set(acidPath ?? []);
            const alkylSet = new Set(alkylPath ?? []);

            const onlyExpectedOxygens =
                oxygens.length === 2 &&
                oxygens.includes(carbonylO) &&
                oxygens.includes(bridgeO);

            const carbonylONeighbors = this.getUniqueNeighbors(carbonylO)
                .filter(a => symbolOf(a) !== "H");

            const bridgeONeighbors = this.getUniqueNeighbors(bridgeO)
                .filter(a => symbolOf(a) !== "H");

            if (
                !acidPath ||
                !alkylPath ||
                acidPath.length + alkylPath.length !== carbons.length ||
                [...acidSet].some(a => alkylSet.has(a)) ||
                !onlyExpectedOxygens ||
                carbonAdj.get(carbonyl).length > 1 ||
                (acidPath.length > 1 && carbonAdj.get(carbonyl).length !== 1) ||
                !carbonylONeighbors.includes(carbonyl) ||
                carbonylONeighbors.length !== 1 ||
                bridgeONeighbors.length !== 2 ||
                !bridgeONeighbors.includes(carbonyl) ||
                !bridgeONeighbors.includes(alkoxyCarbon) ||
                !heavyAtoms.every(a =>
                    symbolOf(a) === "C" || symbolOf(a) === "O"
                ) ||
                !isSaturatedPath(acidPath, this) ||
                !isSaturatedPath(alkylPath, this)
            ) {
                return unsupported(
                    "Este éster possui ramificação, insaturação ou outra função não suportada."
                );
            }

            if (
                !ROOTS[acidPath.length] ||
                !ALKYL[alkylPath.length]
            ) {
                return unsupported(
                    "O tamanho da parte ácida ou do grupo ligado ao oxigênio não é suportado."
                );
            }

            return {
                supported: true,
                name: `${ROOTS[acidPath.length]}anoato de ${ALKYL[alkylPath.length]}a`,
                group: resultGroup,
                reason: null
            };
        }

        // ======================================================
        // ÉTERES: R-O-R'
        // ======================================================

        const etherCandidates = oxygens.filter(o => {
            const neighbors = this.getUniqueNeighbors(o)
                .filter(a => symbolOf(a) !== "H");

            return (
                neighbors.length === 2 &&
                neighbors.every(a => symbolOf(a) === "C") &&
                neighbors.every(a => this.getBondOrder(o, a) === 1)
            );
        });

        if (etherCandidates.length) {
            resultGroup = "Éter";

            if (
                etherCandidates.length !== 1 ||
                oxygens.length !== 1 ||
                !heavyAtoms.every(a =>
                    symbolOf(a) === "C" || symbolOf(a) === "O"
                )
            ) {
                return unsupported(
                    "Éteres com múltiplos oxigênios ou outras funções não são suportados."
                );
            }

            const etherO = etherCandidates[0];

            const [carbonA, carbonB] = this.getUniqueNeighbors(etherO)
                .filter(a => symbolOf(a) === "C");

            const pathA = getLinearCarbonPath(carbonA, carbonAdj);
            const pathB = getLinearCarbonPath(carbonB, carbonAdj);

            const setA = new Set(pathA ?? []);
            const setB = new Set(pathB ?? []);

            if (
                !pathA ||
                !pathB ||
                pathA.length + pathB.length !== carbons.length ||
                [...setA].some(a => setB.has(a)) ||
                !isSaturatedPath(pathA, this) ||
                !isSaturatedPath(pathB, this)
            ) {
                return unsupported(
                    "Somente éteres com cadeias lineares e saturadas são suportados."
                );
            }

            // A cadeia maior é a principal.
            let parentPath = pathA;
            let alkoxyPath = pathB;
            let parentAttachment = carbonA;
            let alkoxyAttachment = carbonB;

            if (pathB.length > pathA.length) {
                parentPath = pathB;
                alkoxyPath = pathA;
                parentAttachment = carbonB;
                alkoxyAttachment = carbonA;
            }

            if (
                !ALKOXY[alkoxyPath.length] ||
                !ROOTS[parentPath.length] ||
                (
                    alkoxyPath.indexOf(alkoxyAttachment) !== 0 &&
                    alkoxyPath.indexOf(alkoxyAttachment) !== alkoxyPath.length - 1
                )
            ) {
                return unsupported(
                    "O tamanho ou a estrutura do grupo alcoxi não é suportado."
                );
            }

            let locant = parentPath.indexOf(parentAttachment) + 1;

            // Escolhe a numeração que produz o menor localizador.
            locant = Math.min(
                locant,
                parentPath.length - locant + 1
            );

            const locantPrefix = parentPath.length > 2
                ? `${locant}-`
                : "";

            return {
                supported: true,
                name: `${locantPrefix}${ALKOXY[alkoxyPath.length]}${ROOTS[parentPath.length]}ano`,
                group: resultGroup,
                reason: null
            };
        }

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

        const group = groupTypes[0] ?? null;

        const functionalSite = group
            ? groups[group][0]
            : null;

        const groupNames = {
            acid: "Ácido carboxílico",
            aldehyde: "Aldeído",
            ketone: "Cetona",
            alcohol: "Álcool"
        };

        resultGroup = group
            ? groupNames[group]
            : "Hidrocarboneto";

        if (groupTypes.length > 1 || totalGroupSites > 1) {
            if (groupTypes.length > 1) {
                resultGroup = "Múltiplas funções orgânicas";
            }

            return unsupported(
                "A molécula tem mais de uma função orgânica ou mais de um centro funcional."
            );
        }

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
                group: "Hidrocarboneto",
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

        // Primeiro exige a função principal.
        let eligiblePaths = paths.filter(path =>
            !functionalSite || path.includes(functionalSite)
        );

        // Depois exige TODAS as insaturações.
        if (carbonEdges.length) {
            eligiblePaths = eligiblePaths.filter(path =>
                carbonEdges.every(edge =>
                    containsBond(path, edge.a, edge.b)
                )
            );
        }

        if (!eligiblePaths.length) {
            return unsupported(
                "Não existe uma única cadeia principal que contenha a função orgânica e todas as insaturações. Insaturações em ramificações diferentes não são suportadas."
            );
        }

        // Finalmente, seleciona a maior cadeia.
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


        if (
            new Set(chainUnsaturations.map(b => b.order)).size > 1
        ) {
            return unsupported(
                "Ligações duplas e triplas misturadas ainda não são suportadas."
            );
        }

        if (chainUnsaturations.length > 4) {
            return unsupported(
                "Mais de quatro insaturações ainda não são suportadas."
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

        const functionLocant = functionalSite
            ? chosen.index.get(functionalSite)
            : null;

        const unsaturationCount = chainUnsaturations.length;

        const unsaturationOrder =
            chainUnsaturations[0]?.order ?? null;

        const unsaturationLocants = chosen.unsaturationLocants;

        let core;

        if (unsaturationCount === 0) {
            core = `${root}an`;
        } else if (unsaturationCount === 1) {
            core = `${root}-${unsaturationLocants[0]}-${unsaturationOrder === 2 ? "en" : "in"
                }`;
        } else {
            const multiplier = MULTIPLIERS[unsaturationCount];

            if (!multiplier) {
                return unsupported(
                    "A quantidade de insaturações ainda não é suportada."
                );
            }

            core = `${root}a-${unsaturationLocants.join(",")}-${multiplier
                }${unsaturationOrder === 2 ? "en" : "in"}`;
        }

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
            if (chosen.path.length === 1) {
                parentName = "metanol";
            } else if (
                chosen.path.length === 2 &&
                functionLocant === 1
            ) {
                parentName = "etanol";
            } else {
                parentName = `${core}-${functionLocant}-ol`;
            }

        } else if (unsaturationCount > 0) {
            // Eteno e etino não precisam de localizador.
            parentName =
                chosen.path.length === 2 && unsaturationCount === 1
                    ? `${root}${unsaturationOrder === 2 ? "eno" : "ino"}`
                    : `${core}o`;

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
            group: resultGroup,
            reason: null
        };
    }
}