// paulhechols [3:19 PM]
// The first thing I need is on the inputs view... there is a button in the "New Home" box that says "Select Floor Plan"

// When you click it, a modal pops up with multipile floor plans to choose from.

// All I need for this first task if for when a floor plan is selected 
// for the box to be given a class of active and for this class to toggle on and off when a different box is selected.

// .active should be added to the same div that has .floor-plan-selector


$( document ).ready(function() {

// for (i = 0; i < 5; i++) {
//     var activeState = $('.floor-plan-selector');
//     $('.floor-plan-selector').on('click', function(e) {
//      return activeState.append('.active');
//     //e.preventDefault();
//     });
// }

var x1 = '#plan1'

    $(x1).on('click', function(e) {
      $(x1).toggleClass("active");
        $('#plan2').removeClass("active");
        $('#plan3').removeClass("active");
        $('#plan4').removeClass("active");
        $('#plan5').removeClass("active");
      e.preventDefault();
    });
    $('#plan2').on('click', function(e) {
      $('#plan2').toggleClass("active");
        $('#plan1').removeClass("active");
        $('#plan3').removeClass("active");
        $('#plan4').removeClass("active");
        $('#plan5').removeClass("active");
      e.preventDefault();
    });
    $('#plan3').on('click', function(e) {
      $('#plan3').toggleClass("active");
        $('#plan1').removeClass("active");
        $('#plan2').removeClass("active");
        $('#plan4').removeClass("active");
        $('#plan5').removeClass("active");
      e.preventDefault();
    });
    $('#plan4').on('click', function(e) {
      $('#plan4').toggleClass("active");
        $('#plan1').removeClass("active");
        $('#plan2').removeClass("active");
        $('#plan3').removeClass("active");
        $('#plan5').removeClass("active");
      e.preventDefault();
    });
    $('#plan5').on('click', function(e) {
      $('#plan5').toggleClass("active");
        $('#plan1').removeClass("active");
        $('#plan2').removeClass("active");
        $('#plan3').removeClass("active");
        $('#plan4').removeClass("active");
      e.preventDefault();
    });

});