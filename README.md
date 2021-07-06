# Fallback Font

A font that maps every character to one glyph.

## Implementation

To install run the following command:

```sh
npm install -D fallback-font
```

or with yarn run:

```sh
yarn add -D fallback-font
```

Then import one of the css files inside your app. For example: `import "fallback-font/fallback-outline.css";`

Then you can reference the font using the css `font-family` property.

## Included Fonts

| font name          | css file               | description of glyph                          |
| ------------------ | ---------------------- | --------------------------------------------- |
| Fallback Blank     | fallback-blank.css     | no whitespace or marks                        |
| Fallback Outline   | fallback-outline.css   | outlined rectangle                            |
| Fallback Outline X | fallback-outline-x.css | outlined rectangle with an X going through it |
| Fallback Space     | fallback-space.css     | whitespace without marks                      |
