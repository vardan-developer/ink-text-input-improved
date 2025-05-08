import React, { useState, useEffect } from 'react';
import { Text, useInput } from 'ink';
import chalk from 'chalk';
import type { Except } from 'type-fest';

export type Props = {
	/**
	 * Text to display when `value` is empty.
	 */
	readonly placeholder?: string;

	/**
	 * Listen to user's input. Useful in case there are multiple input components
	 * at the same time and input must be "routed" to a specific component.
	 */
	readonly focus?: boolean; // eslint-disable-line react/boolean-prop-naming

	/**
	 * Replace all chars and mask the value. Useful for password inputs.
	 */
	readonly mask?: string;

	/**
	 * Whether to show cursor and allow navigation inside text input with arrow keys.
	 */
	readonly showCursor?: boolean; // eslint-disable-line react/boolean-prop-naming

	/**
	 * Highlight pasted text
	 */
	readonly highlightPastedText?: boolean; // eslint-disable-line react/boolean-prop-naming

	/**
	 * Value to display in a text input.
	 */
	readonly value: string;

	/**
	 * Function to call when value updates.
	 */
	readonly onChange: (value: string) => void;

	/**
	 * Function to call when `Enter` is pressed, where first argument is a value of the input.
	 */
	readonly onSubmit?: (value: string) => void;
};

const getOperation = (input: string, key: any) => {
	if (input === 'u' && key.ctrl) {
		// delete complete line from the cursor to the beginning of the line
		return 'deleteLine';
	}
	else if ((key.backspace || key.delete) && key.meta) {
		// delete complete word from the cursor to the beginning of the word
		return 'deleteWord';
	}
	else if (key.backspace || key.delete) {
		// delete one character from the cursor
		return 'deleteChar';
	}
	else if ((key.leftArrow && key.ctrl) || (input === 'b' && key.meta)) {
		// move cursor to the beginning of the word
		return 'moveToWordStart';
	}
	else if ((key.rightArrow && key.ctrl) || (input === 'f' && key.meta)) {
		// move cursor to the end of the word
		return 'moveToWordEnd';
	}
	else if ((key.leftArrow && key.meta) || (input === 'a' && key.ctrl)) {
		// move cursor to the beginning of the line
		return 'moveToLineStart';
	}
	else if ((key.rightArrow && key.meta) || (input === 'e' && key.ctrl)) {
		// move cursor to the end of the line
		return 'moveToLineEnd';
	}
	else if (key.leftArrow) {
		// move cursor one character to the left
		return 'moveLeft';
	}
	else if (key.rightArrow) {
		// move cursor one character to the right
		return 'moveRight';
	}
	else if (key.return) {
		// submit the input
		return 'submit';
	}
	else if (input.length > 0) {
		// insert the input
		return 'insert';
	}
	return null;
}

