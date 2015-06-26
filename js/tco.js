(function($, Backbone, Handlebars){

Backbone.Epoxy.binding.addHandler('slider', {
    set: function($element, value) {
        $element.data().slider.setValue(value);
        $element.change();
    },
    get: function($element, value, event) {
        return $element.data().slider.getValue();
    }
});

Backbone.Epoxy.binding.addHandler('dollars', {
    set: function($element, value) {
        value = parseInt(value);
        if (isNaN(value)) {
            value = 0;
        }
        
        $element.text(numeral(value).format('$0,0'));
    },
    get: function($element, value, event) {
        value = parseInt(value.replace(/[$,]/g , ''));
        
        if (isNaN(value)) {
            value = 0;
        }

        return value;
    },
});

Backbone.Epoxy.binding.addFilter('min', function (a, b) {
    return Math.min(a, b);
});

$('#back-button').on('click', function() {
    TcoApp.router.navigate('community/' + TcoApp.results.model.get('inputs$newHome$communityName'), {trigger:true});
});

var formatPlanCost = function(value) {
    var amount = numeral(value).format('$0,0');
    return 'FROM ' + amount;
}

var formatPlanArea = function(value) {
	var str = String(value);
	if(str.indexOf(" - ") > -1)
	{
		var squareFootages = value.split(" - ");
		return 'SQ. FT: ' + numeral(squareFootages[0]).format('0,0') + ' - ' + numeral(squareFootages[1]).format('0,0');
	}
    var squareFootage = numeral(value).format('0,0');
    return 'SQ. FT: ' + squareFootage;
}

Handlebars.registerHelper('planCost', formatPlanCost);
Handlebars.registerHelper('planArea', formatPlanArea);

TcoApp = new function(){
    this.isValidEmail = function(email) {
        // Not perfect, but good enough to provide user feedback
        var re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        return re.test(email);
    };

    this.flattenLayout = function(nestedLayout) {
        return Backbone.Linear_Model.flatten(nestedLayout, {delimiter: '$'});
    };

    this.unflattenLayout = function(flatLayout) {
        return Backbone.Linear_Model.unflatten(flatLayout, {delimiter: '$'});
    };

    this.addClassIfNotPresent = function($el, cssClass) {
        if (!$el.hasClass(cssClass)) {
            $el.addClass(cssClass);
        }
    }

    this.inputsLayout = {
        newHome: {
            projectId: 1237,
            planId: 5445,
            cost: 200000,
            communityName: null,
        },
        usedHome: { 
            cost: 250000,
            age: 10,
            area: 2000,
        },
        mortgage: {
            downPaymentPct: 20,
            downPaymentCost: 150000,
            length: 30,
            ratePct: 5,
        }
    };

    this.resultsLayout = {
        permalinkId: null,

        inputs: this.inputsLayout,

        newHomeCosts: {
            energy: 0,
            maintenance: 0,
            mortgage: 0,
            downpayment: 0,
        },

        usedHomeCosts: {
            energy: 0,
            maintenance: 0,
            mortgage: 0,
            downpayment: 0,
        },
    }

    this.InputsModel = Backbone.Model.extend({
        url: '/ekotrope/v1/tco/calculate',
        defaults: this.flattenLayout(this.inputsLayout),
    });

    this.ResultsModel = Backbone.Model.extend({
        url: function() {
            return '/ekotrope/v1/tco/results/' + this.get('permalinkId');
        },
        defaults: this.flattenLayout(this.resultsLayout),
    });

    this.EmailFormModel = Backbone.Model.extend({
        url: '/ekotrope/v1/tco/emailresults'
    });

    this.MainView = Backbone.Epoxy.View.extend({
        showInputs: function() {
            console.log("Show Inputs");
            TcoApp.addClassIfNotPresent($('#inputs-content'), 'active');
            TcoApp.addClassIfNotPresent($('header.inputs'), 'active');
            $('#results-content.active').removeClass('active');
            $('header.results').removeClass('active');

            resetResults();
        },

        showResults: function() {
            console.log("Show Results");
            TcoApp.addClassIfNotPresent($('#results-content'), 'active');
            TcoApp.addClassIfNotPresent($('header.results'), 'active');
            $('#inputs-content.active').removeClass('active');
            $('header.inputs').removeClass('active');
        },
    });

    this.InputsView = Backbone.Epoxy.View.extend({

        initialize: function() {
            logEvents(this.bindingSources.state);
        },

        bindings: {
            // New
            'input[name="floorplan"]': 'checked:newHome$planId',
            
            // Used
            '[name="years"]'    : 'checked:integer(usedHome$age)',
            '[name="footage"]'  : 'checked:integer(usedHome$area)',
            '.sale-price'       : 'value:salePrice(usedHome$cost),events:["blur", "keyup"]',

            // Mortgage
            '#mortgage-rate input.slider'    : 'slider:decimal(mortgage$ratePct)',
            '#mortgage-length input.slider'  : 'slider:integer(mortgage$length)',
            '#down-payment-input': 'slider:integer(mortgage$downPaymentPct)',
            '#down-payment-toggle-wrapper .slider-txt': 'value:downpaymentDisplay',

            '#down-payment-input2': {
                slider: 'integer(mortgage$downPaymentCost)',
                sliderMax: 'min(newHome$cost, usedHome$cost)',
            },
        },

        bindingHandlers: {
            sliderMax: _.debounce(function($slider, minHomeCost) {
                // Don't break the slider when cost is too low
                minHomeCost = Math.max(10000, minHomeCost);

                var downpaymentCost = this.view.getBinding('mortgage$downPaymentCost');

                if (minHomeCost < downpaymentCost) {
                    this.view.setBinding('mortgage$downPaymentCost', minHomeCost);
                    downpaymentCost = minHomeCost;
                }
                    
                $slider.attr('data-slider-max', minHomeCost);
                $slider.siblings('.slider-value-max').text(numeral(minHomeCost).format('$0,0'));
                $slider.slider({max: minHomeCost});
                $slider.slider('setValue', downpaymentCost);
            }, 1000)
        },

        bindingFilters: {
            salePrice: {
                get: function(value) {
                    if (isNaN(value)) {
                        value = 0;
                    }
                    return numeral(value).format('0,0');
                },
                set: function(value) {
                    value = parseInt(value.replace(/,/g,''));

                    if (isNaN(value)) {
                        value = 0;
                    }

                    return value;
                },
            },
        },

        computeds: {
            downpaymentDisplay: {
                deps: [ 'state_downpaymentIsPct', 'mortgage$downPaymentPct', 'mortgage$downPaymentCost' ],
                get: function(displayAsPct, pctValue, costValue) {
                    var displayValue;

                    if (displayAsPct) {
                        displayValue = numeral(pctValue/100).format('0%');
                    }else {
                        displayValue = numeral(costValue).format('$0,0');
                    }

                    return displayValue;
                },
            },
        },

        bindingSources: {
            state: new Backbone.Model({ 
                downpaymentIsPct: true, 
            }),
        },

        events: {
            'click .results-submit': 'doSubmit',
            'click #down-payment-toggle': 'toggleDownpaymentIsPct',
            'click .sale-price': 'selectSalePrice',
        },

        toggleDownpaymentIsPct: function() {
            var pctIsSelected = !$('#down-payment-toggle').hasClass('dollars-active');
            this.setBinding('state_downpaymentIsPct', pctIsSelected);

            if (pctIsSelected) {
                var sliderBeingEnabled = $('#down-payment-input2');
                var sliderBeingDisabled = $('#down-payment-input');
            }else {
                var sliderBeingEnabled = $('#down-payment-input');
                var sliderBeingDisabled = $('#down-payment-input2');
            }

            sliderBeingEnabled.val(sliderBeingEnabled.data('lastValue'));
            sliderBeingDisabled.data('lastValue', sliderBeingDisabled.val());

            sliderBeingEnabled.trigger('change');
            sliderBeingDisabled.trigger('change');
        },

        doSubmit: function() {
            $("#loading-modal").modal({
                backdrop: 'static',
                keyboard: false,
                show: true,
            });
            if (!TcoApp.inputs.getBinding('state_downpaymentIsPct')) {
                TcoApp.inputs.setBinding('mortgage$downPaymentPct', 0);
            }
            Backbone.sync('create', this.model)
                .success(function(response){
                    TcoApp.router.navigate('results/' + response.permalinkId, {trigger:true});
                    $('#loading-modal').modal('hide');
                });
        },

        selectSalePrice: function() {
            this.$el.find('.sale-price').select();
        },

    });

    this.FloorplanSelectorsView = Backbone.Epoxy.View.extend({
        initialize: function() {
            this.template = Handlebars.compile($('#floorplan-selector-template').html());
            this.render();
        },
        render: function() {
            this.$el.html(this.template(this.model.attributes));

            this.$el.find('.floor-plan-selector-button').on('click', function(e) {
                var inputElem = $(this).siblings('input');
                var selectedPlanIndex = parseInt(inputElem.val());

                inputElem.prop('checked', true);

                $("#floor-plans").hide();
                $("#modal-cover").hide();

                var selectedPlan = TcoApp.rawCommunityPlans[selectedPlanIndex];
                TcoApp.selectedPlan.set(selectedPlan);
                TcoApp.inputs.setBinding('newHome$cost', selectedPlan.cost);
                TcoApp.inputs.setBinding('newHome$planId', selectedPlan.planId);
            });
        },
    });

    this.FloorplanInfoView = Backbone.Epoxy.View.extend({
        bindings: {
            '#floor-plan-title': 'text:name',
            '#floor-plan-number': 'text:planId',
            '#floor-plan-cost': 'text:planCost(cost)',
            '#floor-plan-area': 'text:planArea(area)',
            '#floor-plan-stories': 'text:floors',
            '#floor-plan-bedrooms': 'text:bedrooms',
            '#floor-plan-baths': 'text:baths',
            '#floor-plan-garages': 'text:garages',
        },
        bindingFilters: {
            planCost: formatPlanCost,
            planArea: formatPlanArea,
        },
    });

    function monthlyTotal(which) {
        return {
            deps: [which + 'HomeCosts$maintenance', which + 'HomeCosts$energy', which + 'HomeCosts$mortgage'],
            get:  function(maintenance, energy, mortgage) {
                return maintenance + energy + mortgage;
            }
        };
    }

    function monthlyDelta(propertyName) {
        return {
            deps: ['newHomeCosts$' + propertyName, 'usedHomeCosts$' + propertyName],
            get: function(newCost, usedCost) {
                return usedCost - newCost;
            }
        }
    }

    this.ResultsView = Backbone.Epoxy.View.extend({
        bindings: {
            '#new-home-graph .maintenance  .cost-label': 'dollars:newHomeCosts$maintenance',
            '#new-home-graph .energy       .cost-label': 'dollars:newHomeCosts$energy',
            '#new-home-graph .mortgage     .cost-label': 'dollars:newHomeCosts$mortgage',

            '#used-home-graph .maintenance .cost-label': 'dollars:usedHomeCosts$maintenance',
            '#used-home-graph .energy      .cost-label': 'dollars:usedHomeCosts$energy',
            '#used-home-graph .mortgage    .cost-label': 'dollars:usedHomeCosts$mortgage',

            '.new-home-total-monthly-cost': 'dollars:newHomeMonthlyTotal',
            '.used-home-total-monthly-cost': 'dollars:usedHomeMonthlyTotal',

            '#new-home-graph .downpayment': 'dollars:newHomeCosts$downpayment',
            '#used-home-graph .downpayment': 'dollars:usedHomeCosts$downpayment',

            '#used-home-maintenance-helper .value span': 'dollars:maintenanceDelta',
            '#used-home-energy-helper .value span': 'dollars:energyDelta',

            '#new-home-helper .value span': 'text:equity',
        },
        computeds: {
            newHomeMonthlyTotal: monthlyTotal('new'),
            usedHomeMonthlyTotal: monthlyTotal('used'),
            maintenanceDelta: monthlyDelta('maintenance'),
            energyDelta: monthlyDelta('energy'),
            equity: {
                deps: ['newHomeCosts$mortgage', 'newHomeMonthlyTotal'],
                get: function(mortgage, monthlyTotal) {
                    var percentEquity = mortgage / monthlyTotal;
                    return numeral(percentEquity).format('0%');
                },
            }
        },
    });

    this.EmailFormView = Backbone.Epoxy.View.extend({

        events: {
            'click #email-submit': 'sendResults',
            'blur #email': 'updateEmail',
        },

        sendResults: function() {
            this.updateEmail();

            if (TcoApp.isValidEmail(this.model.get('email'))) {
                // There is an odd bug in, I believe, Epoxy when input[type="email"] 
                // So I'm pulling the value out manually instead of using an Epoxy
                // binding for now.
                $('#email-modal').modal('hide');
                Backbone.sync('create', this.model)
                    .success(function() {
                        $('input#email').val('');
                    });
            }
        },

        updateEmail: function() {
            console.log('updateEmailFeedback');
            this.model.set('email', $('input#email').val());
            var isValidEmail = TcoApp.isValidEmail(this.model.get('email'));
            this.updateInvalidEmailFeedback(isValidEmail, true);
        },

        updateInvalidEmailFeedback: function(isValid, shake) {
            console.log('updateInvalidEmailFeedback');
            var email = $('input#email');
            var isAlreadyMarkedInvalid = email.hasClass('error');

            if (!isValid) {
                console.log('Adding error feedback');

                if (!isAlreadyMarkedInvalid) {
                    email.addClass("control-group");
                    email.addClass("error");
                }
                if (shake) {
                    $('.modal-dialog').effect("shake");
                }
            }else if (isValid) {
                console.log('Removing error feedback');
                email.removeClass("control-group");
                email.removeClass("error");
            }
        },
    });

    this.Router = Backbone.Router.extend({
        routes: {
            '': 'defaultRoute',
            'community/:communityName': 'showInputs', // #community/foo
            'results/:resultId': 'showResults', // #results/foo123
        },

        defaultRoute: function() {
            this.showInputs('default');
        },

        showInputs: function(communityName) {
        	if(communityName === 'dwh-rockwell') {
        		communityName = 'dwh-rockwall';
        	}
            if (typeof TcoApp.rawCommunityPlans === 'undefined') {
                TcoApp.rawCommunityPlans = tco_communities[communityName];
                TcoApp.selectedPlan = new Backbone.Model(TcoApp.rawCommunityPlans[0]);
                TcoApp.inputs.model.set('newHome$communityName', communityName);

                TcoApp.inputs.model.set('newHome$cost', TcoApp.selectedPlan.get('cost'));
                TcoApp.inputs.model.set('usedHome$cost', TcoApp.selectedPlan.get('cost'));
                TcoApp.inputs.model.set('newHome$planId', TcoApp.selectedPlan.get('planId'));
            }
            
            TcoApp.floorplanSelectors = new TcoApp.FloorplanSelectorsView({
                el: '#floor-plans .table-item',
                model: new Backbone.Model({
                	floorplans: TcoApp.rawCommunityPlans,
             }),
            });

            TcoApp.floorplanInfo = new TcoApp.FloorplanInfoView({
                el: '#new-homes',
                model: TcoApp.selectedPlan,
            });

            TcoApp.mainview.showInputs();
        },

        showResults: function(resultId){

            TcoApp.mainview.showResults();

            TcoApp.results.model.set('permalinkId', resultId);
            TcoApp.results.model.fetch()
                .success(function() {
                    var flatResults = TcoApp.results.model.attributes;
                    var inputs = TcoApp.unflattenLayout(flatResults).inputs;
                    inputs = TcoApp.flattenLayout(inputs);
                    
                    TcoApp.inputs.model.set(inputs);

                    setToCorrectHeights();
                    beginBarAnimations();
                });

            TcoApp.models.emailForm.set('resultsId', resultId);
        }
    });

    this.init = function() {

        TcoApp.models = {
            results: new TcoApp.ResultsModel(),
            inputs: new TcoApp.InputsModel(),
            emailForm: new TcoApp.EmailFormModel(),
        };

        logEvents(TcoApp.models.inputs);
        logEvents(TcoApp.models.results);
        logEvents(TcoApp.models.emailForm);

        TcoApp.mainview = new TcoApp.MainView({ 
            el: $('#main') 
        });

        TcoApp.inputs = new TcoApp.InputsView({
            el: $('#inputs-content'),
            model: TcoApp.models.inputs,
        });

        TcoApp.results = new TcoApp.ResultsView({
            el: $('#results-content'),
            model: TcoApp.models.results,
        });

        TcoApp.emailForm = new TcoApp.EmailFormView({
            el: $('#email-modal'),
            model: TcoApp.models.emailForm,
        });

        TcoApp.router = new TcoApp.Router;

        Backbone.history.start();
        console.log('TcoApp init complete');
    };
};
var logEvents = function(model, ignored) {
    model.on("all", function(event, _, value) {
        if(typeof ignored !== "undefined") {
            for(var i=0; i<ignored.length; i++) {
                if (event === ignored[i]) {
                    return;
                }
            }
        }
        console.log({event:event, value:value});
    });
}

$(document).ready(function() {
    TcoApp.init();
});
})(jQuery, Backbone, Handlebars);
