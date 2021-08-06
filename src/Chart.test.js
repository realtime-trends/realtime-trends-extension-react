import { render, screen } from '@testing-library/react';
import Chart from './Chart';

test('renders learn react link', () => {
  render(<Chart />);
  const linkElement = screen.getByText(/learn react/i);
  expect(linkElement).toBeInTheDocument();
});
