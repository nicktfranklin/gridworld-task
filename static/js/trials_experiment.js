/*******************************************
* Define the mappings and goal identities:
***************************************** */
"use strict";

//
var response_handler_a = responseHandlerGenerator(action_mapping_a);
var response_handler_b = responseHandlerGenerator(action_mapping_b);

/******************
* Initial locations!
******************* */
//this code always put the agent in the center to start, don't really want this
//// this is the 4 squares in the center of the 6x6 grid


/* *****************************************
* Contexts!
* ***************************************** */



// there are 9 contexts, including the final "test" contexts, during training
var contexts = [
    {'ctx': 0, 'response_handler': response_handler_a, 'goal_id': 'A', 'color': list_colors.pop()},
    {'ctx': 1, 'response_handler': response_handler_a, 'goal_id': 'A', 'color': list_colors.pop()},
    {'ctx': 2, 'response_handler': response_handler_a, 'goal_id': 'B', 'color': list_colors.pop()},
    {'ctx': 3, 'response_handler': response_handler_a, 'goal_id': 'C', 'color': list_colors.pop()},
    {'ctx': 4, 'response_handler': response_handler_b, 'goal_id': 'A', 'color': list_colors.pop()},
    {'ctx': 5, 'response_handler': response_handler_b, 'goal_id': 'B', 'color': list_colors.pop()},
    {'ctx': 6, 'response_handler': response_handler_b, 'goal_id': 'D', 'color': list_colors.pop()},
    {'ctx': 7, 'response_handler': response_handler_b, 'goal_id': 'A', 'color': list_colors.pop()}
];

/* we want to control for the actual goal identity, so randomize what is acutally shown on the screen
 such that what we count as Goal "A" may actually be goal "C", etc.
 */

function shuffle_keys() {
    var labels = ['A', 'B', 'C', 'D'];
    var shuffled_labels = _.shuffle(labels);
    var label_key = {};
    while (labels.length > 0) {
        label_key[labels.shift()] = shuffled_labels.shift()
    }
    return label_key
}
var goal_display_label_key = shuffle_keys();

// var n_ctx = contexts.length;
var balance = [6, 6, 6, 18, 6, 12, 16];
var trial_tile_size = 70;

/* New! Randomization Algorithm */

function randomize_context_queue(context_balance, repeat_prob) {
    // generate a bag of contexts to sample without replacement
    var bag_of_contexts = [];
    for (var ii=0; ii<context_balance.length; ii++) {
        for (var jj=0; jj<context_balance[ii]; jj++) {
            bag_of_contexts.push(ii)
        }
    }

    // draw from the bag
    var context_queue = [];
    while (bag_of_contexts.length > 0) {
        bag_of_contexts = _.shuffle(bag_of_contexts); // randomize the order

        var ctx = bag_of_contexts[0];  // draw a random context

        // figure out how many repeats of the contexts
        var n_rep = 1;
        while (Math.random() < repeat_prob) {
            n_rep ++;
        }

        // add the contexts to the queue (up to) n_rep times and remove them from the bag the same number of times
        while (n_rep > 0 && bag_of_contexts.indexOf(ctx) > -1) {
            // add the context to the queue
            context_queue.push(ctx);

            // remove the ctx from the bag
            var idx = bag_of_contexts.indexOf(ctx);
            bag_of_contexts.splice(idx, 1);

            n_rep --;
        }

    }
    // add the last context
    // context_queue.push(bag_of_contexts.pop());

    return context_queue
}
var context_queue = randomize_context_queue(balance, 0.25);
// /* create the randomized Queue of contexts */
// var bag_of_contexts = [];
// for (var ii=0; ii<n_ctx; ii++) {
//     var n_reps = balance[ii];
//     for (var jj=0; jj<n_reps; jj++) {
//         bag_of_contexts.push(ii);
//     }
// }
//

