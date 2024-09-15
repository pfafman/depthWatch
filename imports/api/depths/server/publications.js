// All links-related publications

import { Meteor } from 'meteor/meteor';
import { Depths } from '../depths.js';
import moment from 'moment';


Meteor.publish('depths.lastDays', async function () {
  const dayCount = await Depths.countDocuments({})
  console.log("Publish last 1 days Depths", dayCount);
  return Depths.find({
      time: {
        $gte: moment().subtract(1, 'days').startOf('day').toDate()
      }
    },
    {sort: {time: 1}
  });
});


