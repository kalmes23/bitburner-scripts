// The corporation functions take an entire 1TB to run. Strategy is not to start this
// script until we have enough CPU to run it, and then to leave it running all the time.

import {
    log, getConfiguration, instanceCount, getNsDataThroughFile, getActiveSourceFiles, runCommand, tryGetBitNodeMultipliers,
    formatMoney, formatNumberShort, formatDuration
} from './helpers.js'

const updateInterval = 1000; // will have to decide how to adjust this to the corp tick
const cities = ["Aevum", "Chongqing", "Ishima", "New Tokyo", "Sector-12", "Volhaven"];

let options;
const argsSchema = [
    ['corp-name', "BESTCORP"], // default corporation name
	['Ag-reserve', 2e9], // how much of corp money to reserve from Ag upgrades
	['Tob-reserve', 10e9], // how much of corp money to reserve from Tob upgrades
	['Heal-reserve', 10e9], // allow Tob and Heal to compete for money
	['Food-reserve', 10e9], // same
	['Extra-reserve', 50e9], // excess upgrades
	['warehouse-limit', 0.70], // how much of the warehouse we are willing to fill
		// this should be pretty conservative to allow enough product
	['additional-industries', false], // can go ahead and start Healthcare and Food if you want max cash
		// but generally a waste of time for a normal run, since Tobacco provides plenty of money
];

let gStrategyPhase = 1;
const gStrategyNames = ["unknown", "Basic Ag (1)", "Expand Ag (2)", "Begin Tob (3)", "Expand Tob (4)", "Profit! (5)"];

// trying a faster incremental strategy to see if it improves things
// - generally better to be aggressive about upgrades, even if you 
//   don't maximize money from offers
//const gStrategyAcceptOffer = [0, 250e9, 6e12, 1.2e15, 1.2e18, 0];
const gStrategyAcceptOffer = [0, 200e9, 5e12, 1e15, 1e18, 0];


async function initialize(ns) {
	let loggedWaiting = false;
	const costCorporation = 150E9;
	while (!ns.corporation.hasCorporation()) {
		try {
			let player = await getNsDataThroughFile(ns, `ns.getPlayer()`, '/Temp/player-info.txt');
			if (player.bitNodeN == 3) {
				ns.corporation.createCorporation(options["corp-name"], false);
			}
			if (!ns.corporation.hasCorporation()) {
				const reserve = Number(ns.read("reserve.txt") || 0);
				if (costCorporation < player.money - reserve) {
					ns.corporation.createCorporation(options["corp-name"], true);
				}
			}
		}
        catch (err) {
            log(ns, `WARNING: corporation.js Caught (and suppressed) an unexpected error while waiting to create a corp:\n` +
                (typeof err === 'string' ? err : err.message || JSON.stringify(err)), false, 'warning');
        }
		if (!loggedWaiting) {
			log(ns, `Waiting to create a corporation. Will create one as soon as we have the cash...`);
			loggedWaiting = true;
		}
        await ns.sleep(1000);
	}

	// we assume smart supply so need to purchase first
	if (!ns.corporation.hasUnlockUpgrade("Smart Supply")) {
		log(ns, "Unlocking Smart Supply");
		ns.corporation.unlockUpgrade("Smart Supply");
	}

	// determine phase
	checkPhase(ns);
}


/** @param {NS} ns */
export async function main(ns) {
    const runOptions = getConfiguration(ns, argsSchema);
    if (!runOptions || await instanceCount(ns) > 1) return; // Prevent multiple instances of this script from being started, even with different args.
    options = runOptions; // We don't set the global "options" until we're sure this is the only running instance

    await initialize(ns);
    log(ns, "Starting main loop...");
    while (true) {
        try { await mainLoop(ns); }
        catch (err) {
            log(ns, `WARNING: corporation.js Caught (and suppressed) an unexpected error in the main loop:\n` +
                (typeof err === 'string' ? err : err.message || JSON.stringify(err)), false, 'warning');
        }
        await ns.sleep(updateInterval);
    }
}

function canAfford(ns, divName, cost) {
	var corpInfo = ns.corporation.getCorporation();
	return corpInfo.funds > options[divName+"-reserve"] + cost;
}

