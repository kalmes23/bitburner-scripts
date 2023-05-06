import {
	getNumCracks
} from "./utils.js";

/** @param {NS} ns **/
export async function main(ns) {
	function formatnum(num) {
		const options = {
			minimumFractionDigits: 0,
			maximumFractionDigits: 2
		};
		const formatted = Number(num).toLocaleString('en', options);
		return formatted;
	}

	class serverObj {
		constructor(name,parent) {
			this.name=name;
			this.parent=parent;
		}
	}

	var cracks = {
		"BruteSSH.exe": ns.brutessh,
		"FTPCrack.exe": ns.ftpcrack,
		"relaySMTP.exe": ns.relaysmtp,
		"HTTPWorm.exe": ns.httpworm,
		"SQLInject.exe": ns.sqlinject
	};
	var numCracks = getNumCracks(ns, cracks);

	var serverlist = {};
	var onemillion = 1000000;

	function showmap(server = 'home', lastserver = 'home', levels = 0,
					hidebig = false, target = null, needbackdoor = false) {
		
		//for finding targets
		var result = '';
		var obj = new serverObj(server,lastserver);
		serverlist[server] = obj;

		var level = ns.getHackingLevel();
		var svrarr = ns.scan(server);
		var hyphens = '';
		if (!needbackdoor) {
			for (var i = 0; i < levels; i++) {
				hyphens += '----';
			}
		}
		for (var j = 0; j < svrarr.length; j++) {
			if (svrarr[j] != lastserver) {

				var host = svrarr[j];
				// get required skill, backdoor
				var remote = ns.getServer(host);
				var skl = ns.getServerRequiredHackingLevel(host);
				var backdoor = remote.backdoorInstalled ? "YES" : "NO";

				if (true) {
					//get data
					var secmin = ns.getServerMinSecurityLevel(host);
					var sec = ns.getServerSecurityLevel(host);
					var cashmax = ns.getServerMaxMoney(host) / onemillion;
					var cash = ns.getServerMoneyAvailable(host) / onemillion;
					var ram = ns.getServerMaxRam(host).toFixed(2);
					var ports = ns.getServerNumPortsRequired(host);
					var root = ns.hasRootAccess(host) ? "YES" : "NO";

					if (target==null &&
						!remote.purchasedByPlayer &&
						(!hidebig || (skl <= level && ports <= numCracks)) &&
						(!needbackdoor || (!remote.backdoorInstalled))
						) {
						//show server
						result += "\n";
						result += hyphens + "> " + host + "\n";

						//show data
						result += hyphens + "--" + "Root Access: " + root + ", Backdoor: " + backdoor + "\n";
						result += hyphens + "--" + "Hacking level required: " + skl + ", Ports required: " + ports + "\n";
						result += hyphens + "--" + "RAM: " + ram + "GB" + "\n";
						result += hyphens + "--" + "Security: " + sec + "/" + secmin + ", Money: $" + formatnum(cash) + "M/$" + formatnum(cashmax) + "M" + "\n";
						result += hyphens + "--" + "Parent: " + server + "\n";
					}



					if(target!=null) {
						if(target.toUpperCase()==host.toUpperCase()) {
							ns.tprint("Path to "+host+" found:");
							
							var patharr = [];
							var svr = obj;
							while(svr.name!='home') {
								var label = svr.name;
								var remote = ns.getServer(svr.name);
								if (remote.backdoorInstalled)
									label = '*'+label;
								patharr = [label].concat(patharr);
								svr=serverlist[svr.parent];
							}

							//patharr = ['home'].concat(patharr);
							patharr.push(target);

							var path = "home";
							for(var i=0;i<patharr.length;i++) {
								path+=" --> "+patharr[i];
							}
							ns.tprint(path);

							// todo - is there a way to get unprocessed links out?
							//var path2 = "home";
							//for(var i=0;i<patharr.length;i++) {
							//	path2+=" --> <a class='MuiLink-root MuiLink-underlineAlways'><p>"+patharr[i] + "</p></a>";
							//}
							//ns.tprint("Links: "+path2);

							ns.exit();
						}
					}

					//show sublinks
					result += showmap(svrarr[j], server, levels + 1, hidebig, target, needbackdoor);


				}


			}
		}
		return result;
	}
	var target=null;
	var hidebig = false;
	var needbackdoor = false;
	if (ns.args.length > 0) {
		if (ns.args[0] == "hide") {
			hidebig = true;
		} else if (ns.args[0] == "hidebackdoor" || ns.args[0] == "backdoor") {
			needbackdoor = true;
			hidebig = true;
		} else if ((ns.args[0]=="seek")||(ns.args[0]=="find")&&(ns.args.length==2)){
			target=ns.args[1];
		} else {
			ns.tprint("Syntax error, use 'run netmap.js [hide|seek] [target]'");
			ns.exit();
		}
	}
	ns.tprintf(showmap('home', 'home', 0, hidebig, target, needbackdoor));

	if(target!=null) {
		ns.tprint("Server "+target+" not found! Please check your spelling.")
	}
}