

import bb, {area, candlestick, step, gauge} from "billboard.js";
import { Depths } from '../../../api/depths/depths.js';
import { Meteor } from 'meteor/meteor';
import moment from 'moment';

import './hourly.html';

Template.hourly.onCreated (() => {
    //console.log("hourly.onCreated");
    Meteor.subscribe('depths.last48');
});


Template.hourly.onRendered (() => {

    Tracker.autorun(async () => {
        
        if (Depths.find({}).count() > 0) {

            current = Depths.findOne({},{ sort: {time: -1}, limit:1 })

            if (current != null) {
                const percent = 100*(maxDepth - current.exit)/maxDepth;

                var gaugeChart = bb.generate({
                  data: {
                    columns: [
                        ["Level", percent]
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
                  gauge: {},
                  color: {
                    pattern: [
                      "#FF0000",
                      "#F97600",
                      "#F6C600",
                      "#60B044"
                    ],
                    threshold: {
                      values: [
                        25,
                        50,
                        75,
                        100
                      ]
                    }
                  },
                  size: {
                    height: 150
                  },
                  bindto: "#gaugeChart"
                });
            }


            //console.log("update daily ...", Depths.find({}).count());

            const results = await Meteor.callAsync('hourDepths');

            //console.log("update daily", results.length);
            
            let times = ["times"];
            let data = ["Depth"]
            results.forEach( depth => {
                //console.log(depth);
                times.push(depth.time);
                data.push([
                    maxDepth - depth.enter, 
                    maxDepth - depth.min, 
                    maxDepth - depth.max, 
                    maxDepth - depth.exit
                    ]);
            });

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
            "N/A";
        }
    }
});



