function uniquePathsII(data) {
    data = data.split('\n').map(l => l.slice(0,-1).split(','));
    const obstacleGrid = [];
    obstacleGrid.length = data.length;
    for (let i = 0; i < obstacleGrid.length; ++i) {
        obstacleGrid[i] = data[i].slice();
    }
    for (let i = 0; i < obstacleGrid.length; i++) {
        for (let j = 0; j < obstacleGrid[0].length; j++) {
            if (obstacleGrid[i][j] == 1) {
                obstacleGrid[i][j] = 0;
            } else if (i == 0 && j == 0) {
                obstacleGrid[0][0] = 1;
            } else {
                obstacleGrid[i][j] = (i > 0 ? obstacleGrid[i - 1][j] : 0) + (j > 0 ? obstacleGrid[i][j - 1] : 0);
            }
        }
    }
    return obstacleGrid[obstacleGrid.length - 1][obstacleGrid[0].length - 1];
}


/** @param {NS} ns */
export async function main(ns) {
	//ns.tprint("Result: "+spiralize("[[1,2],\n[3,4]]"));
var data =
"0,0,0,0,0,1,0,0,1,0,1,0,\n"+
"0,0,0,0,0,0,0,0,0,0,0,0,\n"+
"0,0,0,0,1,0,0,0,0,1,0,0,\n"+
"0,0,1,0,0,0,1,0,0,0,0,0,\n"+
"0,0,0,0,0,0,0,1,0,0,0,0,\n"+
"1,0,0,0,0,0,1,0,0,0,0,0,\n"+
"0,0,1,0,0,1,0,0,0,0,0,0,"
;
    //var data = ns.args[0];
	ns.tprint("Result: "+uniquePathsII(data));
}