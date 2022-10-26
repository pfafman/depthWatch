// All links-related publications

import { Meteor } from 'meteor/meteor';
import { Depths } from '../depths.js';
import moment from 'moment';


Meteor.publish('depths.last48', function () {
  console.log("Publish last 48 Depths");
  return Depths.find({time: {$gte: moment().subtract(48, 'hours').toDate()}},{sort: {time: 1}});
});


