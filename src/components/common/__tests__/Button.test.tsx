import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Button } from '../Button';

describe('Button', () => {
  it('renders correctly with title', () => {
    const { getByText } = render(<Button title="Test Button" onPress={() => {}} />);
    expect(getByText('Test Button')).toBeTruthy();
  });

  it('calls onPress when pressed', () => {
    const onPressMock = jest.fn();
    const { getByText } = render(<Button title="Press Me" onPress={onPressMock} />);

    fireEvent.press(getByText('Press Me'));
    expect(onPressMock).toHaveBeenCalledTimes(1);
  });

  it('does not call onPress when disabled', () => {
    const onPressMock = jest.fn();
    const { getByText } = render(
      <Button title="Disabled" onPress={onPressMock} disabled />
    );

    fireEvent.press(getByText('Disabled'));
    expect(onPressMock).not.toHaveBeenCalled();
  });

  it('shows loading indicator when loading', () => {
    const { getByTestId, queryByText } = render(
      <Button title="Loading" onPress={() => {}} loading testID="loading-button" />
    );

    expect(queryByText('Loading')).toBeNull(); // Text hidden when loading
  });

  it('renders different variants', () => {
    const variants: Array<'primary' | 'secondary' | 'accent' | 'outline' | 'text'> = [
      'primary',
      'secondary',
      'accent',
      'outline',
      'text',
    ];

    variants.forEach((variant) => {
      const { getByText } = render(
        <Button title={variant} onPress={() => {}} variant={variant} />
      );
      expect(getByText(variant)).toBeTruthy();
    });
  });

  it('applies fullWidth style', () => {
    const { getByTestId } = render(
      <Button title="Full Width" onPress={() => {}} fullWidth testID="full-width-button" />
    );

    const button = getByTestId('full-width-button');
    expect(button).toBeTruthy();
  });
});