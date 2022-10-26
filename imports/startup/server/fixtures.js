// Fill the DB with example data on startup

import { Meteor } from 'meteor/meteor';
import { Depths } from '../../api/depths/depths.js';

import moment from 'moment';

Meteor.startup( async () => {
  
  console.log("Remove Depths");
  //Depths.remove({});
  await Depths.removeAsync({})

  // if (Depths.find().count() === 0) {

  //   // start = moment().subtract(30, 'days');
  //   // theDepth = 0;

  //   // while (start.isBefore(moment())) {
  //   //   Depths.insert({
  //   //     time: start.toDate(),
  //   //     depth: theDepth
  //   //   });

  //   //   start.add(1, 'hour');
  //   //   theDepth += 10*Math.random()-5;
  //   //   if (theDepth < 0) {
  //   //     theDepth = 0;
  //   //   }
  //   // }

  //   //console.log("Added", Depths.find().count(), "depths");
   
  // }
});
