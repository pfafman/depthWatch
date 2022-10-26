import { FlowRouter } from 'meteor/ostrio:flow-router-extra';

// Import needed templates
import '../../ui/layouts/body/body.js';
import '../../ui/pages/home/home.js';
import '../../ui/pages/not-found/not-found.js';

// Set up all routes in the app
FlowRouter.route('/', {
  name: 'App.home',
  action() {
    this.render('App_body', 'App_home');
  },
});

// Create 404 route (catch-all)
FlowRouter.route('*', {
  action() {
    // Show 404 error page using Blaze
    this.render('notFound');

    // Can be used with BlazeLayout,
    // and ReactLayout for React-based apps
  }
});