//
//
// shuffle(bag_of_contexts);
//
// // this function is needed for the findIndex command
// var context_check_val = -1;
// function check_ctx(element) {
//     return element == context_check_val;
// }
//
// /* add some auto-correlation */
// var context_queue = [];
// while (bag_of_contexts.length > 0) {
//     var ctx = bag_of_contexts.pop();
//     context_queue.push(ctx);
//
//     // check if the context is in the bag anymore
//     context_check_val = ctx;
//     var idx = bag_of_contexts.findIndex(check_ctx);
//     if (idx > -1) {
//         // with certain probability, add the same context to the queue again
//         if (Math.random() < 0.75) {
//             context_queue.push(ctx); // push the ctx onto the queue
//             bag_of_contexts.splice(idx, 1); // remove the context from the bag so as not to re-sample it
//         }
//     }
// }
// Note! context order is a queue!!
for (ii=0; ii<4; ii++) {
    context_queue.push(7);
}
console.log('Context Order:');
console.log(context_queue);
// count the contexts in the queue
var context_counts = [];
for (ii=0; ii<contexts.length; ii++) {
    context_counts.push(0);
}
for (ii=0; ii<context_queue.length; ii++){
    var ctx = context_queue[ii];
    context_counts[ctx] += 1;
}
console.log('Number of Context Repeats:');
console.log(context_counts);


/* need code to define the goal locations */
function random_goal_locations() {
    var quadrant_1_goal = [Math.floor(Math.random() * 3) + 3, Math.floor(Math.random() * 3) + 3];
    var quadrant_2_goal = [Math.floor(Math.random() * 3), Math.floor(Math.random() * 3) + 3];
    var quadrant_3_goal = [Math.floor(Math.random() * 3), Math.floor(Math.random() * 3)];
    var quadrant_4_goal = [Math.floor(Math.random() * 3) + 3, Math.floor(Math.random() * 3)];


    var goal_locations = [quadrant_1_goal, quadrant_2_goal, quadrant_3_goal, quadrant_4_goal];
    goal_locations = _.shuffle(goal_locations);
    return goal_locations
}

/* takes in the goal locations and returns a random initial location at least N steps from the
nearest goal.
 */

function random_initial_locations() {
    var min_manhattan_distance = 3;
    while (true) {
        var goal_locations = random_goal_locations();

        var init_loc = [Math.floor(Math.random() * 6), Math.floor(Math.random() * 6)];
        var min_dist = 8 + 8; // counter, initialize with the manhattan distance between opposite corners

        for (ii=0; ii<goal_locations.length; ii++) {
            var g_loc = goal_locations[ii];
            var dist = Math.abs(g_loc[0] - init_loc[0]) + Math.abs(g_loc[1] - init_loc[1]);
            min_dist = Math.min(min_dist, dist);

        }
        if (min_dist >= min_manhattan_distance) {
            return  {
                'Agent': init_loc,
                'Goals': goal_locations
            }
        }
    }
}

/* need code to define the walls */
function add_wall_sections(wall_sections_array) {
    var walls = [];
    while (wall_sections_array.length > 0) {
        var section = wall_sections_array.pop();

        // randomize the order of the section and remove a (random) wall
        section = _.shuffle(section);
        section.pop();
        while (section.length > 0) {
            var wall = section.pop();
            while (wall.length > 0) {
                walls.push(wall.pop())
            }
        }
    }
    return walls
}


function make_wall_set_a() {
    var wall_sections = [
        [
            [[2, 3, 'up'], [2, 4, 'down']],
            [[3, 3, 'up'], [3, 4, 'down']]
        ],
        [
            [[1, 3, 'right'], [2, 3, 'left']],
            [[1, 2, 'right'], [2, 2, 'left']]
        ],
        [
            [[2, 1, 'up'], [2, 2, 'down']],
            [[3, 1, 'up'], [3, 2, 'down']]
        ],
        [
            [[3, 3, 'right'], [4, 3, 'left']],
            [[3, 2, 'right'], [4, 2, 'left']]
        ]
    ];

    // randomize the order of the wall sections and remove one;
    wall_sections = _.shuffle(wall_sections);
    wall_sections.pop();
    return add_wall_sections(wall_sections);
}

function make_wall_set_b(){
    var wall_sections = [
        [
            [[0, 2, 'up'], [0, 3, 'down']],
            [[1, 2, 'up'], [1, 3, 'down']],
            [[2, 2, 'up'], [2, 3, 'down']]
        ],
        [
            [[2, 0, 'right'], [3, 0, 'left']],
            [[2, 1, 'right'], [3, 1, 'left']],
            [[2, 2, 'right'], [3, 2, 'left']]
        ],
        [
            [[3, 2, 'up'], [3, 3, 'down']],
            [[4, 2, 'up'], [4, 3, 'down']],
            [[5, 2, 'up'], [5, 3, 'down']]
        ],
        [
            [[2, 3, 'right'], [3, 3, 'left']],
            [[2, 4, 'right'], [3, 4, 'left']],
            [[2, 5, 'right'], [3, 5, 'left']]
        ]
    ];
    return add_wall_sections(wall_sections)
}

