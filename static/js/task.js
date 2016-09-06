/*
 * Requires:
 *     psiturk.js
 *     utils.js
 */
"use strict";



// Initialize psiturk object
var psiTurk = new PsiTurk(uniqueId, adServerLoc, mode);

// All pages to be loaded
var pages = [
    "instructions/instruct-tutorial.html",
    "instructions/instruct-tutorial2.html",
    "instructions/instruct-endtutorial.html",
    "instructions/instruct-experiment1.html",
    "instructions/instruct-experiment2.html",
    "instructions/instruct-experiment3.html",
    "stage.html",
    "questionnaires/questionnaire-task.html",
    "questionnaires/questionnaire-demographics.html",
    "feedback/feedback-experiment.html",
    "instructions/instruct-generalization1.html",
    "instructions/instruct-generalization2.html",
    "instructions/instruct-generalization3.html",
    "feedback/feedback-generalization.html"
];

psiTurk.preloadPages(pages);

var instructionsTutorial = [
    "instructions/instruct-tutorial.html",
    "instructions/instruct-tutorial2.html"
];

var instructionsExperiment = [
    "instructions/instruct-experiment1.html",
    "instructions/instruct-experiment2.html",
    "instructions/instruct-experiment3.html"
];

var instructionsGeneralization = [
    "instructions/instruct-generalization1.html",
    "instructions/instruct-generalization2.html",
    "instructions/instruct-generalization3.html"
];



/********************
* HTML manipulation
*
* All HTML files in the templates directory are requested 
* from the server when the PsiTurk object is created above. We
* need code to get those pages from the PsiTurk object and 
* insert them into the document.
*
********************/

/********************
* Tutorial      *
********************/
var move_to_next_trial;
var n_responses;

var Tutorial = function() {

    move_to_next_trial = false;
    // trial_complete = false;

    var curBlock;

    var init = function() {
        psiTurk.showPage('stage.html');

        for (var i=0; i< demo_trials.length; i++) {
            demo_trials[i].task_display = document.getElementById('task_display');
            demo_trials[i].text_display = $('#trial_text');
            demo_trials[i].trial_number = i;
        }

        if (typeof curBlock !== 'undefined') {
            setTimeout(curBlock.end(), 10);
        }

        curBlock = demo_trials.shift();
        setTimeout(curBlock.start(), 10);
    };


    var next = function(event) {
        console.log('Level 1 event');

        if (move_to_next_trial && event.which==13) {
            if (demo_trials.length===0) {

                $(document).unbind('keydown.continue');
                $(document).unbind('keydown.gridworld');
                psiTurk.doInstructions(
                    instructionsExperiment,
                    function() {current_view = new Experiment(); } // function executes following instructions.
                );
            }
            else {
                //this.stateCheck = true;
                $(document).unbind('keydown.continue');
                $.publish('killtimers');

                n_responses = 0;
                // console.log(cur)

                if (typeof curBlock !== 'undefined') {
                    var restart = curBlock.restart;
                    console.log(restart);
                    setTimeout(curBlock.end(), 10);
                }

                if (restart !== true) {
                    curBlock = demo_trials.shift();
                    curBlock.task_display = document.getElementById('task_display');
                    curBlock.text_display = $('#trial_text');
                    setTimeout(curBlock.start(), 10);

                } else {
                    curBlock.reset()
                }


                move_to_next_trial = false;

                setTimeout(function() {
                    console.log('end demo trial');
                    $(document).bind('keydown.continue', next);
                }, 10)
            }
        }
    };

    init();
    $(document).bind('keydown.continue', next);
};


