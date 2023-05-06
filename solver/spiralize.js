function spiralize(data) {
	//data = data.split('\n').map(l => JSON.parse(l));
	data = JSON.parse(data);
	const spiral = [];
	const m = data.length;
	const n = data[0].length;
	let u = 0;
	let d = m - 1;
	let l = 0;
	let r = n - 1;
	let k = 0;
	while (true) {
		// Up
		for (let col = l; col <= r; col++) {
			spiral[k] = data[u][col];
			++k;
		}
		if (++u > d) {
			break;
		}

		// Right
		for (let row = u; row <= d; row++) {
			spiral[k] = data[row][r];
			++k;
		}
		if (--r < l) {
			break;
		}

		// Down
		for (let col = r; col >= l; col--) {
			spiral[k] = data[d][col];
			++k;
		}
		if (--d < u) {
			break;
		}

		// Left
		for (let row = d; row >= u; row--) {
			spiral[k] = data[row][l];
			++k;
		}
		if (++l > r) {
			break;
		}
	}
	return '[' + spiral + ']';
}


/** @param {NS} ns */
export async function main(ns) {

	//ns.tprint("Result: "+spiralize("[[1,2],\n[3,4]]"));
	//ns.tprint("Result: "+spiralize(JSON.parse(ns.args[0])));
	ns.tprint("Result: "+spiralize(

"[[47,14,21,30,43,40,13,40,21,50,33, 4, 1,13],"+
"[25,41,35,15,28,36,26,22,33,29,17,11,13,47],"+
"[18,34, 2,38,10,28,16,28,16,29,15,37,20,21],"+
"[37,22,41,15,33,19,31,30,28,11,17,46,30, 6],"+
"[24,18,35,12,43, 9,10,35,15,48,36,45,49,12],"+
"[46,42,38,45,42,17,14, 4,13,10,12,17,46, 6],"+
"[ 6,40,48,20, 6, 3,30,26,16,15,14,10, 8,36],"+
"[12,27,29,12,11, 4,45,50, 8,21,18,45,28,33],"+
"[ 1,14,26, 6,21,35,50,15,23,31, 6, 3,21, 2],"+
"[14,27,28,33,27, 8,39, 9,11,46,13, 6, 6,15],"+
"[12,34,49,27,11, 2,35,42, 6,19,19,27, 3,30]]"

	));
}