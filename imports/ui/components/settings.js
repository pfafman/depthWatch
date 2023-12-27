import moment from 'moment';

tankDepth = 59;
tankCapacity = 3236;

gallonsPerInch = 3 * tankCapacity/tankDepth;

oldMaxDepth    = 57;   // Where Sensor was
newMaxDepth = 67;   // Where Sensor is

minValidReading = 67 - 59;  // 8 inches

capacity = tankCapacity * 3; 

offset = 0.5*gallonsPerInch*2/3;

gallonsInTanks = (sensorReading, time) => {
    let gallons = capacity;
    let theMaxDepth = newMaxDepth;

    if (moment(time).isBefore(moment("2023-05-10"))) {
        theMaxDepth = oldMaxDepth;
    }

    if (sensorReading < 8) {
        gallons = capacity;
    } else if (sensorReading < 8.5) {
        gallons = capacity - ((sensorReading - 8) * gallonsPerInch/3);
    } else {
        gallons = (theMaxDepth-sensorReading) * gallonsPerInch + offset;
    }

    return Math.round(gallons);
}
