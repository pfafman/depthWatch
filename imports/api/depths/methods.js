// Methods related to links

import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import { Depths } from './depths.js';
import moment from 'moment';

Meteor.methods({

  'dayDepths' () {

      //console.log("dayDepths: called");

      const pipeline = [
        {
          $sort : { time : 1 } 
        },
        {
          $group: {
            '_id': {
              'day': {
                $dateToString: {
                  format: "%Y-%m-%d",
                  date: "$time",
                  timezone: "America/Denver"
                }
              }
            },
            'enter': {
              $first: "$enter"
            },
            'max': {
              $max: "$max"
            },
            'min': {
              $min: "$min"
            },
            'exit': {
              $last: "$exit"
            },
            'maxAve': {
              $avg: "$max"
            },
            'minAve': {
              $avg: "$min"
            },
            'time': {
              $first: "$time"
            }
          }
        },
        {
           $sort : { time : 1 } 
        },
        {
          $project: {
            _id: 0,
            "time": "$_id.day",
            "enter": 1,
            "max": 1,
            "min": 1,
            "exit": 1
          }
        }
      ];

      return Depths.aggregate(pipeline, {});
  },

  'hourDepths' () {

      //console.log("hourDepths: called");

      const pipeline = [
        {
          $match: { 'time' :
            {
              $gt: moment().subtract(5, 'days').startOf('day').toDate()
            }
          }
        },
        {
          $sort : { 'time' : 1 } 
        },
        {
          $group: {
            '_id': {
              'day': {
                $dateToString: {
                  format: "%Y-%m-%d %H:00:00",
                  date: "$time",
                  timezone: "America/Denver"
                }
              }
            },
            'enter': {
              $first: "$enter"
            },
            'max': {
              $max: "$max"
            },
            'min': {
              $min: "$min"
            },
            'exit': {
              $last: "$exit"
            }
          }
        },
        {
          $sort : { '_id.day' : 1 } 
        },
        {
          $project: {
            _id: 0,
            "time": "$_id.day",
            "enter": 1,
            "max": 1,
            "min": 1,
            "exit": 1
          }
        }
      ];

      return Depths.aggregate(pipeline, {});
  },


  'depthRange' () {
    const pipeline = [
      {
        $group: {
          '_id': null,
          'min': {
            $min: '$min'
          },
          'max': {
            $max: '$max'
          }
        }
      },
      {
        $project: {
          _id: 0,
          'min': 1,
          'max': 1
        }
      }
    ]

    return Depths.aggregate(pipeline, {});
  },


  'status' () {
    const current = Depths.findOne({},{ sort: {time: -1}, limit:1 });
    //console.log(current);
    const age = moment().diff(moment(current.time), 'minutes');
    console.log("Last read", age,'minutes ago');
    if (age < 5) {
      return 'ok';
    } else {
      return 'error'
    }
  }

});


