// All links-related publications

import { Meteor } from 'meteor/meteor';
import { Depths } from '../depths.js';
import moment from 'moment';


Meteor.publish('depths.last48', function () {
  console.log("Publish last 48 Depths", Depths.find({}).count());
  return Depths.find({
      time: {
        $gte: moment().subtract(2, 'days').startOf('day').toDate()
      }
    },
    {sort: {time: 1}
  });
});


