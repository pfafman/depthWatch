// Client entry point, imports all client code

//import '@materializecss/materialize';
//import {M} from '@materializecss/materialize';

console.log("Client Statup");

import '/imports/startup/client';
import '/imports/startup/both';


try {
    //console.log("M", M.AutoInit);
} catch (error) {
    console.log("Error", error);
}
