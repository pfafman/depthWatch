
import { Depths } from '../depths.js'
import { check } from 'meteor/check';
import moment from 'moment';

//console.log("API Restivus:", Restivus);

const Api = new Restivus({
  useDefaultAuth: true,
  prettyJson: false,
});

//console.log("API:", Api);

Api.addRoute('insertDepth', {authRequired: false}, {
  post: async function() {
    
    //console.log("insertDepth", this.bodyParams);

    check(this.bodyParams.depth, Number);
    
    let depth = Math.round(Number(this.bodyParams.depth)*100.0)/100;
    let reading = depth;

    if ((depth > 70) || (depth <= 0)) {
      console.log("insertDepth: bad value", depth);
      console.log('Return bad value ...');
      console.log("");
      return {status: 'bad value'};
    }

    let overCapacity = false;
    if (depth < 8) {
      // Tank is maxed out
      console.log("insertDepth: tank is at max", depth);
      depth = 8;
      overCapacity = true;
    }

    console.log("insertDepth", depth);
    
    try {
      let lastRec = await Depths.findOneAsync({'type': 'sonic'},{'sort':{'time':-1}});
      //console.log("lastRec", lastRec);

      if (lastRec != null) {
        console.log("insertDepth: new depth", lastRec.exit, '->', depth);
        let age = moment().diff(lastRec.time, 'minutes');
        if ((age < 1) && Math.abs(depth-lastRec.exit) > 1) {   // If less than 1 minute and change more than an inch skip load!!!
          console.log("insertDepth: large change", depth, "<>", lastRec.exit);
          console.log('Return bad value ...');
          console.log("");
          return {status: 'bad value'};
        }
      }
    } catch (error) {
      console.log("insertDepth: error on last check", error);
    }

    const time = moment().startOf('minute').toDate();
    let rec = await Depths.findOneAsync({'time': time, 'type': 'sonic'});

    if (rec != null) {
      rec['exit'] = depth;
      if (depth > rec['max'] ) rec['max'] = depth;
      if (depth < rec['min'] ) rec['min'] = depth;
      if (reading < rec['minReading'] ) rec['minReading'] = reading;
      rec['sum'] += depth;
      rec['readings']++;
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
        'minReading'   : reading,
        'exit'         : depth,
        'sum'          : depth,
        'readings'     : 1,
        'overCapacity' : overCapacity,
        'type'         : 'sonic'
      }
    }

    await Depths.upsertAsync({
      'time': time,
      'type': 'sonic'
    },
    {
      '$set': rec
    });

    console.log("ok");
    console.log("");
    return {status: 'ok'};
  }
});


Api.addRoute('insertPressureDepth', {authRequired: false}, {
  post: async function() {
    
    console.log("insertPressureDepth: post ->", this.bodyParams);

    check(this.bodyParams.depth, Number);
    
    let depth = Math.round(Number(this.bodyParams.depth)*100.0)/100;
    let host = this.bodyParams.host;
    let reading = depth;

    if ((depth > 80) || (depth <= 0)) {
      console.log("insertPressureDepth: bad value", depth);
      console.log('Return bad value ...');
      console.log("");
      return {status: 'bad value'};
    }

    let overFlow = false;
    if (depth > 68) {
      overFlow = true;
    }

    let overCapacity = false;
    if (depth > 59) {
      // Tank is maxed out
      console.log("insertPressureDepth: tank is at max", depth);
      depth = 59;
      overCapacity = true;
    }

    
    try {
      let lastRec = await Depths.findOneAsync({'type':'pressure', 'host':host},{'sort':{'time':-1}});

      if (lastRec != null) {
        console.log("insertPressureDepth: new depth", lastRec.exit, '->', depth);
        let age = moment().diff(lastRec.time, 'minutes');
        if ((age < 1) && Math.abs(depth-lastRec.exit) > 1) {   // If less than 1 minute and change more than an inch skip load!!!
          console.log("insertPressureDepth: large change", depth, "<>", lastRec.exit);
          console.log('Return bad value ...');
          console.log("");
          return {status: 'bad value'};
        }
      }
    } catch (error) {
      console.log("insertPressureDepth: error on last check", error);
    }

    const time = moment().startOf('minute').toDate();
    let rec = await Depths.findOneAsync({'time': time, 'type':'pressure', 'host':host});
    console.log("insertPressureDepth find current rec", time, host, rec.depth);

    if (rec != null) {
      rec['exit'] = depth;
      if (depth > rec['max'] ) rec['max'] = depth;
      if (depth < rec['min'] ) rec['min'] = depth;
      if (reading < rec['minReading'] ) rec['minReading'] = reading;
      rec['sum'] += depth;
      rec['readings']++;
      if (rec['overCapacity'] == null) {
        rec['overCapacity'] = false;
      }
      rec['overCapacity'] = overCapacity || rec['overCapacity']
      if (rec['overFlow'] == null) {
        rec['overFlow'] = false;
      }
      rec['overFlow'] = overFlow || rec['overFlow']
      delete rec['_id']
      console.log("insertPressureDepth: update rec", host, time, depth);
    } else {
      console.log("insertPressureDepth: new    rec", host, time, depth);
      rec = {
        'host'         : host,
        'time'         : time,
        'enter'        : depth,
        'max'          : depth,
        'min'          : depth,
        'minReading'   : reading,
        'exit'         : depth,
        'sum'          : depth,
        'readings'     : 1,
        'overCapacity' : overCapacity,
        'overFlow'     : overFlow,
        'type'         : 'pressure'
      }
    }

    await Depths.upsertAsync({
      'host': host,
      'time': time,
      'type': 'pressure'
    },
    {
      '$set': rec
    });

    console.log("ok");
    console.log("");
    return {status: 'ok'};
  }
});

