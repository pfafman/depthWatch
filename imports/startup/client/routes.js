import { FlowRouter } from 'meteor/ostrio:flow-router-extra';

import '../both';

// Import needed templates
import '../../ui/layouts/body/body.js';
import '../../ui/pages/home/home.js';
//import '../../ui/pages/status/status.js';
import '../../ui/pages/not-found/not-found.js';

console.log("Version", VERSION);

// Set up all routes in the app
FlowRouter.route('/', {
  name: 'App.home',
  action() {
    this.render('App_body', 'App_home');
  },
});

// // Status page
// FlowRouter.route('/status', {
//   name: 'status',
//   action() {
//     this.render('status');
//   },
// });

// Create 404 route (catch-all)
FlowRouter.route('*', {
  action() {
    // Show 404 error page using Blaze
    console.log("Route not found");
    this.render('notFound');

    // Can be used with BlazeLayout,
    // and ReactLayout for React-based apps
  }
});