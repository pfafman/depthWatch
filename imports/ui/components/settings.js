import moment from 'moment';

tankDepth = 59;
tankCapacity = 3236;

gallonsPerInch = 3 * tankCapacity/tankDepth;

gallonsPerInchBelow9 = 56.9;

oldMaxDepth    = 57;   // Where Sensor was
newMaxDepth = 67;   // Where Sensor is

minValidReading = 67 - 59;  // 8 inches

capacity = tankCapacity * 3; //+ gallonsPerInchAbove9; //11*1.36*2;

gallonsInTanks = (sensorReading, time) => {
    let gallons = capacity;
    let theMaxDepth = newMaxDepth;

    if (moment(time).isBefore(moment("2023-05-10"))) {
        theMaxDepth = oldMaxDepth;
    }

    if (sensorReading < 8) {
        gallons = capacity;
    // } else if (sensorReading < 9) {
    //     gallons = capacity - (sensorReading - 8) * gallonsPerInchBelow9;
    } else {
        gallons = (theMaxDepth-sensorReading) * gallonsPerInch;
    }

    return Math.round(gallons);
}