function isProductDivision(ns, divName) {
	return ns.corporation.getDivision(divName).makesProducts;
}

function tryCreateDivision(ns, divisionName, industryName) {
	let divisions = ns.corporation.getCorporation().divisions;
	if (!divisions.includes(divisionName)) {
		if (canAfford(ns, divisionName, ns.corporation.getIndustryData(industryName).startingCost)) {
				log(ns, "Attempting to expand to " + industryName);
				ns.corporation.expandIndustry(industryName, divisionName);
				divisions = ns.corporation.getCorporation().divisions;
				if (divisions.includes(divisionName)) {
					log(ns, "Success. Added division: " + divisionName);
				} else {
					log(ns, "Failure! Failed to add " + industryName);
				}
			}
	}
}

function createDivisions(ns) {
	// just create Ag for now
	tryCreateDivision(ns, "Ag", "Agriculture");
	if (gStrategyPhase >= 3)
		tryCreateDivision(ns, "Tob", "Tobacco");

	// all of our useful profits are dominated by Tobacco,
	//   not really necessary to spin up these
	if (options['additional-industries']) {
		if (gStrategyPhase >= 4)
			tryCreateDivision(ns, "Heal", "Healthcare");
		if (gStrategyPhase >= 5)
			tryCreateDivision(ns, "Food", "Food");
	}
}

function hasOffice(ns, divName, cityName) {
	try {
		let office = ns.corporation.getOffice(divName, cityName);
		return office.size > 0;
	}
	catch (err) {
		return false;
	}
}

function tryExpandCity(ns, divName, cityName) {
	if (!hasOffice(ns, divName, cityName)) {
		// only expand if we have funds
		const officeCost = 4e9;
		if (canAfford(ns, divName, officeCost)) {
			log(ns, "Adding office: " + divName + " " + cityName);
			ns.corporation.expandCity(divName, cityName);
		}
	}
	if (!ns.corporation.hasWarehouse(divName, cityName)) {
		// only expand if we have funds
		const warehouseCost = 5e9;
		if (canAfford(ns, divName, warehouseCost)) {
			log(ns, "Adding warehouse: " + divName + " " + cityName);
			ns.corporation.purchaseWarehouse(divName, cityName);
		}
	}
	ns.corporation.setSmartSupply(divName, cityName, true);
}

function expandOffices(ns) {
	// for each of our divisions
	var corpInfo = ns.corporation.getCorporation();
	for (const division of corpInfo.divisions) {
		// expand to every possible city
		for (const city of cities) {
			tryExpandCity(ns, division, city);
		}
	}
}

function upgradeWarehouse(ns, divName, cityName, targetSize) {
	// upgrade each warehouse to 300 to start
	var warehouseInfo = ns.corporation.getWarehouse(divName, cityName);
	if (warehouseInfo.size < targetSize) {
		if (canAfford(ns, divName, ns.corporation.getUpgradeWarehouseCost(divName, cityName, 1))) {
			log(ns, "Upgrading warehouse " + divName + " " + cityName);
			ns.corporation.upgradeWarehouse(divName, cityName, 1);
		}
	}
}

function upgradeWarehouses(ns) {
	// for each of our divisions
	var corpInfo = ns.corporation.getCorporation();
	for (const division of corpInfo.divisions) {
		// for each warehouse
		for (const city of cities) {
			if (gStrategyPhase == 1) {
				upgradeWarehouse(ns, division, city, 1000);
			} else if (gStrategyPhase == 2) {
				upgradeWarehouse(ns, division, city, 2400);
			} else if (gStrategyPhase == 3) {
				upgradeWarehouse(ns, division, city, 4000);
			} else if (gStrategyPhase >= 4) {
				upgradeWarehouse(ns, division, city, 15e3);
			}
		}
	}
}

function makePurchases(ns) {}

