
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

    if ((depth > 57) || (depth < 0)) {
      console.log("insertDepth: bad value", depth);
      return {status: 'bad value'};
    }

    try {
      let lastRec = await Depths.findOneAsync({},{'sort':{'$natural':-1}});
      //console.log("lastRec", lastRec);

      if (lastRec != null) {
        console.log("insertDepth: new depth", lastRec.exit, '->', depth);
        if (Math.abs(depth-lastRec.exit) > .5) {
          console.log("insertDepth: bad value", depth, "<>", lastRec.exit);
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
      delete rec['_id']
    } else {
      rec = {
        'time'  : time,
        'enter' : depth,
        'max'   : depth,
        'min'   : depth,
        'exit'  : depth
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

