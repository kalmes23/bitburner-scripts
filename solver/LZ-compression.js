export const name = 'LZ Compression III';
export const slug = 'LZcompression';

function LZcompression(data) {
    let cur_state = Array.from(Array(10), () => Array(10).fill(null));
    let new_state = Array.from(Array(10), () => Array(10));
    function set(state, i, j, str) {
        const current = state[i][j];
        if (current == null || str.length < current.length) {
            state[i][j] = str;
        }
        else if (str.length === current.length && Math.random() < 0.5) {
            state[i][j] = str;
        }
    }

    cur_state[0][1] = "";
    for (let i = 1; i < data.length; ++i) {
        for (const row of new_state) {
            row.fill(null);
        }
        const c = data[i];
        for (let length = 1; length <= 9; ++length) {
            const string = cur_state[0][length];
            if (string == null) {
                continue;
            }
            if (length < 9) {
                set(new_state, 0, length + 1, string);
            }
            else {
                set(new_state, 0, 1, string + "9" + data.substring(i - 9, i) + "0");
            }
            for (let offset = 1; offset <= Math.min(9, i); ++offset) {
                if (data[i - offset] === c) {
                    set(new_state, offset, 1, string + length + data.substring(i - length, i));
                }
            }
        }

        for (let offset = 1; offset <= 9; ++offset) {
            for (let length = 1; length <= 9; ++length) {
                const string = cur_state[offset][length];
                if (string == null) {
                    continue;
                }
                if (data[i - offset] === c) {
                    if (length < 9) {
                        set(new_state, offset, length + 1, string);
                    }
                    else {
                        set(new_state, offset, 1, string + "9" + offset + "0");
                    }
                }

                set(new_state, 0, 1, string + length + offset);
                for (let new_offset = 1; new_offset <= Math.min(9, i); ++new_offset) {
                    if (data[i - new_offset] === c) {
                        set(new_state, new_offset, 1, string + length + offset + "0");
                    }
                }
            }
        }
        const tmp_state = new_state;
        new_state = cur_state;
        cur_state = tmp_state;
    }
    let result = null;
    for (let len = 1; len <= 9; ++len) {
        let string = cur_state[0][len];
        if (string == null) {
            continue;
        }
        string += len + data.substring(data.length - len, data.length);
        if (result == null || string.length < result.length) {
            result = string;
        }
        else if (string.length === result.length && Math.random() < 0.5) {
            result = string;
        }
    }
    for (let offset = 1; offset <= 9; ++offset) {
        for (let len = 1; len <= 9; ++len) {
            let string = cur_state[offset][len];
            if (string == null) {
                continue;
            }
            string += len + "" + offset;
            if (result == null || string.length < result.length) {
                result = string;
            }
            else if (string.length === result.length && Math.random() < 0.5) {
                result = string;
            }
        }
    }
    return result !== null && result !== void 0 ? result : "";
}

export function solve(data) {
  return LZcompression(data);
}

/** @param {NS} ns */
export async function main(ns) {
	if (ns.args.length < 1) {
		ns.tprint("solver/LZcompression.js [data]");
		ns.exit(0);
	}
	var res = solve(ns.args[0]);	
	ns.tprint("result: "+res);
}