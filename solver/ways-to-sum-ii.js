export const name = 'Total Ways to Sum II';
export const slug = 'ways-to-sum-ii';

function totalWaysToSumII(n, s){
    const ways = [1];
    ways.length = n + 1;
    ways.fill(0, 1);
    for (let i = 0; i < s.length; i++) {
      for (let j = s[i]; j <= n; j++) {
        ways[j] += ways[j - s[i]];
      }
    }
    return ways[n];
}
/** @param {NS} ns */
export async function main(ns) {
	if (ns.args.length < 2) {
		ns.tprint("solver/ways-to-sum-ii.js [target] [array]");
		ns.exit(0);
	}
	var res = totalWaysToSumII(ns.args[0], JSON.parse(ns.args[1]));	
	ns.tprint("result: "+res);
}