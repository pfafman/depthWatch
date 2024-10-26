import './body.html';
import moment from 'moment';

console.log("moment", moment.version);

Template.App_body.helpers({

    version() {
        return `${VERSION} ${Meteor.release}`;
    },

    year() {
        return moment().format('YYYY');
    }

});