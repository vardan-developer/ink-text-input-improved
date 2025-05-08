# ink-text-input-improved ![test](https://github.com/vadimdemedes/ink-text-input/workflows/test/badge.svg)

> Text input component for [Ink](https://github.com/vadimdemedes/ink) with enhanced keyboard shortcuts.

This is a fork of [ink-text-input](https://github.com/vadimdemedes/ink-text-input) with additional keyboard shortcuts for better editing experience.

## Added Features

- Improved keyboard shortcuts:
  - ⌘ + delete: Delete from cursor to beginning of line
  - Left Alt+Backspace / ⎇ + delete: Delete word
  - Ctrl/⎇+Left/Right: Move cursor by word
  - ⌘/Alt + Left/Right: Move cursor to beginning/end of line
  - Plus all original shortcuts

## Platform Specific Support

- Windows/Linux keyboard shortcuts
- macOS keyboard shortcuts (Command/Option key support)

## Install

```sh
npm install ink-text-input-improved
```

## Usage

```jsx
import React, {useState} from 'react';
import {render, Box, Text} from 'ink';
import TextInput from 'ink-text-input-improved';

const SearchQuery = () => {
	const [query, setQuery] = useState('');

	return (
		<Box>
			<Box marginRight={1}>
				<Text>Enter your query:</Text>
			</Box>

			<TextInput value={query} onChange={setQuery} />
		</Box>
	);
};

render(<SearchQuery />);
```

<img src="media/demo.gif" width="556">

## Props

### value

Type: `string`

Value to display in a text input.

### placeholder

Type: `string`

Text to display when `value` is empty.

### focus

Type: `boolean` \
Default: `true`

Listen to user's input. Useful in case there are multiple input components at the same time and input must be "routed" to a specific component.

### showCursor

Type: `boolean`\
Default: `true`

Whether to show cursor and allow navigation inside text input with arrow keys.

### highlightPastedText

Type: `boolean`\
Default: `false`

Highlight pasted text.

### mask

Type: `string`

Replace all chars and mask the value. Useful for password inputs.

```jsx
<TextInput value="Hello" mask="*" />
//=> "*****"
```

### onChange

Type: `Function`

Function to call when value updates.

### onSubmit

Type: `Function`

Function to call when `Enter` is pressed, where first argument is a value of the input.

## Uncontrolled usage

This component also exposes an [uncontrolled](https://reactjs.org/docs/uncontrolled-components.html) version, which handles `value` changes for you. To receive the final input value, use `onSubmit` prop.
Initial value can be specified via `initialValue` prop, which is supported only in `UncontrolledTextInput` component.

```jsx
import React from 'react';
import {render, Box, Text} from 'ink';
import {UncontrolledTextInput} from 'ink-text-input-improved';

const SearchQuery = () => {
	const handleSubmit = query => {
		// Do something with query
	};

	return (
		<Box>
			<Box marginRight={1}>
				<Text>Enter your query:</Text>
			</Box>

			<UncontrolledTextInput onSubmit={handleSubmit} />
		</Box>
	);
};

render(<SearchQuery />);
```
