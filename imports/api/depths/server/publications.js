// All links-related publications

import { Meteor } from 'meteor/meteor';
import { Depths } from '../depths.js';
import moment from 'moment';


Meteor.publish('depths.last5Days', function () {
  console.log("Publish last 5 days Depths", Depths.find({}).count());
  return Depths.find({
      time: {
        $gte: moment().subtract(5, 'days').startOf('day').toDate()
      }
    },
    {sort: {time: 1}
  });
});


