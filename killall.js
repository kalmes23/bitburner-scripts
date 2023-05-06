import { killScript, log } from './helpers.js'

// the purpose of killall is to kill scripts without regard to parameters
/** @param {NS} ns **/
export async function main(ns) {
    let args = ns.args;
    if (args.length == 0 || args.length > 2)
        return ns.tprint("Syntax:\n killall.js scriptname.js [hostname]");

    if (args.length == 1) {
        await killScript(ns, args[0]);
    } else if (args.length == 2) {
        await killScript(ns, args[0], args[1]);
    }
}