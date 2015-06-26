//Change times to taste
const timeBetweenBars = 100;
const timeBetweenLevels = 250;
const timeOfLevels = 500;
const startDelay = 200;

const timeOfInfo = 400;
const timeBetweenInfo = 500;
const infoBarTop = 30;

const modalTextFade = 500;

var newTotal;
var usedTotal;

var newMortgageFrac;
var usedMortgageFrac;
var newEnergyFrac;
var usedEnergyFrac;
var newMaintenanceFrac;
var usedMaintenanceFrac;
var newBarFrac;
var usedBarFrac;

$( document ).ready(function() {
	$("#email-modal").modal('hide');
	$("#send-button").on('click', function() {
		$("#email-modal").modal('show');
	});
});
$( document ).ready(function() {
	$("#legend-modal").modal('hide');

	$("#legend-modal").on("hidden.bs.modal", function(e)
	{
        $("#maintenance-modal, #mortgage-modal, #energy-modal").css("opacity", 0); 
	});

	$(".graph-legend ul li").on('click', function() {
		var activeLegend = $(this).attr('class');
		console.log(activeLegend);
        $('#legend-modal').modal('show');
//        setTimeout(function(){
//            $("#mortgage-modal, #energy-modal").css("opacity", 0);
//        }, 300);
		if (activeLegend == "maintenance")
		{
			$("#maintenance-modal").animate({opacity: 1}, undefined, undefined, modalTextFade);
		}
		if (activeLegend == "mortgage")
		{
			$("#mortgage-modal").animate({opacity: 1}, undefined, undefined, modalTextFade);
		}
		if (activeLegend == "energy")
		{
			$("#energy-modal").animate({opacity: 1}, undefined, undefined, modalTextFade);
		}
	});
});

function setToCorrectHeights()
{
	var newMaintenance = TcoApp.results.model.get('newHomeCosts$maintenance');
	var newEnergy = TcoApp.results.model.get('newHomeCosts$energy');
	var newMortgage = TcoApp.results.model.get('newHomeCosts$mortgage');

	newTotal = newMaintenance + newEnergy + newMortgage;

	var usedMaintenance = TcoApp.results.model.get('usedHomeCosts$maintenance');
	var usedEnergy = TcoApp.results.model.get('usedHomeCosts$energy');
	var usedMortgage = TcoApp.results.model.get('usedHomeCosts$mortgage');

	usedTotal = usedMaintenance + usedEnergy + usedMortgage;
	
	var maxTotal = Math.max(usedTotal, newTotal);
	var maxMortgage = Math.max(newMortgage, usedMortgage);
	
	var newTotalFrac = newTotal / maxTotal;
	var usedTotalFrac = usedTotal / maxTotal;
	
	var enforcedMaxMortgageFrac = .6;
	var mortgageAdjustmentFrac = Math.min(1, enforcedMaxMortgageFrac / (maxMortgage / maxTotal));
	newMortgageFrac = Math.max(.2, mortgageAdjustmentFrac * (newMortgage / maxTotal));
	usedMortgageFrac = Math.max(.2, mortgageAdjustmentFrac * (usedMortgage / maxTotal));
	//Now the maximum mortgage frac should be .6 or lower, and the other should be slightly lower than that.
	
	//Ensure that there is at least 20% left for the other two sections.  This means the total bar ratios may not be truly proportional.
	var leftoverNewFrac = Math.max(.2, newTotalFrac - newMortgageFrac);
	var leftoverUsedFrac = Math.max(.2, usedTotalFrac - usedMortgageFrac);
	
	newEnergyFrac = newEnergy / (newEnergy + newMaintenance) * leftoverNewFrac;
	newEnergyFrac = Math.max(.1, newEnergyFrac);
	newEnergyFrac = Math.min(leftoverNewFrac - .1, newEnergyFrac)
	usedEnergyFrac = usedEnergy / (usedEnergy + usedMaintenance) * leftoverUsedFrac;
	usedEnergyFrac = Math.max(.1, usedEnergyFrac);
	usedEnergyFrac = Math.min(leftoverUsedFrac - .1, usedEnergyFrac)
	
	newMaintenanceFrac = leftoverNewFrac - newEnergyFrac;
	usedMaintenanceFrac = leftoverUsedFrac - usedEnergyFrac;
	
	usedBarFrac = (usedMortgageFrac + usedEnergyFrac + usedMaintenanceFrac);
	newBarFrac = (newMortgageFrac + newEnergyFrac + newMaintenanceFrac);

    var largerTotal = Math.max(newTotal, usedTotal);

	$("#used-home-graph .maintenance").height((usedMaintenanceFrac*100) + "%");
	$("#used-home-graph .energy").height((usedEnergyFrac*100) + "%");
	$("#used-home-graph .mortgage").height((usedMortgageFrac*100) + "%");

    $('#used-home-graph div').data('offset', ((1 - usedBarFrac)*100) + '%');

	$("#new-home-graph .maintenance").height(((newMaintenanceFrac*100)) + "%");
	$("#new-home-graph .energy").height(((newEnergyFrac*100)) + "%");
	$("#new-home-graph .mortgage").height(((newMortgageFrac*100)) + "%");

    $('#new-home-graph div').data('offset', ((1 - newBarFrac)*100) + '%');
}

