export const name = 'Total Ways to Sum';
export const slug = 'waysToSum';

function findAllValid(num, target) {
    function helper(
      res,
      path,
      num,
      target,
      pos,
      evaluated,
      multed,
    ) {
      if (pos === num.length) {
        if (target === evaluated) {
          res.push(path);
        }
        return;
      }

      for (let i = pos; i < num.length; ++i) {
        if (i != pos && num[pos] == "0") {
          break;
        }
        const cur = parseInt(num.substring(pos, i + 1));

        if (pos === 0) {
          helper(res, path + cur, num, target, i + 1, cur, cur);
        } else {
          helper(res, path + "+" + cur, num, target, i + 1, evaluated + cur, cur);
          helper(res, path + "-" + cur, num, target, i + 1, evaluated - cur, -cur);
          helper(res, path + "*" + cur, num, target, i + 1, evaluated - multed + multed * cur, multed * cur);
        }
      }
    }
    num = num.toString();
    if (num == null || num.length === 0) {
      return 0;
    }

    const result = [];
    helper(result, "", num, target, 0, 0, 0);
    return '[' + result + ']';
}

export function solve(num, target) {
  return findAllValid(num, target);
}

/** @param {NS} ns */
export async function main(ns) {
	if (ns.args.length < 2) {
		ns.tprint("solver/final-all-valid.js [num] [target]");
		ns.exit(0);
	}
	var res = solve(ns.args[0], ns.args[1]);	
	ns.tprint("result: "+res);
}