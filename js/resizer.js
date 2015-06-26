// Get the length of html content in an element..
// we're being specific here for time sake, but it could
// be rewritten to be a multi-purpose library

// var planName = $("#floor-plan-title").html().length;

$(document).ready(function () {
    resizer();
});

function resizer() {
		// DOMSubtreeModified handles document mutations
		$('#floor-plan-title').on('DOMSubtreeModified', function() {
	    var that = $('#floor-plan-title');
	    var planName = that.html().length;
	    // depending on html length, update font-size
	    if(planName > 30) {
	        that.css('font-size', '14px');
	        console.log("Font exceeds 30 chars");
	    } else if(planName > 25) {
	        that.css('font-size', '16px');
	        console.log("Font exceeds 30 chars");
	    } else if(planName > 20) {
	        that.css('font-size', '18px');
	        console.log("Font exceeds 10 chars");
	    } else if(planName > 15) {
	        that.css('font-size', '20px');
	        console.log("Font exceeds 10 chars");
	    } else if(planName > 10) {
	        that.css('font-size', '22px');
	        console.log("Font exceeds 10 chars");
	    } else if(planName >= 0) {
	        that.css('font-size', '24px');
	        console.log("Font exceeds 10 chars");
	    }
	  })
}
