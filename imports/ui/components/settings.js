import moment from 'moment';

tankDepth = 59;
tankCapacity = 3236;

gallonsPerInch = 3 * tankCapacity/tankDepth;

gallonsPerInchAbove19 = 57.6;

maxDepth    = 57;   // Where Sensor was
newMaxDepth = 67;   // Where Sensor is

minValidReading = 67 - 59;  // 8 inches

capacity = tankCapacity * 3 + 11*1.36*2;

gallonsInTanks = (sensorReading, time) => {
    let gallons = tankCapacity * 3 + 11*1.36*2;
    let theMaxDepth = newMaxDepth;

    if (moment(time).isBefore(moment("2023-05-10"))) {
        theMaxDepth = maxDepth;
    }

    if (sensorReading < 8) {
        gallons = tankCapacity * 3 + 11*1.36*2;
    } else if (sensorReading < 19) {
        gallons = tankCapacity * 3 + 11*1.36*2 - (sensorReading - 8) * gallonsPerInchAbove19;
    } else {
        gallons = tankCapacity * 3 + 11*1.36*2 - (19 - 8) * gallonsPerInchAbove19;
        gallons -= (sensorReading-19) * gallonsPerInch;
    }

    return Math.round(gallons);
}
