
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
            let weekAgo = moment().subtract(1,'week');
            console.log("now", now.toDate(), "last week", weekAgo.toDate());
            
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
                    if (moment(depth.time).isSameOrAfter(weekAgo)) {
                        weekOldDepth.set(depth.sum/depth.readings);
                        weekOldDay.set(depth.time);
                    }
                }

                currentDayDepth.set(depth.sum/depth.readings);
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
            let gallonsAveCurrent = gallonsInTanks(currentDayDepth.get(), currentDay.get());
            let gallonsAveWeekOld = gallonsInTanks(weekOldDepth.get(),currentDay.get(),weekOldDay.get());
            let change = gallonsAveCurrent - gallonsAveWeekOld
            console.log("Trend", change, currentDay.get(), weekOldDay.get());
            
            let days = moment.duration(moment(currentDay.get()).diff(moment(weekOldDay.get()))).days();
            console.log("Trend", days, "days", change, currentDay.get(), weekOldDay.get());
            let trend = change/days;
            let runOutDays = -gallonsInTanks(currentDayDepth.get(), currentDay.get())/trend;
            if (runOutDays > 0) {
                runOutDate = (moment().add(runOutDays, 'days')).format('MMM Do, YYYY');
                return `Week (${days.toFixed(1)} days) trend is down ${-trend.toFixed(0)} gallons per day (${gallonsAveWeekOld.toFixed(0)} ->  ${gallonsAveCurrent.toFixed(0)}).  Will last to ${runOutDate} at this rate.`;
            } else {
                return `Week (${days.toFixed(1)} days) trend is up ${trend.toFixed(0)} gallons per day.`;
            }
        } else {
            return "";
        }
    }
});
