function subarrayMaxSum(a) {
    if (a.length == 0) {
        return 0;
    }
    var l = a.length;
    var maxSum = a[0]; // start with the first value in the array as the max sum
    for (let i = 0; i < l; i++) {
        var c = a[i];
        if (c > maxSum) {
            maxSum = c;
        }
        for (let j = i + 1; j < l; j++) {
            c += a[j];
            if (c > maxSum) {
                maxSum = c;
            }
        }
    }
    return maxSum;
}

/** @param {NS} ns */
export async function main(ns) {
    if (ns.args.length < 1) {
        ns.tprint("./solver/subarray-max.js [integers]");
        ns.tprint("Make sure the integers are in an array!")
    }
	//ns.tprint("Result: "+spiralize("[[1,2],\n[3,4]]"));
	var data = JSON.parse(ns.args[0]);
	ns.tprint("Result: "+JSON.stringify(subarrayMaxSum(data)));
}