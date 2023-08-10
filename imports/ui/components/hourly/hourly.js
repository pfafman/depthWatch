

import bb, {area, candlestick, step, gauge} from "billboard.js";
import { Depths } from '../../../api/depths/depths.js';
import { Meteor } from 'meteor/meteor';
import { ReactiveVar } from 'meteor/reactive-var';
import moment from 'moment';


import './hourly.html';


const minHeight = new ReactiveVar(null);
const maxHeight = new ReactiveVar(null);



Template.hourly.onCreated (() => {
    console.log("hourly.onCreated");
    Meteor.subscribe('depths.last48');
});


Template.hourly.onRendered (() => {

    Tracker.autorun(async () => {
        console.log(`hourly: Found ${Depths.find({}).count()} measurements`);

        if (Depths.find({}).count() > 0) {

            current = Depths.findOne({},{ sort: {time: -1}, limit:1 })

            const range = await Meteor.callAsync('depthRange');

            console.log("depth range", range[0].min, range[0].max);

            if (current != null) {
                
                const percent = 100*(newMaxDepth - current.exit)/tankDepth;
                const min = 100*(maxDepth - range[0].max)/tankDepth;
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

        console.log("call hourly...");
        const results = await Meteor.callAsync('hourDepths');
        console.log("update hourly", results.length);
        
        let times = ["times"];
        let data = ["Gallons"];
        factor = gallonsPerInch; // capacity / newMaxDepth;
        results.forEach( depth => {
            //console.log(depth);
            times.push(depth.time);
            if (moment(depth.time).isBefore(moment("2023-05-10"))) {
                theMaxDepth = maxDepth;
            } else {
                theMaxDepth = newMaxDepth;
            }

            data.push([
                Math.round((theMaxDepth - depth.enter) * factor), 
                Math.round((theMaxDepth - depth.min)   * factor),
                Math.round((theMaxDepth - depth.max )  * factor),
                Math.round((theMaxDepth - depth.exit ) * factor)
                ]);
        });

        console.log("Generate Chart");
        var chart = bb.generate({
            data: {
                x: "times",
                columns: [
                    times,
                    data
                ],
                type: candlestick(),       // for ESM specify as: candlestick()
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
    
    });
});
    




Template.hourly.helpers({
    
    depths() {
        return Depths.find({})
    },


    haveCurrentDepth() {
        const current = Depths.findOne({},{ sort: {time: -1}, limit:1 });
        return (current != null);
    },


    currentDepth() {
        const current = Depths.findOne({},{ sort: {time: -1}, limit:1 });
        if (current != null) {
            //const percent = 100*(maxDepth - current.exit)/maxDepth;
            return current.exit.toFixed(1);
        } else {
            return "N/A";
        }
    },

    currentReading() {
        const current = Depths.findOne({},{ sort: {time: -1}, limit:1 });
        if ((current != null) && (current.overCapacity)) {
            return current.minReading.toFixed(1);
        } else {
            return "";
        }
    },

    currentHeight() {
        const current = Depths.findOne({},{ sort: {time: -1}, limit:1 });
        if (current != null) {
            const height = (newMaxDepth - current.exit);
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
        const current = Depths.findOne({},{ sort: {time: -1}, limit:1 });
        if (current != null) {
            time = moment(current.time).format('llll');
            return `at ${time}`;
        } else {
            return "";
        }
    },

    gallons() {
        const current = Depths.findOne({},{ sort: {time: -1}, limit:1 });
        if (current != null) {
            const gallons =  (newMaxDepth - current.exit) * gallonsPerInch;
            return gallons.toLocaleString('us', {maximumFractionDigits: 0})
        } else {
            return "";
        }
    },

    overCapacity() {
        const current = Depths.findOne({},{ sort: {time: -1}, limit:1 });
        if (current != null) {
            return current.overCapacity;
        } else {
            return false;
        }
    },

    change() {
        const current = Depths.findOne({},{ sort: {time: -1}, limit:1 });
        if (current != null) {
            const oldest  = Depths.findOne({time: {$gte: moment(current.time).subtract(48, 'hours').toDate()}},{ sort: {time: 1}, limit:1 });
            if ((current != null) && (oldest != null)) {
                let gallons =  - (current.exit - oldest.exit) * gallonsPerInch;
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

    change4() {
        const current = Depths.findOne({},{ sort: {time: -1}, limit:1 });
        if (current != null) {
            const oldest  = Depths.findOne({time: {$gte: moment(current.time).subtract(4, 'hours').toDate()}},{ sort: {time: 1}, limit:1 });
            if ((current != null) && (oldest != null)) {
                let gallons =  - (current.exit - oldest.exit) * gallonsPerInch;
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



