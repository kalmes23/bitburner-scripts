let asObject = (name, depth = 0) => ({
    name: name,
    depth: depth
});

/** @param {NS} ns */
export async function main(ns) {
	ns.disableLog("ALL");
	
    let home = 'home';
	let servers = [asObject(home)];
	let visited = {};
	let contracts = [];

	let server;
	while ((server = servers.pop())) {
		let name = server.name;
		let depth = server.depth;
		visited[name] = true;

		let scanResult = ns.scan(name);
		for (let i in scanResult){
			if (!visited[scanResult[i]])
				servers.push(asObject(scanResult[i], depth + 1));
		}

		var serverContracts = ns.ls(name, ".cct");
		for (let i = 0; i < serverContracts.length; i++){
			contracts.push([serverContracts[i], name]);
		}
	}

	for (let i in contracts) {
		var contract = contracts[i];
		ns.tprint(`${contract[1]}\t ${contract[0]}`)
	}
}