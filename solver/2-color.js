function proper2ColoringOfAGraph(data){
    let n = data[0];    // number of vertices
    let a = data[1];    // adjacency data

    // create an adjacency matrix for the BFS
    let adjacencyMatrix = [];
    for (let i = 0; i < n; i++) {
        adjacencyMatrix.push(new Array(n).fill(0));
    }
    for (let edge of a) {
        let v1 = edge[0];
        let v2 = edge[1];
        adjacencyMatrix[v1][v2] = 1;
        adjacencyMatrix[v2][v1] = 1;
    }

    // create response array, set v1 to color 0
    let colors = new Array(n).fill(-1);
    colors[0] = 0;

    // BFS through the graph and assign colors
    let queue = [];
    queue.push(0);

    while (queue.length > 0) {
        let next = queue.shift();
        let color1 = colors[next];
        let color2 = color1 ^ 1;
        let adjacency = adjacencyMatrix[next];
        for (let v = 0; v < n; v++) {
            if (adjacency[v] !== 1) continue;
            if (colors[v] === -1) {
                colors[v] = color2;
                queue.push(v);
            } else if (colors[v] === color1) {
                return "[]"; // invalid graph, why string?
            }
        }
    }
    return colors;
}


/** @param {NS} ns */
export async function main(ns) {
	//ns.tprint("Result: "+spiralize("[[1,2],\n[3,4]]"));
	var data = JSON.parse(ns.args[0]);
	ns.tprint("Result: "+JSON.stringify(proper2ColoringOfAGraph(data)));
}