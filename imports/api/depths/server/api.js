
import { Depths } from '../depths.js'
import { check } from 'meteor/check';
import moment from 'moment';

Api = new Restivus({
  useDefaultAuth: true,
  prettyJson: false,
});


Api.addRoute('insertDepth', {authRequired: false}, {
  post: async function() {
    
    console.log("insertDepth", this.bodyParams);

    let depth = Math.round(Number(this.bodyParams.depth)*10)/10;
    check(depth, Number);

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

