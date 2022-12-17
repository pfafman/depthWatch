import './body.html';


Template.App_body.helpers({

    version() {
        return `${VERSION} ${Meteor.release}`;
    },

    year() {
        moment().format('YYYY');
    }

});