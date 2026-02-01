
import bb, {area, candlestick, step, bar, line, spline} from "billboard.js";
import { Depths } from '../../../api/depths/depths.js';
import { Meteor } from 'meteor/meteor';
import moment from 'moment';


console.log('daily.js: imports');

import '../settings.js';
import './daily.html';

const yearOldDepth     = new ReactiveVar(null);
const yearOldDay       = new ReactiveVar(null);
const weekOldDayDepths = new ReactiveVar(null);
const currentDayDepths = new ReactiveVar(null);

console.log("daily.js: gallonsPerInch:",gallonsPerInch);

Template.daily.onCreated (() => {
    //console.log("daily.onCreated");
});

Template.daily.onRendered (() => {

    Tracker.autorun(async () => {
        
        console.log("autorun daily ...", Depths.find({}).count());

        if (Depths.find({}).count() >= 0) {


            console.log("update daily ...", await Depths.find({}).count());

            const results = await Meteor.callAsync('dayDepths', 'piCistern');
            //const results2 = await Meteor.callAsync('dayDepths', 'piCistern2');
            //const results3 = await Meteor.callAsync('dayDepths', 'piCistern3');

            //console.log("update daily", results);
            
            let now = moment();
            let weekAgo = moment().subtract(2,'weeks');
            let yearAgo = moment().subtract(1,'year');
            console.log("now", now.toDate(), "last week", weekAgo.toDate());

            let currentDepths = await Meteor.callAsync('dayDepth', now.toDate());
            let weeksOldDepths = await Meteor.callAsync('dayDepth', weekAgo.toDate());
            currentDayDepths.set(currentDepths)
            weekOldDayDepths.set(weeksOldDepths)
            console.log("Day Depths", currentDepths, weeksOldDepths)
            
            let times = ["times"];
            let data = ["Gallons"]
            let change = ["Gallons"]
            let factor = gallonsPerInch;
            results.forEach( depth => {
                //console.log(depth);
                times.push(depth.time);
                
                let diff = gallonsInTanksPressure(depth.time,  depth.exit) - gallonsInTanksPressure(depth.time, depth.enter);

                data.push([
                    gallonsInTanksPressure(depth.time, depth.enter),
                    gallonsInTanksPressure(depth.time, depth.max),
                    gallonsInTanksPressure(depth.time, depth.min),
                    gallonsInTanksPressure(depth.time, depth.exit)
                    ]);
                change.push(diff)


                if (yearOldDepth.get() == null) {
                    if (moment(depth.time).isSameOrAfter(yearAgo)) {
                        yearOldDepth.set(depth.sum/depth.readings);
                        yearOldDay.set(depth.time);
                    }
                }

            });

            var chart = bb.generate({
                title: {
                    text: "Pressure Sensor"
                },
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
        

            const resultsSonic = await Meteor.callAsync('dayDepthsSonic');

            let stimes = ["times"];
            let sdata = ["Gallons"]
            factor = gallonsPerInch;
            resultsSonic.forEach( depth => {
                //console.log(depth);
                stimes.push(depth.time);
                
                let diff = gallonsInTanks(depth.exit,  depth.time) - gallonsInTanks(depth.enter, depth.time);

                sdata.push([
                    gallonsInTanks(depth.enter, depth.time),
                    gallonsInTanks(depth.min,   depth.time),
                    gallonsInTanks(depth.max,   depth.time),
                    gallonsInTanks(depth.exit,  depth.time)
                    ]);

            });

            var chart = bb.generate({
                title: {
                    text: "UltraSonic Sensor"
                },
                data: {
                    x: "times",
                    columns: [
                        stimes,
                        sdata
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
                bindto: "#dailyChartPressure"
            });

        }
    });

});


Template.daily.helpers({
    lastYear() {
        if (yearOldDepth.get() != null) {
            let lastYearGallons = gallonsInTanksPressure( earOldDay.get(), yearOldDepth.get());
            return `Last year ${lastYearGallons} gallons`;
        }
    },

    trend() {
        if ((weekOldDayDepths.get() != null) && (currentDayDepths.get() != null)) {

            console.log("Calculate Trend");

            current = currentDayDepths.get();
            old = weekOldDayDepths.get();

            //console.log("Trend:", current, old);

            if (!current['piCistern2']) {
                current['piCistern2'] = {};
                current['piCistern2'].exit = current['piCistern3'].exit;
            }

            if (!old['piCistern2']) {
                old['piCistern2'] = {};
                old['piCistern2'].exit = old['piCistern3'].exit;
            }

            let gallonsAveCurrent = gallonsInTanksPressure(current['day'], current['piCistern'].exit, current['piCistern2'].exit, current['piCistern3'].exit);
            let gallonsAveWeekOld = gallonsInTanksPressure(old['day'], old['piCistern'].enter, old['piCistern3'].enter, old['piCistern3'].enter);
            let change = gallonsAveCurrent - gallonsAveWeekOld
            
            let days = moment.duration(moment(current['day']).diff(moment(old['day']))).days();
            console.log("Trend", days, "days", change, gallonsAveWeekOld, "->", gallonsAveCurrent, current['day'], old['day']);
            let trend = change/days;
            let runOutDays = - (gallonsAveCurrent-noAccessGallons)/trend;
            if (runOutDays > 0) {
                runOutDate = (moment().add(runOutDays, 'days')).format('MMM Do, YYYY');
                return `Two Week (${days.toFixed(1)} days) trend is down ${-trend.toFixed(0)} gallons per day (${gallonsAveWeekOld.toFixed(0)} ->  ${gallonsAveCurrent.toFixed(0)}).  Will last to ${runOutDate} at this rate.`;
            } else {
                return `Two Week (${days.toFixed(1)} days) trend is up ${trend.toFixed(0)} gallons per day.`;
            }
        } else {
            return "";
        }
    }
});
