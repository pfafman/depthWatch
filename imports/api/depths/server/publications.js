// All links-related publications

import { Meteor } from 'meteor/meteor';
import { Depths } from '../depths.js';
import moment from 'moment';


Meteor.publish('depths.lastDays', function () {
  console.log("Publish last 1 days Depths", Depths.find({}).count());
  return Depths.find({
      time: {
        $gte: moment().subtract(1, 'days').startOf('day').toDate()
      }
    },
    {sort: {time: 1}
  });
});