/************************
* Grid World Experiment *
*************************/
var total_points = 0;
var trial_number;
var times_seen_context = {};
var Experiment = function() {

    trial_number = -1;
    move_to_next_trial = false;
    // trial_complete = false;

    //trials variable is declared in trials_experimental.js

    var curBlock;

    var init = function() {
        console.log("experiment init called");

        psiTurk.showPage('stage.html');

        for (var i=0; i< trials.length; i++) {
            trials[i].task_display = document.getElementById('task_display');
            trials[i].text_display = $('#trial_text');
        }

        if (typeof curBlock !== 'undefined') {
            setTimeout(curBlock.end(), 10);
        }

        curBlock = trials.shift();
        setTimeout(curBlock.start(), 10);
        curBlock.total_points = 0;
        times_seen_context[curBlock.context] = 1;
        curBlock.times_seen_context = 1;

        move_to_next_trial = false;

        setTimeout(function() {
            $(document).bind('keydown.continue', next);
        }, 10)
    };


    var next = function(event) {
        console.log("next event called (training)");

        if (event.which==13) {
            console.log(event);

            if (trials.length===0) {
                finish()
            }
            else {
                if (move_to_next_trial) {

                    $(document).unbind('keydown.continue');
                    $.publish('killtimers');

                    n_responses = 0;

                    if (typeof curBlock !== 'undefined') {
                        setTimeout(curBlock.end(), 10);
                    }
                    total_points = curBlock.total_points; // get the total points from the end of the trial

                    console.log("Trial shift");
                    curBlock = trials.shift();

                    // Pass the total points collected to the current block for display
                    curBlock.total_points = total_points;

                    // how many times has this context been seen?
                    if (curBlock.context in times_seen_context) {
                        times_seen_context[curBlock.context] ++;
                    } else {
                        times_seen_context[curBlock.context] = 1;
                    }
                    curBlock.times_seen_context = times_seen_context[curBlock.context];


                    setTimeout(curBlock.start(), 10);
                    //console.log(curBlock.colors);
                    console.log('Running trail: ' + trial_number);
                    console.log('Trials left: ' + trials.length);


                    // allow_response = true;
                    move_to_next_trial = false;
                    console.log('check continue');

                    setTimeout(function() {
                        $(document).bind('keydown.continue', next);
                    }, 10)
                }
            }
        }
    };

    var finish = function() {
        //$("body").unbind("keydown.continue"); // Unbind keys
        $("body").unbind(); // Unbind keys
        psiTurk.recordTrialData(
            {
                'Phase': 'Points Collected',
                'Total Points': total_points
            });

        psiTurk.saveData();
        current_view = new RewardFeedback_experiment();
        // current_view = new DemographicsQuestionnaire();
    };

    init();
};

/// Test phase
var generalization_points = 0;
var Generalization = function() {

   trial_number = -1;
   // move_to_next_trial = false;
   // trial_complete = false;

   //trials variable is declared in trials_experimental.js

   var curBlock;

   var init = function() {
       console.log("");
       console.log("Test Phase init called");

       psiTurk.showPage('stage.html');

       for (var ii=0; ii < test_trials.length; ii++) {
           test_trials[ii].task_display = document.getElementById('task_display');
           test_trials[ii].text_display = $('#trial_text');
       }

       if (typeof curBlock !== 'undefined') {
           setTimeout(curBlock.end(), 10);
       }

       curBlock = test_trials.shift();
       setTimeout(curBlock.start(), 10);
       curBlock.total_points = 0;
       times_seen_context[curBlock.context] = 1;

       // allow_response = true;
       move_to_next_trial = false;

       setTimeout(function() {
           $(document).bind('keydown.continue', next_test_trial);
       }, 10)
   };


   var next_test_trial = function(event) {
       console.log("next event called (test)");

       if (event.which==13) {
           if (test_trials.length===0) {
               finish()
           }
           else {
               if (move_to_next_trial) {
                   //this.stateCheck = true;
                   $(document).unbind('keydown.continue');
                   $.publish('killtimers');

                   n_responses = 0;

                   if (typeof curBlock !== 'undefined') {
                       setTimeout(curBlock.end(), 10);
                   }

                   generalization_points = curBlock.total_points; // get the total points from the end of the trial

                   curBlock = test_trials.shift();

                   // how many times has this context been seen?
                   if (curBlock.context in times_seen_context) {
                       times_seen_context[curBlock.context] ++;
                   } else {
                       times_seen_context[curBlock.context] = 1;
                   }
                   curBlock.times_seen_context = times_seen_context[curBlock.context];

                   // Pass the total points collected to the current block for display
                   curBlock.total_points = generalization_points;

                   setTimeout(curBlock.start(), 10);

                   // allow_response = true;
                   move_to_next_trial = false;
                   console.log('check continue');

                   setTimeout(function() {
                       $(document).bind('keydown.continue', next_test_trial);
                   }, 10)
               }
           }
       }
   };

   var finish = function() {
       $("body").unbind("keydown.continue"); // Unbind keys
       psiTurk.recordTrialData(
           {
               'Phase': 'Generalization Points Collected',
               'Total Points': generalization_points
           });

       psiTurk.saveData();
       current_view = RewardFeedback_total();
   };

   init();
};

