

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
        console.log(`hourly: Found ${Depths.find({}).count()} measurements`)
        if (Depths.find({}).count() > 0) {

            current = Depths.findOne({},{ sort: {time: -1}, limit:1 })

            const range = await Meteor.callAsync('depthRange');

            console.log("depth range", range[0].min, range[0].max);

            if (current != null) {
                
                const percent = 100*(maxDepth - current.exit)/maxDepth;
                const min = 100*(maxDepth - range[0].max)/maxDepth;
                const max = 100*(maxDepth - range[0].min)/maxDepth;
                minHeight.set(maxDepth - range[0].max);
                maxHeight.set(maxDepth - range[0].min);

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


            //console.log("update daily ...", Depths.find({}).count());

            const results = await Meteor.callAsync('hourDepths');
            //const results = Depths.find({}, {sort: {time: 1}});

            console.log("update daily", results.length);
            
            let times = ["times"];
            let data = ["Gallons"];
            factor = capacity / maxDepth;
            results.forEach( depth => {
                //console.log(depth);
                times.push(depth.time);
                data.push([
                    Math.round((maxDepth - depth.enter) * factor), 
                    Math.round((maxDepth - depth.min)   * factor),
                    Math.round((maxDepth - depth.max )  * factor),
                    Math.round((maxDepth - depth.exit ) * factor)
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
                    labels: true
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
        
        }
    });    

});


Template.hourly.helpers({
    
    depths() {
        return Depths.find({})
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

    currentHeight() {
        const current = Depths.findOne({},{ sort: {time: -1}, limit:1 });
        if (current != null) {
            const height = (maxDepth - current.exit);
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
            //const percent = 100*(maxDepth - current.exit)/maxDepth;
            //const age = moment.duration(moment().diff(current.time)).humanize()
            time = moment(current.time).format('llll');
            return `at ${time}`;
        } else {
            return "";
        }
    },

    gallons() {
        const current = Depths.findOne({},{ sort: {time: -1}, limit:1 });
        if (current != null) {
            const gallons =  (maxDepth - current.exit)/maxDepth * capacity;
            return gallons.toLocaleString('us', {maximumFractionDigits: 0})
        } else {
            return "";
        }
    },

    change() {
        const current = Depths.findOne({},{ sort: {time: -1}, limit:1 });
        if (current != null) {
            const oldest  = Depths.findOne({time: {$gte: moment(current.time).subtract(48, 'hours').toDate()}},{ sort: {time: 1}, limit:1 });
            if ((current != null) && (oldest != null)) {
                //console.log(`${maxDepth - current.exit} - ${maxDepth - oldest.exit}`, (current.exit - oldest.exit)/maxDepth * capacity);
                let gallons =  - (current.exit - oldest.exit)/maxDepth * capacity;
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

    capacity() {
        return capacity.toLocaleString('us', {maximumFractionDigits: 0})
    }
});