function expandOfficeSize(ns, divName, cityName, targetCount) {
	// expand office size first
	var office = ns.corporation.getOffice(divName, cityName);
	if (office.size < targetCount) {
		if (canAfford(ns, divName, ns.corporation.getOfficeSizeUpgradeCost(divName, cityName, targetCount-office.size))) {
			log(ns, "Upgrading office: " + divName + " " + cityName + " to " + targetCount);
			ns.corporation.upgradeOfficeSize(divName, cityName, targetCount - office.size);
		}
		// if we end up with too big a bite, see if we can do 15 instead
		// (this logic relies on 15 being *less expensive* than above)
		else if (canAfford(ns, divName, ns.corporation.getOfficeSizeUpgradeCost(divName, cityName, 15))) {
			log(ns, "Upgrading office incrementally: " + divName + " " + cityName + " to " + office.size+15);
			ns.corporation.upgradeOfficeSize(divName, cityName, 15);
		}
		else {
			return false;
		}
	}
	return true;
}

function fillOffice(ns, divName, cityName) {
	var office = ns.corporation.getOffice(divName, cityName);
	// maybe a hack that we only look at Ag req here, but don't want to give up
	// on filling out employees if Ag is spending money
	if (canAfford(ns, "Ag", 0) && office.employees < office.size) {
		var toHire = office.size - office.employees; // doesn't get updated on every hireEmployee call
		while (toHire > 0) {
			if (!ns.corporation.hireEmployee(divName, cityName)) {
				log(ns, "Error hiring employee for " + divName + " " + cityName);
				return false;
			}
			toHire--;
		}
	}
}

function autoAssignJobs(ns, divName, cityName, targetCount) {
	ns.corporation.setAutoJobAssignment(divName, cityName, "Operations", Math.floor((targetCount+4)/5));
	ns.corporation.setAutoJobAssignment(divName, cityName, "Engineer", Math.floor((targetCount+3)/5));
	ns.corporation.setAutoJobAssignment(divName, cityName, "Management", Math.floor((targetCount+2)/5));
	ns.corporation.setAutoJobAssignment(divName, cityName, "Research & Development", Math.floor((targetCount+1)/5));
	ns.corporation.setAutoJobAssignment(divName, cityName, "Business", Math.floor(targetCount/5));
}

function hireEmployees(ns) {
	// to start, get three employees in each office
	var corpInfo = ns.corporation.getCorporation();
	for (const division of corpInfo.divisions) {
		var aevumSize = ns.corporation.getOffice(division, "Aevum").size;

		// expand to every possible city
		for (const city of cities) {
			// set up the initial office size depending on stage
			var office = ns.corporation.getOffice(division, city);
			var target = 3;
			if (gStrategyPhase == 2) target = 9;
			if (gStrategyPhase == 3) target = 15;
			if (gStrategyPhase >= 4) target = 60;
			if (isProductDivision(ns, division)) {
				if (gStrategyPhase == 3 && city == "Aevum") target = 60;
				if (gStrategyPhase >= 4 && city == "Aevum") target = 120;
			}
			if (office.size > target) target = office.size;

			// after the initial setup, product offices need to expand forever
			if (isProductDivision(ns, division)) {
				if (aevumSize - 60 > target) target = aevumSize - 60;
				if (city == "Aevum" && target == aevumSize) target += 15;
			}

			// and do the expansion
			expandOfficeSize(ns, division, city, target);
			fillOffice(ns, division, city);
			autoAssignJobs(ns, division, city, office.employees);
		}
	}
}

function setMatSalePriceAuto(ns, divName, cityName, materialName) {
	var matInfo = ns.corporation.getMaterial(divName, cityName, materialName);

	// get the current sale price (if any)
	var mult = 1.0;
	if (matInfo.sCost) {
		var substr = matInfo.sCost.match(/[.\d]+/);
		if (substr) {
			// if we can get a price, do our adjustment
			mult = parseFloat(substr);
			if (matInfo.qty == 0)
			{
				mult = Math.min(1.2, mult+0.05);
				ns.corporation.sellMaterial(divName, cityName, materialName, "MAX", mult + "*MP");
				//log(ns, "Increasing material price: "+divName + " " + cityName + " " + materialName + ": " + mult + "*MP");
				return;
			}
			if (matInfo.qty >= 2e3) {
				var min = 0.8;
				if (matInfo.qty >= 4e3) min = 0.7;
				if (matInfo.qty >= 6e3) min = 0.6;
				mult = Math.max(min, mult-0.05);
				ns.corporation.sellMaterial(divName, cityName, materialName, "MAX", mult + "*MP");
				//log(ns, "Decreasing material price: "+divName + " " + cityName + " " + materialName + ": " + mult + "*MP");
				return;
			}
		}
	}
	// otherwise, just set to 1.0 to start
	ns.corporation.sellMaterial(divName, cityName, materialName, "MAX", "1.0*MP");
}

