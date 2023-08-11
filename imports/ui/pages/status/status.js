import './status.html';


import { Depths } from '../../../api/depths/depths.js';
import { Meteor } from 'meteor/meteor';
import { ReactiveVar } from 'meteor/reactive-var';
import moment from 'moment';

const status = new ReactiveVar("...");

Template.status.onCreated ( async() => {
    console.log("status.onCreated");
    const theStatus = await Meteor.callAsync('status');
    status.set(theStatus);

});




Template.status.helpers({
    
    status() {
        return status.get();
    }

});