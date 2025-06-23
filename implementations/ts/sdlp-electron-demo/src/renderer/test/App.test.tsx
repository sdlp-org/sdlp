import React from 'react';
import { render, screen } from '@testing-library/react';
import App from '../components/App';
import { describe, it, expect } from 'vitest';

describe('App', () => {
  it('renders the main application container', () => {
    render(<App />);
    const container = screen.getByRole('main');
    expect(container).toBeInTheDocument();
  });
});
