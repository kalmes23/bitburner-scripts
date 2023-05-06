export const name = 'Hamming Code';
export const slug = 'hamming-code';

function HammingEncode(value) {
    function HammingSumOfParity(lengthOfDBits) {
        return lengthOfDBits < 3 || lengthOfDBits == 0
            ? lengthOfDBits == 0
                ? 0
                : lengthOfDBits + 1
            :
            Math.ceil(Math.log2(lengthOfDBits * 2)) <=
                Math.ceil(Math.log2(1 + lengthOfDBits + Math.ceil(Math.log2(lengthOfDBits))))
                ? Math.ceil(Math.log2(lengthOfDBits) + 1)
                : Math.ceil(Math.log2(lengthOfDBits));
    }
    const data = parseInt(value).toString(2).split("");
    const sumParity = HammingSumOfParity(data.length);
    const count = (arr, val) => arr.reduce((a, v) => (v === val ? a + 1 : a), 0);
    const build = ["x", "x", ...data.splice(0, 1)];
    for (let i = 2; i < sumParity; i++) {
        build.push("x", ...data.splice(0, Math.pow(2, i) - 1));
    }
    for (const index of build.reduce(function (a, e, i) {
        if (e == "x")
            a.push(i);
        return a;
    }, [])) {

        const tempcount = index + 1;
        const temparray = [];
        const tempdata = [...build];
        while (tempdata[index] !== undefined) {
            const temp = tempdata.splice(index, tempcount * 2);
            temparray.push(...temp.splice(0, tempcount));
        }
        temparray.splice(0, 1);
        build[index] = (count(temparray, "1") % 2).toString();
    }
    build.unshift((count(build, "1") % 2).toString());
    return build.join("");
}

export function solve(data) {
  return HammingEncode(data);
}

/** @param {NS} ns */
export async function main(ns) {
	if (ns.args.length < 1) {
		ns.tprint("solver/hamming-code.js [data]");
		ns.exit(0);
	}
	var res = solve(ns.args[0]);	
	ns.tprint("result: "+res);
}