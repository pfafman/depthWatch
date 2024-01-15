
import bb, {area, candlestick, step, bar, line, spline} from "billboard.js";
import { Depths } from '../../../api/depths/depths.js';
import { Meteor } from 'meteor/meteor';
import moment from 'moment';

import './daily.html';


const weekOldDepth    = new ReactiveVar(null);
const weekOldDay      = new ReactiveVar(null);
const currentDayDepth = new ReactiveVar(null);
const currentDay      = new ReactiveVar(null);


Template.daily.onCreated (() => {
    //console.log("daily.onCreated");
   
});

Template.daily.onRendered (() => {

    Tracker.autorun(async () => {
        
        console.log("autorun daily ...", Depths.find({}).count());

        if (Depths.find({}).count() >= 0) {

            console.log("update daily ...", Depths.find({}).count());

            const results = await Meteor.callAsync('dayDepths');

            //console.log("update daily", results.length);
            
            let now = moment();

            let times = ["times"];
            let data = ["Gallons"]
            let change = ["Gallons"]
            factor = gallonsPerInch;
            results.forEach( depth => {
                //console.log(depth);
                times.push(depth.time);
                
                let diff = gallonsInTanks(depth.exit,  depth.time) - gallonsInTanks(depth.enter, depth.time);

                data.push([
                    gallonsInTanks(depth.enter, depth.time),
                    gallonsInTanks(depth.min,   depth.time),
                    gallonsInTanks(depth.max,   depth.time),
                    gallonsInTanks(depth.exit,  depth.time)
                    ]);
                change.push(diff)

                if (weekOldDepth.get() == null) {
                    if (moment(depth.time).isAfter(now.subtract(1,'week'))) {
                        weekOldDepth.set((depth.min+depth.max)/2);
                        weekOldDay.set(depth.time);
                    }
                }

                currentDayDepth.set((depth.max+depth.min)/2);
                currentDay.set(depth.time);
            });

            var chart = bb.generate({
                data: {
                    x: "times",
                    columns: [
                        times,
                        data
                    ],
                    type: candlestick(),
                    colors: {
                        'Depth': "green"
                    },
                    labels: false
                },
                candlestick: {
                    color: {
                      down: "red"
                    },
                    width: {
                      ratio: 0.5
                    }
                },
                axis: {
                    x: {
                        type: "timeseries",
                        tick: {
                            format: "%m/%d/%y"
                        },
                        padding: {
                            left: 1,
                            right: 1
                        }
                    },
                    y2: {
                        show: true
                    }
                },
                size: {
                    height: 200
                },
                bindto: "#dailyChart"
            });
        
            var chart = bb.generate({
                data: {
                    x: "times",
                    columns: [
                        times,
                        change
                    ],
                    type: bar(),
                    colors: {
                        'Depth': "green"
                    },
                    labels: false
                },
                candlestick: {
                    color: {
                      down: "red"
                    },
                    width: {
                      ratio: 0.5
                    }
                },
                axis: {
                    x: {
                        type: "timeseries",
                        tick: {
                            format: "%m/%d/%y"
                        },
                        padding: {
                            left: 1,
                            right: 1
                        }
                    },
                    y2: {
                        show: true
                    }
                },
                size: {
                    height: 200
                },
                bindto: "#dailyChangeChart"
            });
        }
    });

});


Template.daily.helpers({
    trend() {
        if (weekOldDepth.get() != null) {
            change = currentDayDepth.get() - weekOldDepth.get();
            days = moment.duration(moment(currentDay.get()).diff(moment(weekOldDay.get()))).days();
            let trend = change/days;
            return `Trend ${trend.toFixed(0)} gallons per day`;
        } else {
            return "";
        }
    }
});
