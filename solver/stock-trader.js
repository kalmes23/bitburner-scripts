function maxProfit(maxTrades, stockPrices) {
    let i, j, k;

    let tempStr = "[0";
    for (i = 0; i < stockPrices.length; i++) {
        tempStr += ",0";
    }
    tempStr += "]";
    let tempArr = "[" + tempStr;
    for (i = 0; i < maxTrades - 1; i++) {
        tempArr += "," + tempStr;
    }
    tempArr += "]";

    let highestProfit = JSON.parse(tempArr);

    for (i = 0; i < maxTrades; i++) {
        for (j = 0; j < stockPrices.length; j++) { // Buy / Start
            for (k = j; k < stockPrices.length; k++) { // Sell / End
                if (i > 0 && j > 0 && k > 0) {
                    highestProfit[i][k] = Math.max(highestProfit[i][k], highestProfit[i - 1][k], highestProfit[i][k - 1], highestProfit[i - 1][j - 1] + stockPrices[k] - stockPrices[j]);
                } else if (i > 0 && j > 0) {
                    highestProfit[i][k] = Math.max(highestProfit[i][k], highestProfit[i - 1][k], highestProfit[i - 1][j - 1] + stockPrices[k] - stockPrices[j]);
                } else if (i > 0 && k > 0) {
                    highestProfit[i][k] = Math.max(highestProfit[i][k], highestProfit[i - 1][k], highestProfit[i][k - 1], stockPrices[k] - stockPrices[j]);
                } else if (j > 0 && k > 0) {
                    highestProfit[i][k] = Math.max(highestProfit[i][k], highestProfit[i][k - 1], stockPrices[k] - stockPrices[j]);
                } else {
                    highestProfit[i][k] = Math.max(highestProfit[i][k], stockPrices[k] - stockPrices[j]);
                }
            }
        }
    }
    return highestProfit[maxTrades - 1][stockPrices.length - 1];
}


/** @param {NS} ns */
export async function main(ns) {
    if (ns.args.length < 2) {
        ns.tprint("./solver/stock-trader.js numTrades [stockPrices]");
        ns.tprint("Make sure the stock prices are in an array!")
        ns.tprint("(You can enter 1000 for numTrades if unlimited)");
    }
	//ns.tprint("Result: "+spiralize("[[1,2],\n[3,4]]"));
	var data = JSON.parse(ns.args[1]);
	ns.tprint("Result: "+JSON.stringify(maxProfit(ns.args[0], data)));
}