import { render, screen } from '@testing-library/react';
import App from './App';

test('renders NeoTravel landing page', () => {
  render(<App />);
  expect(screen.getByRole('heading', { name: /obtenez votre devis/i })).toBeInTheDocument();
});
