import React from 'react';
import { ComponentMeta, ComponentStory } from '@storybook/react';
import { Button } from './Button';
import { Ionicons } from '@expo/vector-icons';

export default {
  title: 'Components/Button',
  component: Button,
  argTypes: {
    onPress: { action: 'pressed' },
    variant: {
      control: { type: 'select' },
      options: ['primary', 'secondary', 'accent', 'outline', 'text'],
    },
    size: {
      control: { type: 'select' },
      options: ['sm', 'md', 'lg'],
    },
  },
} as ComponentMeta<typeof Button>;

const Template: ComponentStory<typeof Button> = (args) => <Button {...args} />;

export const Primary = Template.bind({});
Primary.args = {
  title: 'Start Free Trial',
  variant: 'primary',
  size: 'md',
};

export const Accent = Template.bind({});
Accent.args = {
  title: 'Start Free Trial',
  variant: 'accent',
  size: 'md',
};

export const Outline = Template.bind({});
Outline.args = {
  title: 'Sign In',
  variant: 'outline',
  size: 'md',
};

export const Text = Template.bind({});
Text.args = {
  title: 'Forgot Password?',
  variant: 'text',
  size: 'md',
};

export const Loading = Template.bind({});
Loading.args = {
  title: 'Loading...',
  variant: 'primary',
  loading: true,
};

export const Disabled = Template.bind({});
Disabled.args = {
  title: 'Disabled',
  variant: 'primary',
  disabled: true,
};

export const FullWidth = Template.bind({});
FullWidth.args = {
  title: 'Sign In',
  variant: 'primary',
  fullWidth: true,
};

export const Small = Template.bind({});
Small.args = {
  title: 'Small Button',
  variant: 'primary',
  size: 'sm',
};

export const Large = Template.bind({});
Large.args = {
  title: 'Large Button',
  variant: 'primary',
  size: 'lg',
};