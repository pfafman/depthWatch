

import bb, {area, candlestick, step} from "billboard.js";
import { Depths } from '../../../api/depths/depths.js';
import { Meteor } from 'meteor/meteor';
import moment from 'moment';

import './hourly.html';

Template.hourly.onCreated (() => {
    console.log("hourly.onCreated");
    Meteor.subscribe('depths.last48');
});


Template.hourly.onRendered (() => {

    Tracker.autorun(() => {
        console.log("Hourly Have Depths", Depths.find({}).count());
        select = {
            time: {
                $gte: moment().subtract(48,'hours').toDate()
            }
        };
        if (Depths.find(select).count() > 0) {
            let times = ["times"];
            let data = ["Depth"]
            Depths.find(select).forEach( depth => {
                //console.log(depth)
                times.push(depth.time);
                data.push([depth.enter, depth.max, depth.min, depth.exit]);
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
                            format: "%H:%M"
                        },
                        padding: {
                            left: 1,
                            right: 1
                        }
                    }
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
        current = Depths.findOne({},{ sort: {time: -1}, limit:1 })
        if (current != null) {
            return current.exit.toFixed(1);
        } else {
            "N/A";
        }
    }
});



