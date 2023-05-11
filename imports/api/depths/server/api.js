
import { Depths } from '../depths.js'
import { check } from 'meteor/check';
import moment from 'moment';

Api = new Restivus({
  useDefaultAuth: true,
  prettyJson: false,
});


Api.addRoute('insertDepth', {authRequired: false}, {
  post: async function() {
    
    //console.log("insertDepth", this.bodyParams);

    check(this.bodyParams.depth, Number);
    
    let depth = Math.round(Number(this.bodyParams.depth)*10)/10;

    if ((depth > 67) || (depth <= 1)) {
      console.log("insertDepth: bad value", depth);
      return {status: 'bad value'};
    }

    if (depth < 8) {
      // Tank is maxed out
      depth = 8;
      overCapacity = true;
    } else {
      overCapacity = false;
    }

    console.log("insertDepth", depth);
    
    try {
      let lastRec = await Depths.findOneAsync({},{'sort':{'$natural':-1}});
      //console.log("lastRec", lastRec);

      if (lastRec != null) {
        console.log("insertDepth: new depth", lastRec.exit, '->', depth);
        let age = moment().diff(lastRec.time, 'hours');
        if ((age < 1) && Math.abs(depth-lastRec.exit) > .5) {
          console.log("insertDepth: large change", depth, "<>", lastRec.exit);
          return {status: 'bad value'};
        }
      }
    } catch (error) {
      console.log("insertDepth: error on last check", error);
    }

    time = moment().startOf('minute').toDate();
    let rec = await Depths.findOneAsync({'time': time});

    if (rec != null) {
      rec['exit'] = depth;
      if (depth > rec['max'] ) rec['max'] = depth;
      if (depth < rec['min'] ) rec['min'] = depth;
      if (rec['overCapacity'] == null) {
        rec['overCapacity'] = false;
      }
      rec['overCapacity'] = overCapacity || rec['overCapacity']
      delete rec['_id']
    } else {
      rec = {
        'time'         : time,
        'enter'        : depth,
        'max'          : depth,
        'min'          : depth,
        'exit'         : depth,
        'overCapacity' : overCapacity
      }
    }

    await Depths.upsertAsync({
      'time': time
    },
    {
      '$set': rec
    });

    return {status: 'ok'};
  }
})

