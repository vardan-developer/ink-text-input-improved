import React, {useState, useEffect} from 'react';
import {Text, useInput} from 'ink';
import chalk from 'chalk';
import type {Except} from 'type-fest';

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
		// Delete complete line from the cursor to the beginning of the line
		return 'deleteLine';
	}

	if ((key.backspace && key.meta) || (input === 'w' && key.ctrl)) {
		// Delete complete word from the cursor to the beginning of the word
		return 'deleteWord';
	}

	if (key.backspace || key.delete) {
		// Delete one character from the cursor
		return 'deleteChar';
	}

	if ((key.leftArrow && key.ctrl) || (input === 'b' && key.meta)) {
		// Move cursor to the beginning of the word
		return 'moveToWordStart';
	}

	if ((key.rightArrow && key.ctrl) || (input === 'f' && key.meta)) {
		// Move cursor to the end of the word
		return 'moveToWordEnd';
	}

	if ((key.leftArrow && key.meta) || (input === 'a' && key.ctrl)) {
		// Move cursor to the beginning of the line
		return 'moveToLineStart';
	}

	if ((key.rightArrow && key.meta) || (input === 'e' && key.ctrl)) {
		// Move cursor to the end of the line
		return 'moveToLineEnd';
	}

	if (key.leftArrow) {
		// Move cursor one character to the left
		return 'moveLeft';
	}

	if (key.rightArrow) {
		// Move cursor one character to the right
		return 'moveRight';
	}

	if (key.return) {
		// Submit the input
		return 'submit';
	}

	if (input.length > 0) {
		// Insert the input
		return 'insert';
	}

	return null;
};

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

	const {cursorOffset, cursorWidth} = state;

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

			switch (operation) {
				case 'moveLeft': {
					if (showCursor) {
						nextCursorOffset--;
					}

					break;
				}

				case 'moveRight': {
					if (showCursor) {
						nextCursorOffset++;
					}

					break;
				}

				case 'deleteChar': {
					if (cursorOffset > 0) {
						nextValue =
							originalValue.slice(0, cursorOffset - 1) +
							originalValue.slice(cursorOffset, originalValue.length);

						nextCursorOffset--;
					}

					break;
				}

				case 'insert': {
					nextValue =
						originalValue.slice(0, cursorOffset) +
						input +
						originalValue.slice(cursorOffset, originalValue.length);

					nextCursorOffset += input.length;

					if (input.length > 1) {
						nextCursorWidth = input.length;
					}

					break;
				}

				case 'deleteLine': {
					nextCursorOffset = 0;
					nextValue = originalValue.slice(cursorOffset);
					break;
				}

				case 'deleteWord': {
					const deleteStart = cursorOffset;
					let deleteEnd = cursorOffset;

					while (deleteEnd > 0 && originalValue[deleteEnd - 1] === ' ') {
						deleteEnd--;
					}

					while (deleteEnd > 0 && originalValue[deleteEnd - 1] !== ' ') {
						deleteEnd--;
					}

					if (deleteEnd === deleteStart) {
						// No word to delete
						return;
					}

					nextValue =
						originalValue.slice(0, deleteEnd) +
						originalValue.slice(deleteStart);

					nextCursorOffset = deleteEnd;
					break;
				}

				case 'moveToWordStart': {
					const startPosition = cursorOffset;
					let endPosition = startPosition;

					while (endPosition > 0 && originalValue[endPosition - 1] === ' ') {
						endPosition--;
					}

					while (endPosition > 0 && originalValue[endPosition - 1] !== ' ') {
						endPosition--;
					}

					nextCursorOffset = endPosition;
					break;
				}

				case 'moveToWordEnd': {
					const startPosition = cursorOffset;
					let endPosition = startPosition;

					while (
						endPosition < originalValue.length &&
						originalValue[endPosition] === ' '
					) {
						endPosition++;
					}

					while (
						endPosition < originalValue.length &&
						originalValue[endPosition] !== ' '
					) {
						endPosition++;
					}

					nextCursorOffset = endPosition;
					break;
				}

				case 'moveToLineStart': {
					nextCursorOffset = 0;
					break;
				}

				case 'moveToLineEnd': {
					nextCursorOffset = originalValue.length;
					break;
				}
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
		{isActive: focus},
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