function setMatSalePrices(ns, divName, cityName) {
	// todo - go ahead and support more industries?
	if (divName == "Ag") {
		const materials = ["Plants", "Food"];
		for (var matName of materials)
			setMatSalePriceAuto(ns, divName, cityName, matName);
	}
}

function setAllMatSalePrices(ns) {
	// for each division
	var corpInfo = ns.corporation.getCorporation();
	for (const division of corpInfo.divisions) {
		// for each warehouse
		for (const city of cities) {
			setMatSalePrices(ns, division, city);
		}
	}
}

// changing this ti 'any' warehouses empty, would like to raise price if that happens
function prodWarehousesEmpty(ns, divName, productName) {
	var prodInfo = ns.corporation.getProduct(divName, productName);
	for (const record of Object.values(prodInfo.cityData)) {
		if (record[0] <= 1.0) // quantity
			return true;
	}
	return false;
}

function prodWarehousesFull(ns, divName, productName) {
	// assume the warehouses are the same size for now
	// HACK - for now, just see if the quantity of product is the same
	// as the warehouse size, obviously they pack into a fraction of this
	// space, but I don't know how to find the 'weight' of the product
	var warehouseInfo = ns.corporation.getWarehouse(divName, "Aevum");
	var allowedSize = warehouseInfo.size;
	var prodInfo = ns.corporation.getProduct(divName, productName);
	for (const record of Object.values(prodInfo.cityData)) {
		if (record[0] > allowedSize) // quantity (HACK, not size)
			return true;
	}
	return false;
}

// find the existing price for another product (best one)
function otherProdMult(ns, divName) {
	var otherMult = 0;
	var divInfo = ns.corporation.getDivision(divName);
	for (const productName of divInfo.products) {
		var prodInfo = ns.corporation.getProduct(divName, productName);
		if (prodInfo.developmentProgress < 100) continue;
		if (prodInfo.sCost) {
			var substr = prodInfo.sCost.match(/\d+/);
			if (substr) {
				var mult = parseInt(substr);
				otherMult = Math.max(otherMult, mult);
			}
		}
	}
	return otherMult;
}

function setProdSalePrices(ns, divName) {
	// for every product
	var divInfo = ns.corporation.getDivision(divName);
	for (const productName of divInfo.products) {
		var prodInfo = ns.corporation.getProduct(divName, productName);
		if (prodInfo.developmentProgress < 100) continue;

		// get the current sale price (if any)
		var prevMult = 0;
		var mult = 0;
		if (prodInfo.sCost) {
			var substr = prodInfo.sCost.match(/\d+/);
			if (substr)
				prevMult = parseInt(substr);
		}
		// adjust up and down according to warehouse usage
		if (prevMult == 0) { // no previous price
			// start with the best other price + 10%, or 4 at a minimum
			mult = Math.max(4, Math.floor(otherProdMult(ns, divName)*1.10));
		}
		else if (prodWarehousesEmpty(ns, divName, productName)) {
			if (prevMult > 100)
				mult = Math.floor(prevMult * 1.05);
			else
				mult = prevMult + 2;
		}
		else if (prevMult > 1 && prodWarehousesFull(ns, divName, productName)) {
			if (prevMult > 100)
				mult = Math.floor(prevMult * 0.99);
			else
				mult = prevMult - 1;
		}
		else
			mult = prevMult;

		if (mult != prevMult) {
			var sCost = mult + "*MP";
			log(ns, "Set prod sale price - " + productName + " to " + sCost);
			ns.corporation.sellProduct(divName, "Aevum", productName, "MAX", sCost, true);
		}
	} // for all products
}

