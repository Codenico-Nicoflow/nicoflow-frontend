import { fireEvent, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { Button } from '@/components/ui/button';

import { renderComponent } from '../renderComponent';

describe('Button', () => {
  it('renders with default props', () => {
    renderComponent(<Button>Click me</Button>);

    const button = screen.getByRole('button', { name: /click me/i });
    expect(button).toBeInTheDocument();
    expect(button).toHaveClass('bg-primary');
  });

  describe('variants', () => {
    it('renders default variant', () => {
      renderComponent(<Button variant="default">Default</Button>);

      const button = screen.getByRole('button', { name: /default/i });
      expect(button).toHaveClass('bg-primary', 'text-primary-foreground');
    });

    it('renders destructive variant', () => {
      renderComponent(<Button variant="destructive">Delete</Button>);

      const button = screen.getByRole('button', { name: /delete/i });
      expect(button).toHaveClass('bg-destructive', 'text-destructive-foreground');
    });

    it('renders outline variant', () => {
      renderComponent(<Button variant="outline">Outline</Button>);

      const button = screen.getByRole('button', { name: /outline/i });
      expect(button).toHaveClass('border', 'border-input', 'bg-background');
    });

    it('renders secondary variant', () => {
      renderComponent(<Button variant="secondary">Secondary</Button>);

      const button = screen.getByRole('button', { name: /secondary/i });
      expect(button).toHaveClass('bg-secondary', 'text-secondary-foreground');
    });

    it('renders ghost variant', () => {
      renderComponent(<Button variant="ghost">Ghost</Button>);

      const button = screen.getByRole('button', { name: /ghost/i });
      expect(button).toHaveClass('hover:bg-accent', 'hover:text-accent-foreground');
    });

    it('renders link variant', () => {
      renderComponent(<Button variant="link">Link</Button>);

      const button = screen.getByRole('button', { name: /link/i });
      expect(button).toHaveClass('text-primary', 'underline-offset-4');
    });
  });

  describe('sizes', () => {
    it('renders default size', () => {
      renderComponent(<Button size="default">Default Size</Button>);

      const button = screen.getByRole('button', { name: /default size/i });
      expect(button).toHaveClass('h-10', 'px-4', 'py-2');
    });

    it('renders small size', () => {
      renderComponent(<Button size="sm">Small</Button>);

      const button = screen.getByRole('button', { name: /small/i });
      expect(button).toHaveClass('h-9', 'px-3');
    });

    it('renders large size', () => {
      renderComponent(<Button size="lg">Large</Button>);

      const button = screen.getByRole('button', { name: /large/i });
      expect(button).toHaveClass('h-11', 'px-8');
    });

    it('renders extra large size', () => {
      renderComponent(<Button size="xl">Extra Large</Button>);

      const button = screen.getByRole('button', { name: /extra large/i });
      expect(button).toHaveClass('h-11', 'px-14');
    });

    it('renders icon size', () => {
      renderComponent(<Button size="icon" aria-label="icon button" />);

      const button = screen.getByRole('button', { name: /icon button/i });
      expect(button).toHaveClass('h-10', 'w-10');
    });
  });

  describe('disabled state', () => {
    it('renders disabled button', () => {
      renderComponent(<Button disabled>Disabled</Button>);

      const button = screen.getByRole('button', { name: /disabled/i });
      expect(button).toBeDisabled();
      expect(button).toHaveClass('disabled:pointer-events-none', 'disabled:opacity-50');
    });

    it('does not trigger onClick when disabled', () => {
      const handleClick = vi.fn();
      renderComponent(
        <Button disabled onClick={handleClick}>
          Disabled
        </Button>
      );

      const button = screen.getByRole('button', { name: /disabled/i });
      fireEvent.click(button);
      expect(handleClick).not.toHaveBeenCalled();
    });
  });

  describe('onClick handler', () => {
    it('triggers onClick when clicked', () => {
      const handleClick = vi.fn();
      renderComponent(<Button onClick={handleClick}>Click me</Button>);

      const button = screen.getByRole('button', { name: /click me/i });
      fireEvent.click(button);
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('can be clicked multiple times', () => {
      const handleClick = vi.fn();
      renderComponent(<Button onClick={handleClick}>Click me</Button>);

      const button = screen.getByRole('button', { name: /click me/i });
      fireEvent.click(button);
      fireEvent.click(button);
      fireEvent.click(button);
      expect(handleClick).toHaveBeenCalledTimes(3);
    });
  });

  describe('asChild prop', () => {
    it('renders as a child component when asChild is true', () => {
      renderComponent(
        <Button asChild>
          <a href="/test">Link Button</a>
        </Button>
      );

      const link = screen.getByRole('link', { name: /link button/i });
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute('href', '/test');
      expect(link).toHaveClass('bg-primary');
    });

    it('renders as a regular button when asChild is false', () => {
      renderComponent(<Button asChild={false}>Regular Button</Button>);

      const button = screen.getByRole('button', { name: /regular button/i });
      expect(button).toBeInTheDocument();
      expect(button.tagName).toBe('BUTTON');
    });
  });

  describe('custom className', () => {
    it('merges custom className with default classes', () => {
      renderComponent(<Button className="custom-class">Custom</Button>);

      const button = screen.getByRole('button', { name: /custom/i });
      expect(button).toHaveClass('custom-class', 'bg-primary');
    });
  });

  describe('button types', () => {
    it('renders with type="submit"', () => {
      renderComponent(<Button type="submit">Submit</Button>);

      const button = screen.getByRole('button', { name: /submit/i });
      expect(button).toHaveAttribute('type', 'submit');
    });

    it('renders with type="reset"', () => {
      renderComponent(<Button type="reset">Reset</Button>);

      const button = screen.getByRole('button', { name: /reset/i });
      expect(button).toHaveAttribute('type', 'reset');
    });

    it('renders with type="button"', () => {
      renderComponent(<Button type="button">Button</Button>);

      const button = screen.getByRole('button', { name: /button/i });
      expect(button).toHaveAttribute('type', 'button');
    });
  });
});
