

import bb, {area, candlestick, step, gauge, spline, line} from "billboard.js";
import { Depths } from '../../../api/depths/depths.js';
import { Meteor } from 'meteor/meteor';
import { ReactiveVar } from 'meteor/reactive-var';
import moment from 'moment';


import './hourly.html';

const minHeight = new ReactiveVar(null);
const maxHeight = new ReactiveVar(null);

const daysOld   = new ReactiveVar(null);

let hourDepthsRunning  = false;
let hourDepths2Running = false;


Template.hourly.onCreated (() => {
    console.log("hourly.onCreated");
    Meteor.subscribe('depths.lastDays');
});


Template.hourly.onRendered (() => {

    Tracker.autorun(async () => {
        console.log(`hourly: Found ${Depths.find({}).count()} measurements`);

        if (Depths.find({}).count() > 0) {

            current = Depths.findOne({type: 'pressure'},{ sort: {time: -1}, limit:1 })

            const range = await Meteor.callAsync('depthRange');

            console.log("depth range", range[0].min, range[0].max);

            if (current != null) {
                
                const percent = 100*(current.exit)/tankDepth;
                const min = 100*(newMaxDepth - range[0].max)/tankDepth;
                const max = 100*(newMaxDepth - range[0].min)/tankDepth;
                minHeight.set(newMaxDepth - range[0].max);
                maxHeight.set(newMaxDepth - range[0].min);

                var gaugeChart = bb.generate({
                  data: {
                    columns: [
                        ["min",   min],
                        ["Level", percent],
                        ["max",   max]
                    ],
                    type: gauge(), // for ESM specify as: gauge()
                    onclick: function (d, i) {
                        console.log("onclick", d, i);
                    },
                    onover: function (d, i) {
                        console.log("onover", d, i);
                    },
                    onout: function (d, i) {
                        console.log("onout", d, i);
                    }
                  },
                  gauge: {
                    type: "multi",
                    arcs: {
                      minWidth: 40
                    }
                  },
                  color: {
                    pattern: [
                      "#FF0000",
                      "#FFFF00",
                      "#FFA500",
                      "#0055B3",
                      "#00FF00"
                    ],
                    threshold: {
                      values: [
                        15,
                        25,
                        50,
                        75,
                        90
                      ]
                    }
                  },
                  size: {
                    height: 200
                  },
                  bindto: "#gaugeChart"
                });
            }
        }
    });

    Tracker.autorun(async () => {

        if ((Depths.find({type: 'sonic'}).count() > 0) && (!hourDepthsRunning)) {
            console.log("call hourly...");
            hourDepthsRunning = true;
            const results = await Meteor.callAsync('hourDepths');
            console.log("update hourly", results.length, results[0]);

            //daysOld.set(results[0]);
            
            let times = ["times"];
            let data = ["Gallons"];
            let averages = ["Average"];
            results.forEach( depth => {

                //console.log(depth);
                times.push(depth.time);

                data.push([
                    gallonsInTanks(depth.enter, depth.time),
                    gallonsInTanks(depth.min,   depth.time),
                    gallonsInTanks(depth.max,   depth.time),
                    gallonsInTanks(depth.exit,  depth.time)
                    ]);
                averages.push(gallonsInTanks(depth.sum/depth.readings, depth.time));
            });

            console.log("Generate Pressure Sensor Chart");
            var chart = bb.generate({
                title: {
                    text: "UltraSonic Sensor"
                },
                data: {
                    x: "times",
                    columns: [
                        times,
                        data
                        //,
                        //averages
                    ],
                    type: candlestick(),       // for ESM specify as: candlestick()
                    // types: {
                    //     Average: spline()
                    // },
                    colors: {
                        'Average': "green"
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
                            format: "%I:00 %p"
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
                bindto: "#hourlyChart"
            });
            hourDepthsRunning = false;
        }
    
    });

    Tracker.autorun(async () => {

        if ((Depths.find({type: 'pressure'}).count() > 0) && (!hourDepths2Running)) {
            console.log("call hourly...");
            hourDepths2Running = true;
            const results = await Meteor.callAsync('hourDepthsPressure');
            console.log("update pressure hourly", results.length, results[0]);

            daysOld.set(results[0]);
            
            let times = ["times"];
            let data = ["Gallons"];
            let averages = ["Average"];
            results.forEach( depth => {

                //console.log(depth);
                times.push(depth.time);

                data.push([
                    gallonsInTanksPressure(depth.enter, depth.time),
                    gallonsInTanksPressure(depth.min,   depth.time),
                    gallonsInTanksPressure(depth.max,   depth.time),
                    gallonsInTanksPressure(depth.exit,  depth.time)
                    ]);
                averages.push(gallonsInTanksPressure(depth.sum/depth.readings, depth.time));
            });

            console.log("Generate UltraSonic Sensor Chart");
            var chart = bb.generate({
                title: {
                    text: "Pressure Sensor"
                },
                data: {
                    x: "times",
                    columns: [
                        times,
                        data
                        //,
                        //averages
                    ],
                    type: candlestick(),       // for ESM specify as: candlestick()
                    // types: {
                    //     Average: spline()
                    // },
                    colors: {
                        'Average': "green"
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
                            format: "%I:00 %p"
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
                bindto: "#hourlySonicChart"
            });
            hourDepths2Running = false;
        }
    
    });
});
    


Template.hourly.helpers({
    
    depths() {
        return Depths.find({})
    },


    haveCurrentDepth() {
        const current = Depths.findOne({type: 'pressure'},{ sort: {time: -1}, limit:1 });
        return (current != null);
    },


    currentDepth() {
        const current = Depths.findOne({type: 'pressure'},{ sort: {time: -1}, limit:1 });
        if (current != null) {
            return current.exit.toFixed(2);
        } else {
            return "N/A";
        }
    },

    currentDepthSonic() {
        const current = Depths.findOne({type: 'sonic'},{ sort: {time: -1}, limit:1 });
        if (current != null) {
            return current.exit.toFixed(2);
        } else {
            return "N/A";
        }
    },

    currentReadingSonic() {
        const current = Depths.findOne({type: 'sonic'},{ sort: {time: -1}, limit:1 });
        if ((current != null) && (current.overCapacity)) {
            return current.minReading.toFixed(1);
        } else {
            return "";
        }
    },

    currentReadingPressure() {
        const current = Depths.findOne({type: 'pressure'},{ sort: {time: -1}, limit:1 });
        if ((current != null) && (current.overCapacity)) {
            return current.minReading.toFixed(1);
        } else {
            return "";
        }
    },


    currentHeight() {
        const current = Depths.findOne({type: 'sonic'},{ sort: {time: -1}, limit:1 });
        if (current != null) {
            const height = 67 - current.exit;
            return height.toFixed(1);
        } else {
            return "N/A";
        }
    },



    minHeight() {
        return  minHeight.get().toFixed(1);
    },

    maxHeight() {
        return  maxHeight.get().toFixed(1);
    },

    haveRange() {
        return ((maxHeight.get() != null) && (minHeight.get() != null))
    },


    age() {
        const current = Depths.findOne({type: 'pressure'},{ sort: {time: -1}, limit:1 });
        if (current != null) {
            time = moment(current.time).format('llll');
            return `at ${time}`;
        } else {
            return "";
        }
    },

    gallons() {
        const current = Depths.findOne({type: 'pressure'},{ sort: {time: -1}, limit:1 });
        if (current != null) {
            const gallons =  gallonsInTanksPressure(current.exit, current.time);
            return gallons.toLocaleString('us', {maximumFractionDigits: 0})
        } else {
            return "";
        }
    },

    down() {
        const current = Depths.findOne({type: 'pressure'},{ sort: {time: -1}, limit:1 });
        if (current != null) {
            const down =  capacity - gallonsInTanksPressure(current.exit, current.time);
            return down.toLocaleString('us', {maximumFractionDigits: 0})
        } else {
            return "";
        }
    },


    isDown() {
        const current = Depths.findOne({type: 'pressure'},{ sort: {time: -1}, limit:1 });
        if ((current != null)  && (gallonsInTanksPressure(current.exit, current.time) < capacity)) {
            return true;
        } else {
            return false;
        }
    },


    overCapacity() {
        const current = Depths.findOne({type: 'pressure'},{ sort: {time: -1}, limit:1 });
        if (current != null) {
            return current.overCapacity;
        } else {
            return false;
        }
    },

    change1() {
        const current = Depths.findOne({type: 'pressure'},{ sort: {time: -1}, limit:1 });
        if (current != null) {
            const oldest = daysOld.get();
            
            if ((current != null) && (oldest != null)) {
                console.log("change", oldest.exit, "->", current.exit, gallonsInTanks(oldest.exit, oldest.time), '->', gallonsInTanks(current.exit, current.time));
                let gallons =  gallonsInTanksPressure(current.exit, current.time) - gallonsInTanksPressure(oldest.exit, oldest.time);
                const duration = moment.duration(moment(current.time).diff(moment(oldest.time))).humanize();
                if (gallons < 0) {
                    trend = "Down";
                    gallons = - gallons;
                } else {
                    trend = "Up";
                }
                return `${trend} ${gallons.toFixed(1)} gallons in ${duration}`;
            } else {
                return "";
            }
        } else {
            return "";
        }
    },

    change2() {
        const current = Depths.findOne({type: 'pressure'},{ sort: {time: -1}, limit:1 });
        if (current != null) {
            const oldest  = Depths.findOne({type: 'pressure', time: {$gte: moment(current.time).subtract(6, 'hours').toDate()}},{ sort: {time: 1}, limit:1 });
            if ((current != null) && (oldest != null)) {
                console.log("change4", oldest.exit, "->", current.exit);
                let gallons =  gallonsInTanksPressure(current.exit, current.time) - gallonsInTanksPressure(oldest.exit, oldest.time); 
                const duration = moment.duration(moment(current.time).diff(moment(oldest.time))).humanize();
                if (gallons < 0) {
                    trend = "Down";
                    gallons = - gallons;
                } else {
                    trend = "Up";
                }
                let gpm = gallons / moment(current.time).diff(moment(oldest.time), 'minutes');
                return `${trend} ${gallons.toFixed(1)} gallons in ${duration} (${gpm.toFixed(1)} GPM)`;
            } else {
                return "";
            }
        } else {
            return "";
        }
    },

    capacity() {
        return capacity.toLocaleString('us', {maximumFractionDigits: 0})
    }
});



