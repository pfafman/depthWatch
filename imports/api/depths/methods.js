// Methods related to links

import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import { Depths } from './depths.js';
import moment from 'moment';

Meteor.methods({

  async dayDepths (host) {

      const pipeline = [
        {
          $match: {
            type: 'pressure',
            host: host
          }
        },
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
            'sum': {
              $sum: "$sum"
            },
            'readings': {
              $sum: "$readings"
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
            _id:        0,
            "time":    "$_id.day",
            "enter":    1,
            "max":      1,
            "min":      1,
            "exit":     1,
            "sum":      1,
            "readings": 1
          }
        }
      ];

      let result = await Depths.aggregate(pipeline, {}).toArray();

      return result;
  },


  async dayDepthsSonic () {

      const pipeline = [
        {
          $match: {
            type: 'sonic'
          }
        },
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
            'sum': {
              $sum: "$sum"
            },
            'readings': {
              $sum: "$readings"
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
            _id:        0,
            "time":    "$_id.day",
            "enter":    1,
            "max":      1,
            "min":      1,
            "exit":     1,
            "sum":      1,
            "readings": 1
          }
        }
      ];

      let result = await Depths.aggregate(pipeline, {}).toArray();

      return result;
  },


  async hourDepthsSonic () {

      //console.log("hourDepths: called");

      const pipeline = [
        {
          $match: { 'time' :
            {
              $gt: moment().subtract(5, 'days').startOf('day').toDate()
            },
            type: 'sonic'
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
            },
             'sum': {
              $sum: "$sum"
            },
            'readings': {
              $sum: "$readings"
            }
          }
        },
        {
          $sort : { '_id.day' : 1 } 
        },
        {
          $project: {
            _id:        0,
            "time":    "$_id.day",
            "enter":    1,
            "max":      1,
            "min":      1,
            "exit":     1,
            "sum":      1,
            "readings": 1
          }
        }
      ];

      let result = await Depths.aggregate(pipeline, {}).toArray();

      return result;
  },


  async hourDepths (host) {

      //console.log("hourDepths: called");

      const pipeline = [
        {
          $match: { 'time' :
            {
              $gt: moment().subtract(5, 'days').startOf('day').toDate()
            },
            type: 'pressure',
            host: host
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
            },
             'sum': {
              $sum: "$sum"
            },
            'readings': {
              $sum: "$readings"
            }
          }
        },
        {
          $sort : { '_id.day' : 1 } 
        },
        {
          $project: {
            _id:        0,
            "time":    "$_id.day",
            "enter":    1,
            "max":      1,
            "min":      1,
            "exit":     1,
            "sum":      1,
            "readings": 1
          }
        }
      ];

      let result = await Depths.aggregate(pipeline, {}).toArray();

      return result;
  },


  async depthRange () {
    const pipeline = [
      {
        $match: {
          type: 'sonic'
        }
      },
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

    let result = await Depths.aggregate(pipeline, {}).toArray();

    return result;
  },


  'status' () {
    const current = Depths.findOneAsync({'type': 'sonic'},{ sort: {time: -1}, limit:1 });
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


