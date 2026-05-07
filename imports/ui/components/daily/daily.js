
import bb, {area, candlestick, step, bar, line, spline} from "billboard.js";
import { Depths } from '../../../api/depths/depths.js';
import { Meteor } from 'meteor/meteor';
import moment from 'moment';


console.log('daily.js: imports');

import '../settings.js';
import './daily.html';

const yearOldGallons   = new ReactiveVar(null);
const yearOldDay       = new ReactiveVar(null);
const weekOldDayDepths = new ReactiveVar(null);
const currentDayDepths = new ReactiveVar(null);


Template.daily.onCreated (() => {
    console.log("daily.onCreated");
});

Template.daily.onRendered (() => {

    Tracker.autorun(async () => {
        
        console.log("autorun daily ...", Depths.find({}).count());

        if (Depths.find({}).count() >= 0) {

            console.log("update daily ...", await Depths.find({}).count());

            const results = await Meteor.callAsync('dayDepthsAll');
            
            let now = moment();
            let weekAgo = moment().subtract(2,'weeks');
            let yearAgo = moment().subtract(1,'year');

            let currentDepths = await Meteor.callAsync('dayDepth', now.toDate());
            let weeksOldDepths = await Meteor.callAsync('dayDepth', weekAgo.toDate());
            currentDayDepths.set(currentDepths)
            weekOldDayDepths.set(weeksOldDepths)
            
            let times = ["times"];
            let data = ["Gallons"]
            let factor = gallonsPerInch;
            let cRec = {};
            cRec.time = 0;
            results.forEach( depth => {

                if (cRec.time != depth.time) {
                    if (cRec.time != 0) {
                        // New Rec
                        times.push(cRec.time);
                        if (!cRec.piCistern3) {
                            cRec.piCistern3 = {
                                enter: undefined,
                                max: undefined,
                                min: undefined,
                                exit: undefined
                            }
                        } 
                        if (!cRec.piCistern2) {
                            cRec.piCistern2 = cRec.piCistern3;
                        }
                        data.push([
                            gallonsInTanksPressure(cRec.time, cRec.piCistern.enter, cRec.piCistern2.enter, cRec.piCistern3.enter),
                            gallonsInTanksPressure(cRec.time, cRec.piCistern.max, cRec.piCistern2.max, cRec.piCistern3.max),
                            gallonsInTanksPressure(cRec.time, cRec.piCistern.min, cRec.piCistern2.min, cRec.piCistern3.min),
                            gallonsInTanksPressure(cRec.time, cRec.piCistern.exit, cRec.piCistern2.exit, cRec.piCistern3.exit)
                            ]);

                        if (yearOldGallons.get() == null) {
                            if (moment(cRec.time).isSameOrAfter(yearAgo)) {
                                yearOldGallons.set(gallonsInTanksPressure(cRec.time, cRec.piCistern.exit, cRec.piCistern2.exit, cRec.piCistern3.exit));
                                yearOldDay.set(cRec.time);
                            }
                        }

                    }
                    cRec = {};
                    cRec.time = depth.time;
                    cRec[depth.host] = depth;
                } else {
                    cRec[depth.host] = depth;
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

            current = currentDayDepths.get();
            old = weekOldDayDepths.get();

            //console.log("Trend",current, old);

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
            //console.log("Trend", days, "days", change, gallonsAveWeekOld, "->", gallonsAveCurrent, current['day'], old['day']);
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
