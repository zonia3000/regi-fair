# WP Open Events

## Developer notes

Generate translation files, after having executed `npm run build`:

```
wp i18n make-pot . languages/wp-open-events.pot --domain=wp-open-events
wp i18n update-po languages/wp-open-events.pot languages/wp-open-events-it_IT.po
poedit languages/wp-open-events-it_IT.po
wp i18n make-json languages/wp-open-events-it_IT.po --no-purge --pretty-print
```

Notice that the `make-pot` command can cause the following error:

```
Xdebug has detected a possible infinite loop, and aborted your script with a stack depth of '256' frames.
```

It can be solved by adding the following to the file `/etc/php/8.2/cli/conf.d/20-xdebug.ini`:

```
xdebug.max_nesting_level=512
```
