// Fill the DB with example data on startup

import { Meteor } from 'meteor/meteor';
import { Depths } from '../../api/depths/depths.js';

import moment from 'moment';



Mongo.Collection.prototype.aggregate = function(pipelines, options) {
  let coll = this.rawCollection();
  const cursor = coll.aggregate(pipelines, options);
  return cursor;
}


Depths.rawCollection().aggregate

Meteor.startup( async () => {
  
  // console.log("Remove Depths");
  // //Depths.remove({});
  // await Depths.removeAsync({})


  console.log("Depths:", await Depths.find().countAsync());

});
