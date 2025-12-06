import moment from 'moment';

tankDepth = 59;
tankCapacity = 3236;

gallonsPerInch = 3 * tankCapacity/tankDepth;  // 164.542

oldMaxDepth    = 57;   // Where Sensor was
newMaxDepth = 67;      // Where Sensor is

minValidReading = 66.8 - 59;  // 7.8 inches

capacity = tankCapacity * 3; 

offset = 0.5*gallonsPerInch*2/3;


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
    let theMaxDepth = newMaxDepth;

    if (tank2 === undefined) {
        tank2 = tank1 + 11.23;
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


    if (moment(time).isBefore(moment("2023-05-10"))) {
        theMaxDepth = oldMaxDepth;
    }

    if (tank1 > 59) {
        gallons = capacity;
    } else if (tank1 < 0) {
        gallons = 0;
    } else {
        gallons = (tank1  + tank2 + tank3) * gallonsPerInch/3;
    }

    return Math.round(gallons);
}
