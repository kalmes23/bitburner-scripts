function solveTriangleSum(arrayData, ns) {
    let triangle = arrayData;
    let nextArray;
    let previousArray = triangle[0];

    for (let i = 1; i < triangle.length; i++) {
        nextArray = [];
        for (let j = 0; j < triangle[i].length; j++) {
            if (j == 0) {
                nextArray.push(previousArray[j] + triangle[i][j]);
            } else if (j == triangle[i].length - 1) {
                nextArray.push(previousArray[j - 1] + triangle[i][j]);
            } else {
                nextArray.push(Math.min(previousArray[j], previousArray[j - 1]) + triangle[i][j]);
            }

        }

        previousArray = nextArray;
    }

    return Math.min.apply(null, nextArray);
}


/** @param {NS} ns */
export async function main(ns) {
	//ns.tprint("Result: "+spiralize("[[1,2],\n[3,4]]"));
    // var data = JSON.parse(
	// "["+
    // "       [9],"+
    // "      [1,6],"+
    // "     [4,6,7],"+
    // "    [5,4,6,6],"+
    // "   [9,6,9,4,9],"+
    // "  [1,3,7,5,6,2],"+
    // " [8,2,8,2,4,2,5],"+
    // "[9,3,3,6,7,2,4,3],"+
    // "[8,7,4,9,4,9,9,1,6],"+
    // "[3,4,9,5,2,6,7,4,6,4]"+
	// "]"
    // );
    var data = JSON.parse(ns.args[0]);
	ns.tprint("Result: "+solveTriangleSum(data, ns));
}