function setProdSaleAuto(ns, divName) {
	var divInfo = ns.corporation.getDivision(divName);
	for (const productName of divInfo.products) {
		// still have to set a quantity this way
		ns.corporation.sellProduct(divName, "Aevum", productName, "MAX", "MP", true);
		ns.corporation.setProductMarketTA2(divName, productName, true);
	}
}

var lastProdSaleUpdate = 0;
const marketInterval = 10000; // don't adjust prices faster than this, it takes time to have an effect
function setAllProdSalePrices(ns) {
	const now = Date.now();
	if (now > lastProdSaleUpdate + marketInterval) {
		lastProdSaleUpdate = now;
		// for each division
		var corpInfo = ns.corporation.getCorporation();
		for (const division of corpInfo.divisions) {
			if (ns.corporation.hasResearched(division, "Market-TA.II"))
				setProdSaleAuto(ns, division);
			else
				// TODO - would be nice to decide per-city a pricing strategy, but
				// don't see how to read the current price on a warehouse basis..
				setProdSalePrices(ns, division);
		}
	}
}

function tryGetMaterialAmount(ns, divName, cityName, materialName, targetQuantity) {
	let material = ns.corporation.getMaterial(divName, cityName, materialName);
	var warehouseInfo = ns.corporation.getWarehouse(divName, cityName);
	let warehouseFull = (warehouseInfo.sizeUsed / warehouseInfo.size) > options['warehouse-limit'];

	let speedLimit = 1e6; // how much are we willing to buy per second?
	if (gStrategyPhase >= 2)
		speedLimit = 4e6;
	let haveMoney = canAfford(ns, divName, 0); // only buy when above reserve
	
	if (material.qty < targetQuantity && haveMoney && !warehouseFull) {
		// limit to about a million a second as long as we have funds
		let quantityLimit = (targetQuantity - material.qty) / 10.0; // buy X per sec, for 10 seconds
		let moneyLimit = speedLimit / material.cost;
		ns.corporation.buyMaterial(divName, cityName, materialName, Math.min(quantityLimit, moneyLimit));
		//log(ns, "Want to buy: " + divName + " " + cityName + " " + materialName + " qty:" 
		//  + Math.min(quantityLimit, moneyLimit) + " for:$" + Math.min(quantityLimit, moneyLimit)*material.cost);
	}
	else {
		ns.corporation.buyMaterial(divName, cityName, materialName, 0);
	}
}

function buyAgMetaMaterials(ns, divName, cityName) {
	// change to a strategy where our materials are bought as a ratio
	// of warehouse size, so we scale more naturally
	var warehouseInfo = ns.corporation.getWarehouse(divName, cityName);
	tryGetMaterialAmount(ns, divName, cityName, "Hardware", warehouseInfo.size * 2.0);
	tryGetMaterialAmount(ns, divName, cityName, "AI Cores", warehouseInfo.size * 1.5);
	tryGetMaterialAmount(ns, divName, cityName, "Robots", warehouseInfo.size * 0.15);
	tryGetMaterialAmount(ns, divName, cityName, "Real Estate", warehouseInfo.size * 75.0);
}

function buyProdDivMetaMaterials(ns, divName, cityName) {
	// depends mostly on research points, but still can use a few materials
	var warehouseInfo = ns.corporation.getWarehouse(divName, cityName);
	tryGetMaterialAmount(ns, divName, cityName, "Hardware", warehouseInfo.size * 2.5);
	tryGetMaterialAmount(ns, divName, cityName, "AI Cores", warehouseInfo.size * 2.5);
	tryGetMaterialAmount(ns, divName, cityName, "Robots", warehouseInfo.size * 0.5);
	tryGetMaterialAmount(ns, divName, cityName, "Real Estate", warehouseInfo.size * 2.5);
	// if (gStrategyPhase == 3) {
	// 	tryGetMaterialAmount(ns, divName, cityName, "Robots", 2000);
	// 	tryGetMaterialAmount(ns, divName, cityName, "Hardware", 10e3);
	// 	tryGetMaterialAmount(ns, divName, cityName, "AI Cores", 10e3);
	// 	tryGetMaterialAmount(ns, divName, cityName, "Real Estate", 10e3);
	// } else if (gStrategyPhase >= 4) {
	// 	tryGetMaterialAmount(ns, divName, cityName, "Robots", 4000);
	// 	tryGetMaterialAmount(ns, divName, cityName, "Hardware", 20e3);
	// 	tryGetMaterialAmount(ns, divName, cityName, "AI Cores", 20e3);
	// 	tryGetMaterialAmount(ns, divName, cityName, "Real Estate", 20e3);
	// }
}

