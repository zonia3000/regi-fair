=== RegiFair ===
Contributors: zonia3000
Tags: events, registration, form, waiting list
Requires at least: 6.6
Tested up to: 6.7
Stable tag: 0.1.0
Requires PHP: 8.2
License: GPLv3 or later
License URI: https://www.gnu.org/licenses/gpl-3.0.html

RegiFair is an event registrations manager that provides a form builder and supports waiting lists, group registrations and email notifications.

== Description ==

**RegiFair** is an event registrations manager that works in the modern Gutenberg block editor.

Key Features:

* **Custom Form Builder**: Build the registration form for your events with the fields that you need. Currently supported elements are standard HTML fields like text, number and email inputs, dropdowns, checkboxes, radio buttons and some special field with custom logic (see next points).

* **Email Notifications**: Both administrators and users receive updates regarding registration confirmations, changes, and cancellations.

* **Available Seats Limit**: Set a maximum number of available seats for each event. The event automatically stops accepting new registrations when the limit is reached.

* **Waiting List**: When an event reaches its capacity, interested attendees can join a waiting list. The plugin automatically notifies them if a spot becomes available.

* **Autonomous Registration Editing**: Participants can edit or delete their bookings without needing to contact the event organizer.

* **Group Registrations**: Attendees can specify multiple people in a single registration. This feature is perfect for group events, enabling users to register friends, family, or colleagues all at once.

* **GDPR Friendly**: The plugin can automatically remove registrations after the event has ended and provides a field for accepting the privacy policy.

* **Event templates**: It is possible to create events from templates, to quickly create events having the same form and settings.

RegiFair is available in the following languages:

* English
* Italian

This plugin contains minified JavaScript code. The complete source code can be found at the following URL: https://github.com/zonia3000/regi-fair

== Frequently Asked Questions ==

= Can I create a form that works for registered users only? =

It is possible to add a setting to email form fields that automatically populates the email value from the current logged in Wordpress user. You can create an event for registered users only by adding a form with this configuration in a post accessible only by registered users.

= Can I export the registrations list? =

Yes, there is an "Export CSV" button on the registrations list, reachable from the admin area.

= Can I customize the content of the notification emails? =

You can add some custom content at the end of the messages, but it is not possible to customize the whole content.

= Is there a pro version? =

No, everything in this plugin is provided for free.

= Do you provide paid support? =

This plugin was developed as a volunteer effort for a non-profit organization, and I created it in my free time. While I am open to discussing potential paid support for adding new features, please note that I cannot guarantee my availability or acceptance of such requests. Feel free to reach out if you're interested, and I'll do my best to respond.

= Does it has integrations with payment platforms? =

No, and there is no plan to add this, since the plugin was developed as a volunteer effort for a non-profit organization that organizes free events.

== Screenshots ==

1. The event configuration page, seen from the administration area.
2. The event form displayed in a post; the user is editing a previously created registration.
3. The list of registrations, seen from the administration area.

== Changelog ==

= 0.1.0 =
* First version released
