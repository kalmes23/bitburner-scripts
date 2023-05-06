export const name = 'LZ Decompress II';
export const slug = 'LZ-decompress';

function LZdecompress(data) {
    let plain = "";
    for (let i = 0; i < data.length;) {
        const literal_length = data.charCodeAt(i) - 0x30;
        if (literal_length < 0 || literal_length > 9 || i + 1 + literal_length > data.length) {
            return null;
        }
        plain += data.substring(i + 1, i + 1 + literal_length);
        i += 1 + literal_length;
        if (i >= data.length) {
            break;
        }
        const backref_length = data.charCodeAt(i) - 0x30;
        if (backref_length < 0 || backref_length > 9) {
            return null;
        }
        else if (backref_length === 0) {
            ++i;
        }
        else {
            if (i + 1 >= data.length) {
                return null;
            }
            const backref_offset = data.charCodeAt(i + 1) - 0x30;
            if ((backref_length > 0 && (backref_offset < 1 || backref_offset > 9)) || backref_offset > plain.length) {
                return null;
            }
            for (let j = 0; j < backref_length; ++j) {
                plain += plain[plain.length - backref_offset];
            }
            i += 2;
        }
    }
    return plain;
}

export function solve(data) {
  return LZdecompress(data);
}

/** @param {NS} ns */
export async function main(ns) {
	if (ns.args.length < 1) {
		ns.tprint("solver/LZ-decompress.js [data]");
		ns.exit(0);
	}
	var res = solve(ns.args[0]);	
	ns.tprint("result: "+res);
}