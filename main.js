var SMRS = require('single-market-robot-simulator');

function debounce(a, b){
    var ms = (typeof(a)==='number')? a: b;
    var func = (typeof(a)==='function')? a: b;
    var timer;
    if ((typeof(ms)==='number') && (typeof(func)==='function'))
	return function(){
	    clearTimeout(timer);
	    timer = setTimeout(func, ms);
	}
    else 
	return function(){};
};
    

function getNumberArray(jqsel){
    return $(jqsel).val().split(" ").map(function(s){ return +s; });
}

function redrawStepChart(){
    var buyerValues = getNumberArray('#costs');
    var sellerCosts = getNumberArray('#values');
    $('#aggregateSupplyDemandDiv').html('');
    $.jqplot("aggregateSupplyDemandDiv", 
	     [buyerValues,sellerCosts],
	     { seriesDefaults:{
		 step: true
	     }
	     }
	    );
}


function main(){
    var config = {};
    // clear any leftovers
    $('.jqplot-target').remove();
    $('#tradingData').remove();
    $('#downloadButton').remove();
    // set up and run new simulation
    try {
	var buySellBookLimit = +($('#buySellBookLimit').val()) || 0;
	var buyerImprovementRuleLevel = +($('#buyerImprovementRuleLevel').val()) || 0;
	var sellerImprovementRuleLevel = +($('#sellerImprovementRuleLevel').val()) || 0;
	var booklimit = Math.max(buySellBookLimit, buyerImprovementRuleLevel, sellerImprovementRuleLevel);
	var resetAfterEachTrade = +($('#resetAfterEachTrade').val());
	config = {
	    "H": 200, 
	    "L":1,
	    "sellerCosts": getNumberArray('#costs'),
	    "buyerValues": getNumberArray('#values'),
	    "periods": +($('#periods').val()),
	    "numberOfBuyers": +($('#numberOfBuyers').val()),
	    "numberOfSellers": +($('#numberOfSellers').val()),
	    "buyerRate": +($('#buyerRate').val()),
	    "sellerRate": +($('#sellerRate').val()),
	    "periodDuration": +($('#periodDuration').val()),
	    "integer": +($('#integer').val()),
	    "keepPreviousOrders": +($('#keepPreviousOrders').val()),
	    "ignoreBudgetConstraint": +($('#ignoreBudgetConstraint').val()),
	    "xMarket": {
		bookfixed: 1,
		booklimit: booklimit || 10,
		buyImprove: (buyerImprovementRuleLevel>0)? {level: (buyerImprovementRuleLevel-1)} : 0,
		sellImprove: (sellerImprovementRuleLevel>0)? {level: (sellerImprovementRuleLevel-1)} : 0,
		buySellBookLimit: buySellBookLimit,
		resetAfterEachTrade: resetAfterEachTrade
	    }
	};
    } catch(e){
	console.log(e);
	$('#runError').text(e);
    }
    var onPeriod = function(e,sim){
	var plotOptions = {
	    title: "ZI robot trades - Period "+sim.period,
	    axes:{
		xaxis:{
		    show:true,
		    label: 't(sec)',
		    min:0,
		    max: sim.periodDuration
		},
		yaxis:{
		    show:true,
		    label: 'price',
		    min:0,
		    max: 200
		}
	    }
	};
	(CSV
	 .begin(sim.logs.trade.data)
	 .hslice({period:[sim.period,sim.period]})
	 .jqplot([
	     ["ZI-period-"+sim.period,
	      [["t","price"]],
	      plotOptions
	     ]
	 ])
	 .go()
	);
    };

    var makeTradeTable = function(sim){
	(CSV
	 .begin(sim.logs.trade.data)
	 .table("tradingData",{caption:"ZI Robot Market Trades"})
	 .go()
	);
    };

    var activateDownloadButton = function(sim){
	$('<button id="downloadButton">Download trades.csv file</button>').insertAfter("#tradingData");
	$('#downloadButton').click(function(){
	    (CSV
	     .begin(sim.logs.trade.data)
	     .download("trades.csv")
	     .go()
	    );
	});
    };
    
    var onDone = function(e,sim){
	setTimeout(makeTradeTable, 500, sim);
	setTimeout(activateDownloadButton, 1000, sim);
    }; 

    window.sim = SMRS.runSimulation(config, onDone, onPeriod); 
}


$('#runButton').click(main);
$('#costs').on('keyup', debounce(2000, redrawStepChart));
$('#values').on('keyup', debounce(2000, redrawStepChart));
