function factorial(n) {
    return factorialDivision(n, 1);
}

function factorialDivision(n, d) {
    if (n == 0 || n == 1 || n == d)
        return 1;
    return factorialDivision(n - 1, d) * n;
}

function uniquePathsI(data) {
    data = JSON.parse(data);
	const rightMoves = data[0] - 1;
    const downMoves = data[1] - 1;

    return Math.round(factorialDivision(rightMoves + downMoves, rightMoves) / (factorial(downMoves)));
}


/** @param {NS} ns */
export async function main(ns) {
    if (ns.args.length < 1) {
        ns.tprint("solver/unique-paths.js '[rows, cols]'");
        ns.exit(0);
    }
    var res = uniquePathsI(ns.args[0]);
    ns.tprint("result: "+res);
}