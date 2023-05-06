export const name = 'Sanitize Parenthesis';
export const slug = 'sanitize-parens';

function isParenthesis(c) {
    return ((c == '(') || (c == ')'));
}

function isValidString(str) {
    let cnt = 0;
    for (let i = 0; i < str.length; i++) {
        if (str[i] == '(')
            cnt++;
        else if (str[i] == ')')
            cnt--;
        if (cnt < 0)
            return false;
    }
    return (cnt == 0);
}

function sanitizeParentheses(str) {
    var res = [];
    if (str.length == 0)
        return res;

    let visit = new Set();

    let q = [];
    let temp;
    let level = false;

    q.push(str);
    visit.add(str);
    while (q.length != 0) {
        str = q.shift();
        if (isValidString(str)) {
            res.push(str)
            level = true;
        }
        if (level)
            continue;
        for (let i = 0; i < str.length; i++) {
            if (!isParenthesis(str[i]))
                continue;

            temp = str.substring(0, i) + str.substring(i + 1);
            if (!visit.has(temp)) {
                q.push(temp);
                visit.add(temp);
            }
        }
    }
    return res;
}

export function solve(data) {
  return sanitizeParentheses(data);
}

/** @param {NS} ns */
export async function main(ns) {
	if (ns.args.length < 1) {
		ns.tprint("solver/sanitize-parens.js [data]");
		ns.exit(0);
	}
	var res = solve(ns.args[0]);	
	ns.tprint("result: "+res.toString());
}