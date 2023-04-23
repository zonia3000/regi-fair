# WP Open Events

## Developer notes

Generate translation files:

```
wp i18n make-pot . languages/wp-open-events.pot
wp i18n update-po languages/wp-open-events.pot
wp i18n make-json languages/wp-open-events-it_IT.po --no-purge --pretty-print
```