/****************
* Feedback Screens *
****************/
var RewardFeedback_experiment = function() {
    psiTurk.showPage('feedback/feedback-experiment.html');
    $('#points').html(total_points);


    $("#next").click(function () {
        psiTurk.doInstructions(
            instructionsGeneralization,
            function() {
                // allow_response = true;
                current_view = new Generalization(); // executes following instructions.
            }
        );
    });


};

var RewardFeedback_total = function() {
   var all_points = total_points + generalization_points;
   psiTurk.showPage('feedback/feedback-generalization.html');
   $('#generalization_points').html(generalization_points);
   $('#points').html(all_points);


   $("#next").click(function () {
       current_view = new DemographicsQuestionnaire();
   });


};




/****************
* Questionnaire *
****************/
var reprompt;
var record_responses;
var prompt_resubmit;
var resubmit;

var DemographicsQuestionnaire = function() {

    var error_message = "<h1>Oops!</h1><p>Something went wrong submitting your HIT. This might happen if you " +
        "lose your internet connection. Press the button to resubmit.</p><button id='resubmit'>Resubmit</button>";

    record_responses = function() {

        psiTurk.recordTrialData({'phase':'questionnaire-demographics', 'status':'submit'});

        $('textarea').each( function(i, val) {
            psiTurk.recordUnstructuredData(this.id, this.value);
        });
        $('select').each( function(i, val) {
            psiTurk.recordUnstructuredData(this.id, this.value);        
        });

        psiTurk.recordUnstructuredData('Browser', navigator.userAgent);
        var elapsedTime = new Date().getTime() - start_time;
        psiTurk.recordUnstructuredData('Completion Time', elapsedTime)
    };

    prompt_resubmit = function() {
        replaceBody(error_message);
        $("#resubmit").click(resubmit);
    };

    resubmit = function() {
        replaceBody("<h1>Trying to resubmit...</h1>");
        reprompt = setTimeout(prompt_resubmit, 10000);
        
        psiTurk.saveData({
            success: function() {
                clearInterval(reprompt); 
                psiTurk.computeBonus('compute_bonus', function(){finish()}); 
            }, 
            error: prompt_resubmit
        });
    };

    // Load the questionnaire snippet 
    psiTurk.showPage('questionnaires/questionnaire-demographics.html');
    psiTurk.recordTrialData({'phase':'questionnaire-demographics', 'status':'begin'});
    
    $("#next").click(function () {
        record_responses();
        psiTurk.saveData({
            success: function(){
                current_view = TaskQuestionnaire();
            }, 
            error: prompt_resubmit});
    });
    
    
};

/****************
* Task Questionnaire *
****************/
var TaskQuestionnaire = function() {

    var error_message = "<h1>Oops!</h1><p>Something went wrong submitting your HIT. This might happen if you " +
        "lose your internet connection. Press the button to resubmit.</p><button id='resubmit'>Resubmit</button>";

    record_responses = function() {

        psiTurk.recordTrialData({'phase':'questionnaire-task', 'status':'submit'});

        $('textarea').each( function(i, val) {
            psiTurk.recordUnstructuredData(this.id, this.value);
        });
        $('select').each( function(i, val) {
            psiTurk.recordUnstructuredData(this.id, this.value);
        });

    };

    prompt_resubmit = function() {
        replaceBody(error_message);
        $("#resubmit").click(resubmit);
    };

    resubmit = function() {
        replaceBody("<h1>Trying to resubmit...</h1>");
        reprompt = setTimeout(prompt_resubmit, 10000);

        psiTurk.saveData({
            success: function() {
                clearInterval(reprompt);
                psiTurk.computeBonus('compute_bonus', function(){finish()});
            },
            error: prompt_resubmit
        });
    };

    // Load the questionnaire snippet
    psiTurk.showPage('questionnaires/questionnaire-task.html');
    psiTurk.recordTrialData({'phase':'questionnaire-task', 'status':'begin'});

    $("#next").click(function () {
        record_responses();
        psiTurk.saveData({
            success: function(){
                psiTurk.completeHIT(); // when finished saving compute bonus, the quit
            },
            error: prompt_resubmit});
    });


};

// Task object to keep track of the current phase
var current_view;
var start_time = new Date().getTime();

/*******************
 * Run Task
 ******************/
$(window).load( function(){
    psiTurk.doInstructions(
        instructionsTutorial,
        function() { current_view = new Tutorial(); } // what you want to do when you are done with instructions
        // function() {current_view = new Generalization()}
    );
});