function executeWithNoTransitions(callback) {
    $body = $(document.body);
    $body.addClass('disable-transitions');
    callback();
    $body[0].offsetHeight; // Trigger a reflow, flushing the CSS changes, avoids some bugs
    $body.removeClass('disable-transitions');
};

function resetResults() {
    var cssClasses = ['.bar-section', '.helper-box', '.cost-less-wrapper', '.graph-legend', 
                      '.graph-wrapper .graph > p', '.graph-wrapper .graph'];

    executeWithNoTransitions(function() {
        cssClasses.forEach(function(cssClass) {
            $(cssClass).attr('style', '');
        });
    });
};

function beginBarAnimations()
{
	var newbar = $("#new-home-graph");
	barAnimation(newbar);

	setTimeout(function()
	{
		var usedbar = $("#used-home-graph");
		barAnimation(usedbar);
	}, timeBetweenBars + ( ( timeBetweenLevels + timeOfLevels ) * 3 ) );

	setTimeout(function()
	{
		showInfoBar();

	}, timeBetweenBars + ( ( timeBetweenLevels + timeOfLevels ) * 3 ) * 2)

}

function barAnimation(mainbar)
{
	var mortgage = $(mainbar).children("div.mortgage").getHeightInPercent();
	var energy = $(mainbar).children("div.energy").getHeightInPercent();
	var maintenance = $(mainbar).children("div.maintenance").getHeightInPercent();
	mortgage = parseFloat(mortgage.substring(0, mortgage.length - 1));
	energy = parseFloat(energy.substring(0, energy.length - 1));
	maintenance = parseFloat(maintenance.substring(0, maintenance.length - 1));

	if (mainbar.attr("id") == "new-home-graph")
	{
		var graphHeight = $(".graph-wrapper").height();
		var ratio = newBarFrac;
		var offset = (graphHeight - 4) * (1-ratio);//4 px border

		mortgage = (mortgage + (mortgage / ratio))*1.2;
		energy = (energy + (energy / ratio)) * 1.2;
		maintenance = (maintenance + (maintenance / ratio)) * 1.2;
	}
	else if (mainbar.attr("id") == "used-home-graph")
	{
		var graphHeight = $(".graph-wrapper").height();
		var ratio = usedBarFrac;
		var offset = (graphHeight - 4) * (1-ratio);//4 px border

		mortgage = (mortgage + (mortgage / ratio))*1.2;
		energy = (energy + (energy / ratio)) * 1.2;
		maintenance = (maintenance + (maintenance / ratio)) * 1.2;
	}
	else
	{
		var offset = "0";
	}


	$(mainbar).children("div.mortgage").css("top", mortgage + "%").css("opacity", 1);
	$(mainbar).children("div.mortgage").animate({"top": offset + "px"}, undefined, undefined, timeOfLevels);

	setTimeout(function()
	{
		$(mainbar).children("div.energy").css("top", energy + "%").css("opacity", 1);
		$(mainbar).children("div.energy").animate({"top": offset + "px"}, undefined, undefined, timeOfLevels);

		setTimeout(function()
		{
			$(mainbar).children("div.maintenance").css("top", maintenance + "%").css("opacity", 1);
			$(mainbar).children("div.maintenance").animate({"top": offset + "px"}, undefined, undefined, timeOfLevels);
		}, timeBetweenLevels + timeOfLevels);

	}, timeBetweenLevels + timeOfLevels);
}

function showInfoBar()
{
	$(".graph-wrapper .graph").css("overflow", "visible");

	$(".helper-box").css("margin-top", infoBarTop + "px");
    
    var energyCalc = (($('#used-home-graph .energy').height()/38)*4);
    $("#used-home-energy-helper").css("top", energyCalc + "rem");
    
    var maintenanceCalc = (-($('#used-home-graph .maintenance').height()/10)+23);
    $("#used-home-maintenance-helper").css("top", '-' + maintenanceCalc + "rem");

	$(".graph-wrapper .graph > p").animate({"opacity": "1"}, undefined, undefined, timeOfInfo);

	var helperBoxStyles = ".cost-less-wrapper, .graph-legend, .helper-box";
	if (newTotal >= usedTotal)
	{
		helperBoxStyles = ".graph-legend, .helper-box"; //Don't add the cost-less-wrapper if the new home is more expensive.
	}
	$(helperBoxStyles).each(function(index) {
        console.log(this);

		if ($(this).attr("class").search("helper-box") > -1) {
            
			$(this).delay((index + 1) * timeBetweenInfo).animate({"opacity": "1", "margin-top": "0"}, undefined, undefined, timeOfInfo);
		}
		else
		{
			$(this).delay((index + 1) * timeBetweenInfo).animate({"opacity": "1"}, undefined, undefined, timeOfInfo);
		}

	});
}
