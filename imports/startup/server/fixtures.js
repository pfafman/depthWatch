// Fill the DB with example data on startup

import { Meteor } from 'meteor/meteor';
import { Depths } from '../../api/depths/depths.js';

import moment from 'moment';

console.log("Load fixtures.js");

Meteor.startup( async () => {
  
  // console.log("Remove Depths");
  // //Depths.remove({});
  // await Depths.removeAsync({})


  console.log("Depths:", Depths.find().count());

});