function buyAllMetaMaterials(ns) {
	// for each division
	var corpInfo = ns.corporation.getCorporation();
	for (const division of corpInfo.divisions) {
		// for each warehouse
		for (const city of cities) {
			if (division == "Ag")
				buyAgMetaMaterials(ns, division, city);
			else if (isProductDivision(ns, division))
				buyProdDivMetaMaterials(ns, division, city);
		}
	}
}

function anyProductsInDevelopment(ns, divName) {		
	var divInfo = ns.corporation.getDivision(divName);
	for (const productName of divInfo.products) {
		var prodInfo = ns.corporation.getProduct(divName, productName);
		if (prodInfo.developmentProgress < 100) return true;
	}
	return false;
}

function makeRoomForProduct(ns, divName) {		
	var divInfo = ns.corporation.getDivision(divName);
	var worstId = 1e12; // safely big enough?
	var worstName = "";
	var largestId = 0;
	for (const productName of divInfo.products) {
		var prodInfo = ns.corporation.getProduct(divName, productName);
		var id = parseInt(productName.match(/\d+/), 10);
		// using id instead of rating here, in case we dip in rating
		// - the older product is still better to get rid of 
		if (id < worstId) {
			worstName = productName;
			worstId = id;
		}
		if (id > largestId) largestId = id;
	}
	// only remove the 3rd or greater product
	if (divInfo.products.length >= 3) {
		log(ns, "makeRoomForProduct - removing " + worstName);
		ns.corporation.discontinueProduct(divName, worstName);
	}
	return largestId;
}

function createProduct(ns, divName) {
	if (!isProductDivision(ns, divName)) {
		log(ns, "Invalid precondition createProduct");
		return;
	}

	if (anyProductsInDevelopment(ns, divName))
		return;

	// require 30 employees
	var office = ns.corporation.getOffice(divName, "Aevum");
	if (office.employees < 30) return;

	// finally, see if we can start a new product
	var corpInfo = ns.corporation.getCorporation();
	if (corpInfo.funds >= 2e9) { // only require 2 billion now, no reason to wait
		var nextId = makeRoomForProduct(ns, divName) + 1; // returns highest id found
		var prodName = divName + "-" + nextId;
		// invest 1% or 1 billion, whichever is greater
		var invest = Math.max(1e9, Math.floor(corpInfo.funds * 0.01));
		log(ns, "Starting new product: " + prodName + " with " + formatMoney(2*invest));
		ns.corporation.makeProduct(divName, "Aevum", prodName, invest, invest);
	}
}

function createProducts(ns) {
	var corpInfo = ns.corporation.getCorporation();
	for (const division of corpInfo.divisions) {
		if (isProductDivision(ns, division))
			createProduct(ns, division);
	}
}

function tryInstallResearch(ns, divName, researchName, requirePoints = 0) {
	if (ns.corporation.hasResearched(divName, researchName)) return true;
	var divisionInfo = ns.corporation.getDivision(divName);
	if (divisionInfo.research > requirePoints && 
		divisionInfo.research >= ns.corporation.getResearchCost(divName, researchName))
	{
		log(ns, "Purchasing division research: " + divName + " " + researchName);
		ns.corporation.research(divName, researchName);
		return true;
	}
	return false;
}

