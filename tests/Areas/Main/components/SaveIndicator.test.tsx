import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import SaveIndicator from '../../../../src/Areas/Main/components/SaveIndicator';
import optionsReducer, { OptionsState } from '../../../../src/store/optionsSlice';

// Mock store factory
const createMockStore = (optionsState: Partial<OptionsState>) => {
  return configureStore({
    reducer: {
      options: optionsReducer,
    },
    preloadedState: {
      options: {
        options: [],
        isLoading: false,
        isSaving: false,
        error: null,
        lastSaved: null,
        ...optionsState,
      },
    },
  });
};

const renderWithStore = (component: React.ReactElement, optionsState: Partial<OptionsState> = {}) => {
  const store = createMockStore(optionsState);
  return render(
    <Provider store={store}>
      {component}
    </Provider>
  );
};

describe('SaveIndicator', () => {
  it('should not render when no save state is active', () => {
    const { container } = renderWithStore(<SaveIndicator />);
    expect(container.firstChild).toBeNull();
  });

  it('should show saving state when isSaving is true', () => {
    renderWithStore(<SaveIndicator />, { isSaving: true });
    
    expect(screen.getByText('Saving...')).toBeInTheDocument();
    expect(document.querySelector('.save-indicator--saving')).toBeInTheDocument();
    expect(document.querySelector('.save-indicator__spinner')).toBeInTheDocument();
  });

  it('should show error state when there is an error', () => {
    renderWithStore(<SaveIndicator />, { error: 'Save failed' });
    
    expect(screen.getByText('Save failed')).toBeInTheDocument();
    expect(screen.getByText('⚠️')).toBeInTheDocument();
    expect(document.querySelector('.save-indicator--error')).toBeInTheDocument();
  });

  it('should show saved state with "just now" when recently saved', () => {
    const recentTime = new Date().toISOString();
    renderWithStore(<SaveIndicator />, { lastSaved: recentTime });
    
    expect(screen.getByText('Saved just now')).toBeInTheDocument();
    expect(screen.getByText('✓')).toBeInTheDocument();
    expect(document.querySelector('.save-indicator--saved')).toBeInTheDocument();
  });

  it('should show saved state with minutes ago for older saves', () => {
    const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000).toISOString();
    renderWithStore(<SaveIndicator />, { lastSaved: twoMinutesAgo });
    
    expect(screen.getByText('Saved 2m ago')).toBeInTheDocument();
    expect(screen.getByText('✓')).toBeInTheDocument();
  });

  it('should show saved state with hours ago for much older saves', () => {
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
    renderWithStore(<SaveIndicator />, { lastSaved: twoHoursAgo });
    
    expect(screen.getByText('Saved 2h ago')).toBeInTheDocument();
    expect(screen.getByText('✓')).toBeInTheDocument();
  });

  it('should show saved state with date for very old saves', () => {
    const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString();
    renderWithStore(<SaveIndicator />, { lastSaved: twoDaysAgo });
    
    const savedText = screen.getByText(/^Saved/);
    expect(savedText).toBeInTheDocument();
    expect(savedText.textContent).toMatch(/Saved \d+\/\d+\/\d+/);
  });

  it('should apply custom className when provided', () => {
    renderWithStore(<SaveIndicator className="custom-class" />, { isSaving: true });
    
    expect(document.querySelector('.custom-class')).toBeInTheDocument();
  });

  it('should prioritize error state over saving state', () => {
    renderWithStore(<SaveIndicator />, { 
      isSaving: true, 
      error: 'Network error' 
    });
    
    expect(screen.getByText('Save failed')).toBeInTheDocument();
    expect(screen.queryByText('Saving...')).not.toBeInTheDocument();
  });

  it('should prioritize error state over saved state', () => {
    renderWithStore(<SaveIndicator />, { 
      lastSaved: new Date().toISOString(),
      error: 'Network error' 
    });
    
    expect(screen.getByText('Save failed')).toBeInTheDocument();
    expect(screen.queryByText(/Saved/)).not.toBeInTheDocument();
  });
});