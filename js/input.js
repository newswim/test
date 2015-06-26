$( document ).ready(function() {
    $('.alternate').addClass('alternate-hidden');
    
    //Show Floor Plan Options Modal

	$("#floor-plan-button a").on('click', function() {
		$("#modal-cover").show();
		$("#floor-plans").show();
        
        return false;
	});

	$("#modal-cover").on('click', function() {
		$("#floor-plans").hide();
		$("#modal-cover").hide();
	});

	$('.floor-plan-selector-button').on('click', function(e) {
		$(this).siblings('input').prop('checked', true);
		$("#floor-plans").hide();
		$("#modal-cover").hide();
	});
    
    $(window).load(function() {
        var width = 0;
            $('.floor-plan-selector').each(function() {
                width += $(this).outerWidth( true );
            });
            $('#floor-plans > div').css('width', width + 70);         
    });
    
    $('#sale-price-wrapper input').keyup(function(event) {
      
        // skip for arrow keys
        if(event.which >= 37 && event.which <= 40) return;

        // format number
        $(this).val(function(index, value) {
            return value
                .replace(/\D/g, '')
                .replace(/\B(?=(\d{3})+(?!\d))/g, ",")
            ;
        });
    });
    
    $("#down-payment-toggle a").on('click', function(e) {
        e.preventDefault();
        $("#down-payment-toggle").toggleClass('dollars-active');
        // Add percent / dollar classes to '#down-payment-input'
        // there was a problem with the if/else, was detecting class on wrong element
        var sliderValueMin = $('#down-payment-min');
        sliderValueMin.text() == sliderValueMin.data("dollar-value")
         ? sliderValueMin.text(sliderValueMin.data("percentage-value"))
         : sliderValueMin.text(sliderValueMin.data("dollar-value"));
        
        var sliderValueMax = $('#down-payment-max');
        sliderValueMax.text() == sliderValueMax.data("dollar-value")
         ? sliderValueMax.text(sliderValueMax.data("percentage-value"))
         : sliderValueMax.text(sliderValueMax.data("dollar-value"));
        
        var sliderInput = $('#down-payment-input');
        sliderInput.toggleClass('dollar-values');

  
        if (sliderInput.hasClass('dollar-values')) {
                return [
                    // attempting to reevoke with .refresh [this can just be left off]
                    $(".mort-text").val(0),
                    $('.alternate').addClass('alternate-show'),
                    $('.percent-alt').addClass('alternate-hidden'),
                    $('.alternate').removeClass('alternate-hidden'),
                    sliderInput.attr('data-slider-min', '0'),
                    sliderInput.attr('data-slider-max', '200000')];
        } else {
               return [
                $(".mort-text").val(0),
                $('.alternate').addClass('alternate-hidden'),
                $('.percent-alt').removeClass('alternate-hidden'),
                $('.alternate').removeClass('alternate-show'),
                sliderInput.attr('data-slider-min', '0'),
                sliderInput.attr('data-slider-max', '100')];
        };
      
    });

});


