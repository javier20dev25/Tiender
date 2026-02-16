// src/test-utils.tsx
import { type ReactElement } from 'react';
import { render, type RenderOptions } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { vi } from 'vitest';

/**
 * A custom render function that wraps components in necessary providers
 * for testing. It relies on the global Supabase mock from `setupTests.ts`.
 */
const renderWithProviders = (
  ui: ReactElement,
  {
    route = '/',
    ...renderOptions
  }: { route?: string } & Omit<RenderOptions, 'wrapper'> = {}
) => {
  // Clear mock history before each render to ensure test isolation.
  // The mock implementations themselves are now handled globally in setupTests.ts
  vi.clearAllMocks();

  return render(
    <MemoryRouter initialEntries={[route]}>
      <AuthProvider>{ui}</AuthProvider>
    </MemoryRouter>,
    renderOptions
  );
};

// Re-export everything from testing-library
export {
  fireEvent,
  screen,
  waitFor,
  cleanup,
  within,
  configure,
  createEvent,
  getConfig,
  getElementError,
  getNodeText,
  getQueriesForElement,
  getRoles,
  logRoles,
  prettyDOM,
  queries,
  queryAllByAttribute,
  queryByAttribute,
  buildQueries
} from '@testing-library/react';
// Override the render method with our custom one
export { renderWithProviders as render };