function TextInput({
	value: originalValue,
	placeholder = '',
	focus = true,
	mask,
	highlightPastedText = false,
	showCursor = true,
	onChange,
	onSubmit,
}: Props) {
	const [state, setState] = useState({
		cursorOffset: (originalValue || '').length,
		cursorWidth: 0,
	});

	const { cursorOffset, cursorWidth } = state;

	useEffect(() => {
		setState(previousState => {
			if (!focus || !showCursor) {
				return previousState;
			}

			const newValue = originalValue || '';

			if (previousState.cursorOffset > newValue.length - 1) {
				return {
					cursorOffset: newValue.length,
					cursorWidth: 0,
				};
			}

			return previousState;
		});
	}, [originalValue, focus, showCursor]);

	const cursorActualWidth = highlightPastedText ? cursorWidth : 0;

	const value = mask ? mask.repeat(originalValue.length) : originalValue;
	let renderedValue = value;
	let renderedPlaceholder = placeholder ? chalk.grey(placeholder) : undefined;

	// Fake mouse cursor, because it's too inconvenient to deal with actual cursor and ansi escapes
	if (showCursor && focus) {
		renderedPlaceholder =
			placeholder.length > 0
				? chalk.inverse(placeholder[0]) + chalk.grey(placeholder.slice(1))
				: chalk.inverse(' ');

		renderedValue = value.length > 0 ? '' : chalk.inverse(' ');

		let i = 0;

		for (const char of value) {
			renderedValue +=
				i >= cursorOffset - cursorActualWidth && i <= cursorOffset
					? chalk.inverse(char)
					: char;

			i++;
		}

		if (value.length > 0 && cursorOffset === value.length) {
			renderedValue += chalk.inverse(' ');
		}
	}

	useInput(
		(input, key) => {
			const operation = getOperation(input, key);
			if (operation === null) {
				return;
			}

			if (operation === 'submit') {
				if (onSubmit) {
					onSubmit(originalValue);
				}

				return;
			}

			let nextCursorOffset = cursorOffset;
			let nextValue = originalValue;
			let nextCursorWidth = 0;

			if (operation === 'moveLeft') {
				if (showCursor) {
					nextCursorOffset--;
				}
			} else if (operation === 'moveRight') {
				if (showCursor) {
					nextCursorOffset++;
				}
			} else if (operation === 'deleteChar') {
				if (cursorOffset > 0) {
					nextValue =
						originalValue.slice(0, cursorOffset - 1) +
						originalValue.slice(cursorOffset, originalValue.length);

					nextCursorOffset--;
				}
			} else if (operation === 'insert') {
				nextValue =
					originalValue.slice(0, cursorOffset) +
					input +
					originalValue.slice(cursorOffset, originalValue.length);

				nextCursorOffset += input.length;

				if (input.length > 1) {
					nextCursorWidth = input.length;
				}
			} else if (operation === 'deleteLine') {
				nextCursorOffset = 0;
				nextValue = originalValue.slice(cursorOffset);
			} else if (operation === 'deleteWord') {

				const deleteStart = cursorOffset;
				let deleteEnd = cursorOffset;

				while (deleteEnd > 0 && originalValue[deleteEnd - 1] === ' ') {
					deleteEnd--;
				}
				while (deleteEnd > 0 && originalValue[deleteEnd - 1] !== ' ') {
					deleteEnd--;
				}

				if (deleteEnd === deleteStart) {
					// no word to delete
					return;
				}

				nextValue =
					originalValue.slice(0, deleteEnd) +
					originalValue.slice(deleteStart);

				nextCursorOffset = deleteEnd;
			} else if (operation === 'moveToWordStart') {

				const startPosition = cursorOffset;
				let endPosition = startPosition;

				while (endPosition > 0 && originalValue[endPosition - 1] === ' ') {
					endPosition--;
				}
				while (endPosition > 0 && originalValue[endPosition - 1] !== ' ') {
					endPosition--;
				}

				nextCursorOffset = endPosition;
			} else if (operation === 'moveToWordEnd') {

				const startPosition = cursorOffset;
				let endPosition = startPosition;

				while (endPosition < originalValue.length && originalValue[endPosition] === ' ') {
					endPosition++;
				}
				while (endPosition < originalValue.length && originalValue[endPosition] !== ' ') {
					endPosition++;
				}

				nextCursorOffset = endPosition;
			} else if (operation === 'moveToLineStart') {
				nextCursorOffset = 0;
			} else if (operation === 'moveToLineEnd') {
				nextCursorOffset = originalValue.length;
			}

			if (cursorOffset < 0) {
				nextCursorOffset = 0;
			}

			if (cursorOffset > originalValue.length) {
				nextCursorOffset = originalValue.length;
			}

			setState({
				cursorOffset: nextCursorOffset,
				cursorWidth: nextCursorWidth,
			});

			if (nextValue !== originalValue) {
				onChange(nextValue);
			}
		},
		{ isActive: focus },
	);

	return (
		<Text>
			{placeholder
				? value.length > 0
					? renderedValue
					: renderedPlaceholder
				: renderedValue}
		</Text>
	);
}

export default TextInput;

type UncontrolledProps = {
	/**
	 * Initial value.
	 */
	readonly initialValue?: string;
} & Except<Props, 'value' | 'onChange'>;

export function UncontrolledTextInput({
	initialValue = '',
	...props
}: UncontrolledProps) {
	const [value, setValue] = useState(initialValue);

	return <TextInput {...props} value={value} onChange={setValue} />;
}
