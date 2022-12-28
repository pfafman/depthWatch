import './body.html';
import moment from 'moment';


Template.App_body.helpers({

    version() {
        return `${VERSION} ${Meteor.release}`;
    },

    year() {
        return moment().format('YYYY');
    }

});