function doDivisionUpgrades(ns, divName) {
	// abandoning the 'unlimited advert' strategy.. doesn't seem to work well

	if (divName == "Ag") {
		let advertLimit = 1.25e9; // 4 levels
		if (gStrategyPhase == 2) 
			advertLimit = 1.7e9; // 6 levels
		if (gStrategyPhase == 3)
			advertLimit = 2.5e9; // ?
	
		if (ns.corporation.getHireAdVertCost(divName) <= advertLimit &&
			canAfford(ns, divName, ns.corporation.getHireAdVertCost(divName))) {
			log(ns, "Adding level of Ad.Vert");
			ns.corporation.hireAdVert(divName);
		}
	}

	// Product divisions to get lots of advert
	// - just using an arbritrary 10x scale here when starting the division, 
	// but eventually we scale up
	if (isProductDivision(ns, divName)) {
		var cost = ns.corporation.getHireAdVertCost(divName);
		if (cost > 1e12 && canAfford(ns, divName, cost))
			ns.corporation.hireAdVert(divName);
		else if (cost > 5e11 && canAfford(ns, divName, 3*cost))
			ns.corporation.hireAdVert(divName);
		else if (canAfford(ns, divName, 10*cost))
			ns.corporation.hireAdVert(divName);
	}
	
	// now check on division research
	if (isProductDivision(ns, divName)) {
		// require install in order
		var res = tryInstallResearch(ns, divName, "Hi-Tech R&D Laboratory", 15e3) &&
			tryInstallResearch(ns, divName, "Market-TA.I", 140e3) &&
			tryInstallResearch(ns, divName, "Market-TA.II");
	}
}

function tryUpgradeToLevel(ns, upgradeName, targetLevel, divName = "Ag") {
	if (ns.corporation.getUpgradeLevel(upgradeName) < targetLevel &&
		canAfford(ns, divName, ns.corporation.getUpgradeLevelCost(upgradeName))) {
		ns.corporation.levelUpgrade(upgradeName);
		log(ns, "Upgrade " + upgradeName + ":" + ns.corporation.getUpgradeLevel(upgradeName));
	}
}

function tryUpgradeLevelCheap(ns, upgradeName, cheapFactor) {
	if (canAfford(ns, "Extra", ns.corporation.getUpgradeLevelCost(upgradeName)*cheapFactor)) {
		ns.corporation.levelUpgrade(upgradeName);
		log(ns, "Upgrade " + upgradeName + ":" + ns.corporation.getUpgradeLevel(upgradeName));
	}
}

function doUpgrades(ns) {
	// basic upgrades
	if (gStrategyPhase == 1) {
		tryUpgradeToLevel(ns, "FocusWires", 2);
		tryUpgradeToLevel(ns, "Neural Accelerators", 2);
		tryUpgradeToLevel(ns, "Speech Processor Implants", 2);
		tryUpgradeToLevel(ns, "Nuoptimal Nootropic Injector Implants", 2);
		tryUpgradeToLevel(ns, "Smart Factories", 2);
	} else if (gStrategyPhase == 2) {
		tryUpgradeToLevel(ns, "Smart Factories", 10);
		tryUpgradeToLevel(ns, "Smart Storage", 10);
	} else if (gStrategyPhase == 3) {
		tryUpgradeToLevel(ns, "Wilson Analytics", 20, "Tob");

		tryUpgradeToLevel(ns, "FocusWires", 20, "Tob");
		tryUpgradeToLevel(ns, "Neural Accelerators", 20, "Tob");
		tryUpgradeToLevel(ns, "Speech Processor Implants", 20, "Tob");
		tryUpgradeToLevel(ns, "Nuoptimal Nootropic Injector Implants", 20, "Tob");

		tryUpgradeToLevel(ns, "Smart Factories", 20, "Ag"); // upgrade before others and warehouses
		tryUpgradeToLevel(ns, "Smart Storage", 20, "Ag");	// ''
		tryUpgradeToLevel(ns, "Project Insight", 20, "Tob");
		tryUpgradeToLevel(ns, "DreamSense", 10, "Tob");
		tryUpgradeToLevel(ns, "ABC SalesBots", 20, "Tob");
	}

	// later, we do any upgrades that are sufficiently cheap
	if (gStrategyPhase >= 4) {
		// any random level upgrade that is 0.1% of outstanding funds is ok to go 
		// ahead and buy (even when relatively useless)
		const levelUpgrades = ["Smart Factories", "Smart Storage", "DreamSense",
			"Nuoptimal Nootropic Injector Implants", "Speech Processor Implants",
			"Neural Accelerators", "FocusWires", "ABC SalesBots", "Project Insight"];
		for (const level of levelUpgrades)
			tryUpgradeLevelCheap(ns, level, 1000);

		// Wilson Analytics is upgraded if we have 2x the money 
		tryUpgradeLevelCheap(ns, "Wilson Analytics", 2);
	}

	// at final phase, need the bribery unlocks
	if (gStrategyPhase >= 5) {
		if (!ns.corporation.hasUnlockUpgrade("Shady Accounting") && 
			canAfford(ns, "Tob", ns.corporation.getUnlockUpgradeCost("Shady Accounting"))) {
			log(ns, "Unlocking Shady Accounting");
			ns.corporation.unlockUpgrade("Shady Accounting");
		}
		if (!ns.corporation.hasUnlockUpgrade("Government Partnership") && 
			canAfford(ns, "Tob", ns.corporation.getUnlockUpgradeCost("Government Partnership"))) {
			log(ns, "Unlocking Government Partnership");
			ns.corporation.unlockUpgrade("Government Partnership");
		}
	}

	// for each division
	var corpInfo = ns.corporation.getCorporation();
	for (const division of corpInfo.divisions) {
		doDivisionUpgrades(ns, division);
	}
}

