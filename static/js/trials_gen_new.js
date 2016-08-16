/*******************************************
* Define the mappings and goal identities:
***************************************** */
"use strict";

//
var response_handler_lh_test = responseHandlerGeneratorForTest(action_mapping_lh, instruction_set_lh);
var response_handler_rh_test = responseHandlerGeneratorForTest(action_mapping_rh, instruction_set_rh);

/******************
* Initial locations!
******************* */
//this code always put the agent in the center to start, don't really want this
//// this is the 4 squares in the center of the 6x6 grid


/* *****************************************
* Contexts!
* ***************************************** */


// there are 4 generalization contexts (can include up to 8). Including the 8 seen in training, there are 12 total
var contexts = {
    8: {'ctx': 8, 'response_handler': response_handler_lh_test, 'instruction_set': instruction_set_lh, 'color': list_colors.pop(), 'repeats': 5},
    9: {'ctx': 9, 'response_handler': response_handler_lh_test, 'instruction_set': instruction_set_lh, 'color': list_colors.pop(), 'repeats': 4},
    10: {'ctx': 10, 'response_handler': response_handler_rh_test, 'instruction_set': instruction_set_rh, 'color': list_colors.pop(), 'repeats': 5},
    11: {'ctx': 11, 'response_handler': response_handler_rh_test, 'instruction_set': instruction_set_rh, 'color': list_colors.pop(), 'repeats': 4}
};

var n_ctx = contexts.length;
var context_order = [8, 9, 10, 11];


/* goal contexts are shown in sequence (not intermixed) for simplicity */
var bag_of_contexts = [];
for (var ii=0; ii<n_ctx; ii++) {
    var n_reps = balance[ii];
    for (var jj=0; jj<n_reps; jj++) {
        bag_of_contexts.push(ii);
    }
}
context_order = _.shuffle(context_order);
context_queue = [];
while (context_order.length > 0) {
    var ctx = context_order.pop();
    for (ii=0; ii<contexts[ctx].repeats; ii++) {
        context_queue.push(ctx)
    }
}

console.log('Generalization Context Order:');
console.log(context_queue);


/* *****************************************
* Define the behavior of each generalization trial.
* ***************************************** */

var test_trials = [];
//console.log(grid_contexts);

while (context_queue.length > 0) {
    // take the context number from the queue
    ctx = context_queue.shift();

    // define the walls (or absence of walls)
    var wall_set;
    if (Math.random() < wall_probability) {
        // pick a random wall set (a, b, or c)
        var wall_sets = [make_wall_set_a, make_wall_set_b, make_wall_set_c];
        wall_sets = _.shuffle(wall_sets);
        wall_set = wall_sets.pop()();
    } else {
        wall_set = [];
    }

    // define the goal locations and the agent start location
    var initial_locations = random_initial_locations();
    var start_location =  initial_locations.Agent;
    var goal_ids = ['A', 'B', 'C'];
    var goal_locations = {};
    for (ii=0; ii<goal_ids.length; ii++) {
        goal_locations[goal_ids[ii]] = initial_locations.Goals.pop();
    }

    var goal_values = {
        'A': 6.67, // "A" is rewarded in 4 of 6 training contexts
        'B': 1.67, // "B" is rewarded in 1 of 6 training contexts
        'C': 1.67  // "C" is rewarded in 1 of 6 training contexts
    };

    // construct the goals
    var goals = [];
    for (ii=0; ii<goal_ids.length; ii++) {
        goals.push(
            {
                agent:'agent1',
                location: goal_locations[goal_ids[ii]],
                label: goal_ids[ii],
                display_label: goal_display_label_key[goal_ids[ii]],
                value: goal_values[goal_ids[ii]]
            }
        )
    }

    // define the trial
    var trial = new Trial(
        {
            height : 6,
            width : 6,
            walls : wall_set,
            tile_size: trial_tile_size,
            goals : goals,
            agents : [{name : 'agent1'}]
        },
        //initial state
        {
		    agent1 : {name : 'agent1', location : start_location, type : 'agent'}
        },
        ctx, // context number
        [contexts[ctx].color], // agent color
        contexts[ctx].response_handler, //response handler
        //initial text, display id, message id
        'Which goal is the best?<span style="font-size:150%"></span><br><span style="font-size:150%">' +
        '<span style="font-weight: bold"> </span></span><br><span style="color: #707070">' +
        '<span style="font-style: italic"> Use the '+ contexts[ctx].instruction_set + ' keys to move.</span></span>',
        '#task_display',
        '#trial_text'
    );

    trial.draw_goals = true;
    trial.trial_number = ii;
    trial.points = 0;
    trial.total_points = 0;

    test_trials.push(trial);
}
