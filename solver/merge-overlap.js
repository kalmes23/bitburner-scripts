function mergeOverlap(intervals) {
    intervals.sort(([minA], [minB]) => minA - minB);
    for (let i = 0; i < intervals.length; i++) {
        for (let j = i + 1; j < intervals.length; j++) {
            const [min, max] = intervals[i];
            const [laterMin, laterMax] = intervals[j];
            if (laterMin <= max) {
                const newMax = laterMax > max ? laterMax : max;
                const newInterval = [min, newMax];
                intervals[i] = newInterval;
                intervals.splice(j, 1);
                j = i;
            }
        }
    }
    return intervals;
}


/** @param {NS} ns */
export async function main(ns) {
	//ns.tprint("Result: "+spiralize("[[1,2],\n[3,4]]"));
	var data = JSON.parse(ns.args[0]);
	ns.tprint("Result: "+JSON.stringify(mergeOverlap(data)));
}