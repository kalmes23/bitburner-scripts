export const name = 'Hamming Decode';
export const slug = 'hamming-decode';

function HammingDecode(data) {
    const build = data.split("");
    const testArray = [];
    const sumParity = Math.ceil(Math.log2(data.length));
    const count = (arr, val) => arr.reduce((a, v) => (v === val ? a + 1 : a), 0);
    let overallParity = build.splice(0, 1).join("");
    testArray.push(overallParity == (count(build, "1") % 2).toString() ? true : false);
    for (let i = 0; i < sumParity; i++) {
        const tempIndex = Math.pow(2, i) - 1;
        const tempStep = tempIndex + 1;
        const tempData = [...build];
        const tempArray = [];
        while (tempData[tempIndex] != undefined) {
            const temp = [...tempData.splice(tempIndex, tempStep * 2)];
            tempArray.push(...temp.splice(0, tempStep));
        }
        const tempParity = tempArray.shift();
        testArray.push(tempParity == (count(tempArray, "1") % 2).toString() ? true : false);
    }
    let fixIndex = 0;
    for (let i = 1; i < sumParity + 1; i++) {
        fixIndex += testArray[i] ? 0 : Math.pow(2, i) / 2;
    }
    build.unshift(overallParity);
    if (fixIndex > 0 && testArray[0] == false) {
        build[fixIndex] = build[fixIndex] == "0" ? "1" : "0";
    }
    else if (testArray[0] == false) {
        overallParity = overallParity == "0" ? "1" : "0";
    }
    else if (testArray[0] == true && testArray.some((truth) => truth == false)) {
        return 0;
    }
    for (let i = sumParity; i >= 0; i--) {
        build.splice(Math.pow(2, i), 1);
    }
    build.splice(0, 1);
    return parseInt(build.join(""), 2);
}

export function solve(data) {
  return HammingDecode(data);
}

/** @param {NS} ns */
export async function main(ns) {
	if (ns.args.length < 1) {
		ns.tprint("solver/hamming-decode.js 'binary'");
		ns.exit(0);
	}
	var res = solve(ns.args[0].toString());	
	ns.tprint("result: "+res);
}