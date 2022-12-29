
import bb, {area, candlestick, step} from "billboard.js";
import { Depths } from '../../../api/depths/depths.js';
import { Meteor } from 'meteor/meteor';
import moment from 'moment';

import './daily.html';


Template.daily.onCreated (() => {
    //console.log("daily.onCreated");
    //Meteor.subscribe('depths.last48');
});

Template.daily.onRendered (() => {

    Tracker.autorun(async () => {
        
        if (Depths.find({}).count() > 0) {

            //console.log("update daily ...", Depths.find({}).count());

            const results = await Meteor.callAsync('dayDepths');

            //console.log("update daily", results.length);
            
            let times = ["times"];
            let data = ["Depth"]
            results.forEach( depth => {
                //console.log(depth);
                times.push(depth.time);
                data.push([
                    Math.round((maxDepth - depth.enter) * 100)/100, 
                    Math.round((maxDepth - depth.min)   * 100)/100, 
                    Math.round((maxDepth - depth.max ) * 100)/100, 
                    Math.round((maxDepth - depth.exit ) * 100)/100
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
                            format: "%m/%d/%y"
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
                bindto: "#dailyChart"
            });
        
        }
    });

});


