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
          $sort : { 'time' : 1 } 
        },
        {
          $group: {
            '_id': {
              'day': {
                $dateToString: {
                  format: "%Y-%m-%d",
                  date: "$time"
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
          $filter: { 'time' :
            {
              $gt: moment().subtract(2, 'days').startOf('day').toDate()
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
                  format: "%Y-%m-%d %h",
                  date: "$time"
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
  }

});