function make_wall_set_c() {
    var walls = [];
    var section_list = [];

    var wall_sections = [
        [
            [[1, 1, 'right'], [2, 1, 'left']],
            [[1, 2, 'right'], [2, 2, 'left']]
        ],
        [
            [[1, 1, 'up'], [1, 2, 'down']],
            [[2, 1, 'up'], [2, 2, 'down']]
        ]
    ];
    wall_sections = _.shuffle(wall_sections);
    section_list.push(wall_sections.pop());

    // next section
    wall_sections = [
        [
            [[3, 1, 'right'], [4, 1, 'left']],
            [[3, 2, 'right'], [4, 2, 'left']]
        ],
        [
            [[3, 1, 'up'], [3, 2, 'down']],
            [[4, 1, 'up'], [4, 2, 'down']]
        ]
    ];
    wall_sections = _.shuffle(wall_sections);
    section_list.push(wall_sections.pop());

    wall_sections = [
        [
            [[1, 3, 'right'], [2, 3, 'left']],
            [[1, 4, 'right'], [2, 4, 'left']]
        ],
        [
            [[1, 3, 'up'], [1, 4, 'down']],
            [[2, 3, 'up'], [2, 4, 'down']]
        ]
    ];
    wall_sections = _.shuffle(wall_sections);
    section_list.push(wall_sections.pop());

    wall_sections = [
        [
            [[3, 3, 'right'], [4, 3, 'left']],
            [[3, 4, 'right'], [4, 4, 'left']]
        ],
        [
            [[3, 3, 'up'], [3, 4, 'down']],
            [[4, 3, 'up'], [4, 4, 'down']]
        ]
    ];

    wall_sections = _.shuffle(wall_sections);
    section_list.push(wall_sections.pop());
    while (section_list.length > 0) {
        var section = section_list.pop();
        while (section.length > 0) {
            var wall = section.pop();
            while (wall.length > 0) {
                walls.push(wall.pop())
            }
        }
    }
    return walls;
}

/* *****************************************
* Define the behavior of each trial.
* ***************************************** */

var Trial = function (gridworld, initState, context, color_list, key_handler, initText, task_display, text_display) {
	this.gridworld = gridworld;
	this.initState = initState; // used in the response handler
	this.task_display = document.getElementById('task_display');
	this.text_display = $(text_display);
	this.state = initState;
	this.key_handler = (function (context, key_handler) {
							return function (event) {
								key_handler.call(context, event);
							}
						})(this, key_handler);
	this.initText = initText;
    this.colors = color_list;
	this.draw_goals = true;
    this.actions_taken = 0;
    this.trial_number = 0; // used in the response handler
    this.context = context;
    this.times_seen_context = 1;
};

var trial_on;

Trial.prototype.start = function () {
    trial_number++;

	this.mdp = new ClientMDP(this.gridworld);
	this.painter = new GridWorldPainter(this);

    $(document).unbind();
	$(document).bind('keydown.gridworld', this.key_handler);

    trial_on = new Date().getTime();

	this.text_display.html(this.initText);
	this.painter.init(this.task_display);
	$(this.painter.paper.canvas).css({display : 'block', margin : 'auto'}); //center the task
	this.painter.drawState(this.state);
};

Trial.prototype.end = function () {
	this.painter.remove();
	$(document).unbind('keydown.gridworld');
};


/*
* Draw the experiment trials*/

var trials = [];
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
    var goal_ids = ['A', 'B', 'C', 'D'];
    var goal_locations = {};
    for (ii=0; ii<goal_ids.length; ii++) {
        goal_locations[goal_ids[ii]] = initial_locations.Goals.pop();
    }

    // convert the correct goal to values for each goal
    var goal_values = {};
    for (var key in goal_locations) {
        if (goal_locations.hasOwnProperty(key)) {
            goal_values[key] = 0;
            if (contexts[ctx].goal_id == key) {
                goal_values[key] = 10;
            }
        }
    }

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
        '<span style="font-style: italic"> Use the <b>a</b>, <b>s</b>, <b>d</b>, <b>f</b>, and <b>j</b>, <b>k</b>, ' +
        '<b>l</b>, <b>;</b> keys to move.</span></span>',
        '#task_display',
        '#trial_text'
    );

    trial.draw_goals = true;
    trial.trial_number = ii;
    trial.points = 0;
    trial.total_points = 0;

    trials.push(trial);
}