function checkPhase(ns) {
	if (!ns.corporation.hasCorporation()) 
		gStrategyPhase = 1;
	else if (ns.corporation.getCorporation().public)
		gStrategyPhase = 5;
	else
		gStrategyPhase = ns.corporation.getInvestmentOffer().round;
}

// have to adjust the acceptable offer based on the current bitnode to avoid
// getting stuck
function getStrategyAcceptOffer(ns) {
	return ns.getBitNodeMultipliers().CorporationValuation * gStrategyAcceptOffer[gStrategyPhase];
}

var lastInvestmentOffer = 0;
function advanceStrategy(ns) {
	// do we want to advance phases?
	// strategy 1-4 is based on taking increased investment
	if (gStrategyPhase <= 3) {
		// - take an offer we can accept, but wait if offers rising
		var offer = ns.corporation.getInvestmentOffer().funds;
		var willAccept = getStrategyAcceptOffer(ns);
		if (willAccept > 0 &&
			offer < lastInvestmentOffer && 
			offer >= willAccept) {
			log(ns, "Taking investment! - " + formatMoney(offer));
			ns.corporation.acceptInvestmentOffer();
		}
		lastInvestmentOffer = offer;
	}

	// strategy 5 is going public
	if (gStrategyPhase == 4) {
		var offer = ns.corporation.getInvestmentOffer().funds;
		var willAccept = getStrategyAcceptOffer(ns);
		if (offer >= willAccept) {
			log(ns, "Going public! Offering 50m shares, 20% dividends");
			ns.corporation.goPublic(50e6); // could adjust this.. seems like a middle ground
			ns.corporation.issueDividends(0.20);
		}
	}
	// if the phase is set by user manually, still want to detect
	checkPhase(ns);
}

var lastStatusReport = 0;
const statusInterval = 10000; // ms to refresh the status report
function doStatusReport(ns) {
	const now = Date.now();
	if (lastStatusReport + statusInterval < now) {
		var corpInfo = ns.corporation.getCorporation();
		var strategy = gStrategyNames[gStrategyPhase];
		if (corpInfo.public) {
			var cap = corpInfo.sharePrice * corpInfo.totalShares;
			log(ns, "In " + strategy + 
				", market cap: " + formatMoney(cap));
		} else {
			var offer = ns.corporation.getInvestmentOffer().funds;
			log(ns, "In " + strategy + 
				", offer: " + formatMoney(offer) +
				" / " + formatMoney(getStrategyAcceptOffer(ns)));
		}

		advanceStrategy(ns);
		lastStatusReport = now;
	}
}

/** @param {NS} ns 
 * Executed every `interval` **/
async function mainLoop(ns) {
	createDivisions(ns);
	expandOffices(ns);
	upgradeWarehouses(ns);
	makePurchases(ns);
	hireEmployees(ns);
	setAllMatSalePrices(ns);
	setAllProdSalePrices(ns);
	buyAllMetaMaterials(ns);
	createProducts(ns);
	doUpgrades(ns);
	doStatusReport(ns);
 }