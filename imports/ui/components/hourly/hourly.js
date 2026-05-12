

import bb, {area, candlestick, step, gauge, spline, line} from "billboard.js";
import { Depths } from '../../../api/depths/depths.js';
import { Meteor } from 'meteor/meteor';
import { ReactiveVar } from 'meteor/reactive-var';
import moment from 'moment';


import './hourly.html';

const minHeight = new ReactiveVar(null);
const maxHeight = new ReactiveVar(null);

const sixHourDepthsData = new ReactiveVar(null);
const sixDayDepthsData = new ReactiveVar(null);

let hourDepthsRunning  = false;
let hourDepths1Running = false;
let hourDepths2Running = false;
let hourDepths3Running = false;
let hourDepths4Running = false;

let DO_SONIC = false

Template.hourly.onCreated (() => {
    console.log("hourly.onCreated");
    Meteor.subscribe('depths.lastDays');
});


Template.hourly.onRendered (() => {

    Tracker.autorun(async () => {
        console.log(`hourly: Found ${Depths.find({}).count()} measurements`);

        try {
            if (Depths.find({}).count() > 0) {

                let sixHourData = await Meteor.callAsync('hourDepth', moment().subtract(6,'hours').startOf('hour').toDate());
                sixHourDepthsData.set(sixHourData)

                let sixDayData = await Meteor.callAsync('hourDepth', moment().subtract(6,'days').startOf('hour').toDate());
                sixDayDepthsData.set(sixDayData)

                current = Depths.findOne({type: 'pressure', host: 'piCistern'},{ sort: {time: -1}, limit:1 })
                current2 = Depths.findOne({type: 'pressure', host: 'piCistern2'},{ sort: {time: -1}, limit:1 })
                current3 = Depths.findOne({type: 'pressure', host: 'piCistern3'},{ sort: {time: -1}, limit:1 })
                
                const range = await Meteor.callAsync('depthRange');

                if ((current != null) && (current2 != null) && (current3 != null)) {
                    
                    // console.log("Gauge Chart has values", current, current2, current3);
                        
                    if ((current.exit != null) && (current2.exit != null) && (current3.exit != null)) {
                        
                        //console.log("Gauge Chart has values", current.time, current.exit, current2.exit, current3,exit, capacity);
                        
                        const percent = 100*gallonsInTanksPressure(current.time, current.exit, current2.exit, current3.exit)/capacity;
                        const min = 100*gallonsInTanksPressure(current.time, newMaxDepth - range[0].max)/capacity;
                        const max = 100*gallonsInTanksPressure(current.time, newMaxDepth - range[0].min)/capacity;
                        minHeight.set(newMaxDepth - range[0].max);
                        maxHeight.set(newMaxDepth - range[0].min);

                        console.log("Gauge Chart has values", percent, min, max, range[0]);

                        var gaugeChart = bb.generate({
                          data: {
                            columns: [
                                ["Level", percent]
                            ],
                            type: gauge(), // for ESM specify as: gauge()
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
                    } else {
                        console.log("Gauge Chart: Bad Values !!!");
                    }
                }
            }
        } catch (error) {
            console.error("Gauge Chart Error:", error);
        }
    });


    Tracker.autorun(async () => {

        if (DO_SONIC && (Depths.find({type: 'sonic'}).count() > 0) && (!hourDepthsRunning)) {
            console.log("call sonic hourly...");
            hourDepthsRunning = true;
            const results = await Meteor.callAsync('hourDepthsSonic');
            
            let times = ["times"];
            let data = ["Gallons"];
            let averages = ["Average"];
            results.forEach( depth => {

                times.push(depth.time);

                data.push([
                    gallonsInTanks(depth.enter, depth.time),
                    gallonsInTanks(depth.min,   depth.time),
                    gallonsInTanks(depth.max,   depth.time),
                    gallonsInTanks(depth.exit,  depth.time)
                    ]);
                averages.push(gallonsInTanks(depth.sum/depth.readings, depth.time));
            });

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
                            format: "%a %I:00 %p"
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
            hourDepthsRunning = false;
        }
    
    });

    Tracker.autorun(async () => {

        if ((Depths.find({type: 'pressure', host: 'piCistern'}).count() > 0) && (!hourDepths1Running)) {
            console.log("call pressure hourly...");
            hourDepths1Running = true;
            const results = await Meteor.callAsync('hourDepthsAll');
            
            let times = ["times"];
            let data = ["Gallons"];
            let cRec = {};
            cRec.time = 0;
            results.forEach( depth => {

                if (cRec.time != depth.time) {
                    if (cRec.time != 0) {
                        // New Rec
                        times.push(cRec.time);

                        if (!cRec.piCistern2) {
                            cRec.piCistern2 = cRec.piCistern3;
                        }
                        data.push([
                            gallonsInTanksPressure(cRec.time, cRec.piCistern.enter, cRec.piCistern2.enter, cRec.piCistern3.enter),
                            gallonsInTanksPressure(cRec.time, cRec.piCistern.max, cRec.piCistern2.max, cRec.piCistern3.max),
                            gallonsInTanksPressure(cRec.time, cRec.piCistern.min, cRec.piCistern2.min, cRec.piCistern3.min),
                            gallonsInTanksPressure(cRec.time, cRec.piCistern.exit, cRec.piCistern2.exit, cRec.piCistern3.exit)
                            ]);                
                    }
                    cRec = {};
                    cRec.time = depth.time;
                    cRec[depth.host] = depth;
                } else {
                    cRec[depth.host] = depth;
                }

            });

            console.log("Generate Pressure Sensor Chart");
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
                    type: candlestick(),       // for ESM specify as: candlestick()
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
                            format: "%a %I:00 %p"
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
                bindto: "#hourlyPressureChart"
            });
            hourDepths1Running = false;
        }
    
    });

    Tracker.autorun(async () => {

        if ((Depths.find({type: 'pressure', host: 'piCistern2'}).count() > 0) && (!hourDepths2Running)) {
            console.log("call hourly cistern2 depths...");
            hourDepths2Running = true;
            const results = await Meteor.callAsync('hourDepths', 'piCistern2');
            
            let times = ["times"];
            let data = ["Depth"];
            let averages = ["Average"];
            results.forEach( depth => {

                times.push(depth.time);

                data.push([
                    depth.enter,
                    depth.max,
                    depth.min,
                    depth.exit
                    ]);
                averages.push(depth.sum/depth.readings);
            });

            console.log("Generate Tank2 Depth Chart");
            var chart = bb.generate({
                title: {
                    text: "Tank 2 Depth"
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
                            format: "%a %I:00 %p"
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
                bindto: "#hourlyTank2Chart"
            });
            hourDepths2Running = false;
        }
    
    });

    Tracker.autorun(async () => {

        if ((Depths.find({type: 'pressure', host: 'piCistern3'}).count() > 0) && (!hourDepths3Running)) {
            console.log("call hourly cistern3 depths ...");
            hourDepths3Running = true;
            const results = await Meteor.callAsync('hourDepths', 'piCistern3');
            
            let times = ["times"];
            let data = ["Depth"];
            let averages = ["Average"];
            results.forEach( depth => {

                times.push(depth.time);

                data.push([
                    depth.enter,
                    depth.max,
                    depth.min,
                    depth.exit
                    ]);
                averages.push(depth.sum/depth.readings);
            });

            console.log("Generate Tank3 Depth Chart");
            var chart = bb.generate({
                title: {
                    text: "Tank 3 Depth"
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
                            format: "%a %I:00 %p"
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
                bindto: "#hourlyTank3Chart"
            });
            hourDepths3Running = false;
        }
    
    });

    Tracker.autorun(async () => {

        if ((Depths.find({type: 'pressure', host: 'piCistern'}).count() > 0) && (!hourDepths4Running)) {
            console.log("call hourly cistern depths ...");
            hourDepths4Running = true;
            const results = await Meteor.callAsync('hourDepths', 'piCistern');
            
            let times = ["times"];
            let data = ["Depth"];
            let averages = ["Average"];
            results.forEach( depth => {

                times.push(depth.time);

                data.push([
                    depth.enter,
                    depth.max,
                    depth.min,
                    depth.exit
                    ]);
                averages.push(depth.sum/depth.readings);
            });

            console.log("Generate Tank1 Depth Chart");
            var chart = bb.generate({
                title: {
                    text: "Tank 1 Depth"
                },
                data: {
                    x: "times",
                    columns: [
                        times,
                        data
                    ],
                    type: candlestick(),       // for ESM specify as: candlestick()
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
                            format: "%a %I:00 %p"
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
                bindto: "#hourlyTank1Chart"
            });
            hourDepths4Running = false;
        }
    
    });
});
    


Template.hourly.helpers({
    
    depths() {
        return Depths.find({})
    },


    tankDepth() {
        return (tankDepth);
    },

    haveCurrentDepth() {
        const current = Depths.findOne({type: 'pressure', host: 'piCistern'},{ sort: {time: -1}, limit:1 });
        return (current != null);
    },


    currentDepth() {
        const current = Depths.findOne({type: 'pressure', host: 'piCistern'},{ sort: {time: -1}, limit:1 });
        if (current != null) {
            return current.exit.toFixed(2);
        } else {
            return "N/A";
        }
    },

    currentDepth2() {
        const current = Depths.findOne({type: 'pressure', host: 'piCistern2'},{ sort: {time: -1}, limit:1 });
        if (current != null) {
            return current.exit.toFixed(2);
        } else {
            return "N/A";
        }
    },

    currentDepth3() {
        const current = Depths.findOne({type: 'pressure', host: 'piCistern3'},{ sort: {time: -1}, limit:1 });
        if (current != null) {
            return current.exit.toFixed(2);
        } else {
            return "N/A";
        }
    },

    currentDown() {
        const current = Depths.findOne({type: 'pressure', host: 'piCistern'},{ sort: {time: -1}, limit:1 });
        if (current != null) {
            return (tankDepth - current.exit).toFixed(2);
        } else {
            return "N/A";
        }
    },

    currentDown2() {
        const current = Depths.findOne({type: 'pressure', host: 'piCistern2'},{ sort: {time: -1}, limit:1 });
        if (current != null) {
            return (tankDepth - current.exit).toFixed(2);
        } else {
            return "N/A";
        }
    },

    currentDown3() {
        const current = Depths.findOne({type: 'pressure', host: 'piCistern3'},{ sort: {time: -1}, limit:1 });
        if (current != null) {
            return (tankDepth - current.exit).toFixed(2);
        } else {
            return "N/A";
        }
    },

    tank3Offset() {
        const current = Depths.findOne({type: 'pressure', host: 'piCistern'},{ sort: {time: -1}, limit:1 });
        const current3 = Depths.findOne({type: 'pressure', host: 'piCistern3'},{ sort: {time: -1}, limit:1 });
        if ((current != null) && (current3 != null)) {
            return (current3.exit - current.exit).toFixed(2);
        } else {
            return "N/A";
        }
    },

    tank2Offset() {
        const current = Depths.findOne({type: 'pressure', host: 'piCistern'},{ sort: {time: -1}, limit:1 });
        const current3 = Depths.findOne({type: 'pressure', host: 'piCistern2'},{ sort: {time: -1}, limit:1 });
        if ((current != null) && (current3 != null)) {
            return (current3.exit - current.exit).toFixed(2);
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
        const current = Depths.findOne({type: 'pressure', host: 'piCistern'},{ sort: {time: -1}, limit:1 });
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


    lastUpdate() {
        const current = Depths.findOne({type: 'pressure'},{ sort: {time: -1}, limit:1 });
        if (current != null) {
            time = moment(current.time).format('llll');
            return time;
        } else {
            return "";
        }
    },

    age1() {
        const last = Depths.findOne({type: 'pressure', host:  'piCistern'},{ sort: {time: -1}, limit:1 });
        if (last != null) {
            return "Last update " + moment.duration(moment().diff(last.time)).humanize()
        } else {
            return "";
        }
    },

    age2() {
        const last = Depths.findOne({type: 'pressure', host:  'piCistern2'},{ sort: {time: -1}, limit:1 });
        if (last != null) {
            return "Last update " + moment.duration(moment().diff(last.time)).humanize()
        } else {
            return "";
        }
    },

    age3() {
        const last = Depths.findOne({type: 'pressure', host:  'piCistern3'},{ sort: {time: -1}, limit:1 });
        if (last != null) {
            return "Last update " + moment.duration(moment().diff(last.time)).humanize()
        } else {
            return "";
        }
    },

    gallons() {
        const current = Depths.findOne({type: 'pressure', host:  'piCistern'},{ sort: {time: -1}, limit:1 });
        const current2 = Depths.findOne({type: 'pressure', host: 'piCistern2'},{ sort: {time: -1}, limit:1 });
        const current3 = Depths.findOne({type: 'pressure', host: 'piCistern3'},{ sort: {time: -1}, limit:1 });
        if (current != null) {
            const gallons =  gallonsInTanksPressure(current.time, current.exit, current2.exit, current3.exit);
            return gallons.toLocaleString('us', {maximumFractionDigits: 0})
        } else {
            return "";
        }
    },

    down() {
        const current = Depths.findOne({type: 'pressure', host: 'piCistern'},{ sort: {time: -1}, limit:1 });
        const current2 = Depths.findOne({type: 'pressure', host: 'piCistern2'},{ sort: {time: -1}, limit:1 });
        const current3 = Depths.findOne({type: 'pressure', host: 'piCistern3'},{ sort: {time: -1}, limit:1 });
        if (current != null) {
            const down =  capacity - gallonsInTanksPressure(current.time, current.exit, current2.exit, current3.exit);
            return down.toLocaleString('us', {maximumFractionDigits: 0})
        } else {
            return "";
        }
    },


    isDown() {
        const current = Depths.findOne({type: 'pressure', host: 'piCistern'},{ sort: {time: -1}, limit:1 });
        if ((current != null)  && (gallonsInTanksPressure(current.time, current.exit) < capacity)) {
            return true;
        } else {
            return false;
        }
    },


    overCapacity() {
        const current = Depths.findOne({type: 'pressure', host: 'piCistern'},{ sort: {time: -1}, limit:1 });
        if (current != null) {
            return current.overCapacity;
        } else {
            return false;
        }
    },

    overFlow() {
        const current = Depths.findOne({type: 'pressure', host: 'piCistern'},{ sort: {time: -1}, limit:1 });
        if (current != null) {
            return current.overFlow;
        } else {
            return false;
        }
    },

    change1() {

        try {
            const current = Depths.findOne({type: 'pressure', host: 'piCistern'},{ sort: {time: -1}, limit:1 });
            const current2 = Depths.findOne({type: 'pressure', host: 'piCistern2'},{ sort: {time: -1}, limit:1 });
            const current3 = Depths.findOne({type: 'pressure', host: 'piCistern3'},{ sort: {time: -1}, limit:1 });

            if (current != null) {
                if (!current2) {
                    current2 = current3;
                }

                let sixHourDepths = sixHourDepthsData.get();
                
                if ((sixHourDepths != null) && !sixHourDepths["piCistern2"]) {
                    sixHourDepths['piCistern2'] = sixHourDepths['piCistern3'];
                }

                    
                if ((current != null) && (sixHourDepths != null)) {
                    let gallons =  gallonsInTanksPressure(current.time, current.exit, current2.exit, current3.exit) - 
                        gallonsInTanksPressure(sixHourDepths['date'], sixHourDepths['piCistern'].enter, sixHourDepths['piCistern2'].enter, sixHourDepths['piCistern3'].enter);
                    const duration = moment.duration(moment(current.time).diff(moment(sixHourDepths['date']))).humanize();
                    // console.log("change1", gallonsInTanksPressure(sixHourDepths['date'], sixHourDepths['piCistern'].exit, sixHourDepths['piCistern2'].exit, sixHourDepths['piCistern3'].exit),
                    //     "->", gallonsInTanksPressure(current.time, current.exit, current2.exit, current3.exit), duration, sixHourDepths);
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
        } catch (error) {
            console.error("change1 error", error);
            return "";
        }
        
    },

    change2() {

        try {
            const current = Depths.findOne({type: 'pressure', host: 'piCistern'},{ sort: {time: -1}, limit:1 });
            const current2 = Depths.findOne({type: 'pressure', host: 'piCistern2'},{ sort: {time: -1}, limit:1 });
            const current3 = Depths.findOne({type: 'pressure', host: 'piCistern3'},{ sort: {time: -1}, limit:1 });

            if (current != null) {

                if (!current2) {
                    current2 = current3;
                }

                let sixHourDepths = sixDayDepthsData.get()

                if ((sixHourDepths != null) && !sixHourDepths["piCistern2"]) {
                    sixHourDepths['piCistern2'] = sixHourDepths['piCistern3'];
                }
                
                if ((current != null) && (sixHourDepths != null)) {
                    let gallons =  gallonsInTanksPressure(current.time, current.exit, current2.exit, current3.exit) - 
                        gallonsInTanksPressure(sixHourDepths['date'], sixHourDepths['piCistern'].enter, sixHourDepths['piCistern2'].enter, sixHourDepths['piCistern3'].enter);
                    const duration = moment.duration(moment(current.time).diff(moment(sixHourDepths['date']))).humanize();
                    // console.log("change1", gallonsInTanksPressure(sixHourDepths['date'], sixHourDepths['piCistern'].exit, sixHourDepths['piCistern2'].exit, sixHourDepths['piCistern3'].exit),
                    //     "->", gallonsInTanksPressure(current.time, current.exit, current2.exit, current3.exit), duration);
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
        } catch (error) {
            console.error("change2 error", error);
            return "";
        }
    },


    capacity() {
        return capacity.toLocaleString('us', {maximumFractionDigits: 0})
    },


    noAccess() {
        return noAccessGallons.toLocaleString('us', {maximumFractionDigits: 0})
    }
});



