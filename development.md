## RegiFair developer notes

Requirements:

- WP-Cron needs to be enabled if you want the autoremoval of old events data;
- MySQL/MariaDB InnoDB engine should be used, since the plugin sets the `serializable` isolation level to avoid concurrent registrations when an event as a limited number of available seats.

### Build process

The plugin frontend needs to be built before using the plugin. It is composed by 2 subprojects: `components` (written in TypeScript) and `block` (written in JavaScript, depending on `components`). The `block` is used to render the plugin inside the Gutenberg block editor, while `components` is used to render the administration pages of the plugin in the admin area and the event form in the public posts.

Use the following commands to build the frontend:

```sh
cd js/src/components
npm install
npm run build

cd ../block
npm install
npm run build
```

### Running the plugin locally

Install [wp-env](https://developer.wordpress.org/block-editor/getting-started/devenv/get-started-with-wp-env/) and run `wp-env start`.

To test the sending of notification e-mail messages start also a [mailpit](https://github.com/axllent/mailpit) container:

```sh
docker run -d -p 8025:8025 -p 1025:1025 axllent/mailpit
```

### Localization

Generate translation files, after having executed `npm run build`:

```
wp i18n make-pot . languages/regi-fair.pot --domain=regi-fair
wp i18n update-po languages/regi-fair.pot languages/regi-fair-it_IT.po
poedit languages/regi-fair-it_IT.po
wp i18n make-json languages/regi-fair-it_IT.po --no-purge --pretty-print
```

Notice that the `make-pot` command can cause the following error:

```
Xdebug has detected a possible infinite loop, and aborted your script with a stack depth of '256' frames.
```

It can be solved by adding the following to the file `/etc/php/8.2/cli/conf.d/20-xdebug.ini`:

```
xdebug.max_nesting_level=512
```

### Test with Wordpress development version

In `.wp-env.json` set:

```json
  "core": "WordPress/WordPress#master",
```
