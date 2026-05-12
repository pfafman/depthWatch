console.log("import settings.js");

import moment from 'moment';

tankDepth = 59;
tankCapacity = 3236;

gallonsPerInch = 3 * tankCapacity/tankDepth;  // 164.542

oldMaxDepth = 57;   // Where Sensor was
newMaxDepth = 67;   // Where Sensor is

minValidReading = 66.8 - 59;  // 7.8 inches

capacity = tankCapacity * 3; 

offset = 0.5*gallonsPerInch*2/3;


/********************
 * 
 *  Tank Offsets
 * 
 *   2025-10    :   11.23"
 *   2025-12-27 :   14"
 * 
 *  After Check Valve Removal
 *   2026-06-12 : -0.73   
 * 
 * 
 */


tank2Offset = 0;

tankBottom = 4;  // What the pump cannot get at.

noAccessGallons = tankBottom * gallonsPerInch;


gallonsInTanks = (sensorReading, time) => {
    let gallons = capacity;
    let theMaxDepth = newMaxDepth;

    if (moment(time).isBefore(moment("2023-05-10"))) {
        theMaxDepth = oldMaxDepth;
    }

    if (sensorReading < minValidReading) {
        gallons = capacity;
    } else if (sensorReading < minValidReading) {
        gallons = capacity - ((sensorReading - minValidReading) * gallonsPerInch/3);
    } else {
        gallons = (theMaxDepth-sensorReading) * gallonsPerInch; // + offset;
    }

    return Math.round(gallons);
}


gallonsInTanksPressure = (time, tank1, tank2, tank3) => {
    let gallons = capacity;

    let trueTankOffset = tank2Offset

    if (moment(time).isAfter(moment("2025-12-21"))) {
        trueTankOffset += 5;
    }

    if (tank2 === undefined) {
        tank2 = tank1 + trueTankOffset;
    }

    if (tank3 === undefined) {
        tank3 = tank2;
    }

    if (tank2 > 59) {
        tank2 = 59;
    }

    if (tank3 > 59) {
        tank3 = 59;
    }

    if (tank1 > 59) {
        gallons = capacity; // - noAccessGallons;
    } else if (tank1 < 0) {
        gallons = 0;
    } else {
        gallons = (tank1  + tank2 + tank3) * gallonsPerInch/3; // - noAccessGallons;
    }

    return Math.round(gallons);
}
