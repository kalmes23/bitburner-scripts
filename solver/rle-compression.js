export const name = 'RLE Compression I';
export const slug = 'rle-compression';

function RLECompression(data) {
    let response = "";
    if (data === "") {
        return response;
    }

    let currentRun = "";
    let runLength = 0;

    function addEncodedRun(char, length) {
        while (length > 0) {
            if (length >= 9) {
                response += `9${char}`;
            } else {
                response += `${length}${char}`
            }
            length -= 9;
        }
    }

    for (let c of data) {
        if (currentRun === "") {
            currentRun = c;
            runLength = 1;
        } else if (currentRun === c) {
            runLength++;
        } else if (currentRun !== c) {
            addEncodedRun(currentRun, runLength);
            currentRun = c;
            runLength = 1;
        }
    }
    addEncodedRun(currentRun, runLength);
    return response;
}

export function solve(data) {
  return RLECompression(data);
}

/** @param {NS} ns */
export async function main(ns) {
	if (ns.args.length < 1) {
		ns.tprint("solver/rle-compression.js [data]");
		ns.exit(0);
	}
	var res = solve(ns.args[0]);	
	ns.tprint("result: "+res);
}