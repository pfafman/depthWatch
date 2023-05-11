

tankDepth = 59;
tankCapacity = 3236;

gallonsPerInch = 3 * tankCapacity/tankDepth;

maxDepth = 57;   // Where Sensor was

newMaxDepth = 67;   // Where Sensor is

minValidReading = 67 - 59;  // 8 inches

fudge = 0;
capacity = 3 * (3236 - fudge);  // Gallons Actual is 3236* 3
