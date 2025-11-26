import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { SignInScreen } from '../SignInScreen';

describe('SignInScreen', () => {
  const mockOnSignIn = jest.fn();
  const mockOnForgotPassword = jest.fn();
  const mockOnStartTrial = jest.fn();
  const mockOnNeedHelp = jest.fn();
  const mockOnCommonIssues = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly', () => {
    const { getByText, getByTestId } = render(
      <SignInScreen
        onSignIn={mockOnSignIn}
        onForgotPassword={mockOnForgotPassword}
        onStartTrial={mockOnStartTrial}
        onNeedHelp={mockOnNeedHelp}
        onCommonIssues={mockOnCommonIssues}
      />
    );

    expect(getByText('Welcome Back')).toBeTruthy();
    expect(getByText('Sign in to continue your learning')).toBeTruthy();
    expect(getByTestId('email-input')).toBeTruthy();
    expect(getByTestId('password-input')).toBeTruthy();
    expect(getByTestId('sign-in-button')).toBeTruthy();
  });

  it('validates email on sign in', async () => {
    const { getByTestId, getByText } = render(
      <SignInScreen
        onSignIn={mockOnSignIn}
        onForgotPassword={mockOnForgotPassword}
        onStartTrial={mockOnStartTrial}
        onNeedHelp={mockOnNeedHelp}
        onCommonIssues={mockOnCommonIssues}
      />
    );

    const signInButton = getByTestId('sign-in-button');

    fireEvent.press(signInButton);

    await waitFor(() => {
      expect(getByText('Email is required')).toBeTruthy();
    });

    expect(mockOnSignIn).not.toHaveBeenCalled();
  });

  it('validates password on sign in', async () => {
    const { getByTestId, getByText } = render(
      <SignInScreen
        onSignIn={mockOnSignIn}
        onForgotPassword={mockOnForgotPassword}
        onStartTrial={mockOnStartTrial}
        onNeedHelp={mockOnNeedHelp}
        onCommonIssues={mockOnCommonIssues}
      />
    );

    const emailInput = getByTestId('email-input');
    const signInButton = getByTestId('sign-in-button');

    fireEvent.changeText(emailInput, 'test@example.com');
    fireEvent.press(signInButton);

    await waitFor(() => {
      expect(getByText('Password is required')).toBeTruthy();
    });

    expect(mockOnSignIn).not.toHaveBeenCalled();
  });

  it('calls onSignIn with correct credentials', async () => {
    mockOnSignIn.mockResolvedValue(undefined);

    const { getByTestId } = render(
      <SignInScreen
        onSignIn={mockOnSignIn}
        onForgotPassword={mockOnForgotPassword}
        onStartTrial={mockOnStartTrial}
        onNeedHelp={mockOnNeedHelp}
        onCommonIssues={mockOnCommonIssues}
      />
    );

    const emailInput = getByTestId('email-input');
    const passwordInput = getByTestID('password-input');
    const signInButton = getByTestId('sign-in-button');

    fireEvent.changeText(emailInput, 'test@example.com');
    fireEvent.changeText(passwordInput, 'Test1234');
    fireEvent.press(signInButton);

    await waitFor(() => {
      expect(mockOnSignIn).toHaveBeenCalledWith('test@example.com', 'Test1234');
    });
  });

  it('navigates to forgot password screen', () => {
    const { getByTestId } = render(
      <SignInScreen
        onSignIn={mockOnSignIn}
        onForgotPassword={mockOnForgotPassword}
        onStartTrial={mockOnStartTrial}
        onNeedHelp={mockOnNeedHelp}
        onCommonIssues={mockOnCommonIssues}
      />
    );

    const forgotPasswordLink = getByTestId('forgot-password-link');
    fireEvent.press(forgotPasswordLink);

    expect(mockOnForgotPassword).toHaveBeenCalled();
  });

  it('navigates to sign up screen', () => {
    const { getByTestId } = render(
      <SignInScreen
        onSignIn={mockOnSignIn}
        onForgotPassword={mockOnForgotPassword}
        onStartTrial={mockOnStartTrial}
        onNeedHelp={mockOnNeedHelp}
        onCommonIssues={mockOnCommonIssues}
      />
    );

    const startTrialButton = getByTestId('start-trial-button');
    fireEvent.press(startTrialButton);

    expect(mockOnStartTrial).toHaveBeenCalled();
  });
});