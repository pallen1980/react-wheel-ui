import { render, screen } from '@testing-library/react';
import LoadingSpinner from '../../../../src/Areas/Main/components/LoadingSpinner';

describe('LoadingSpinner', () => {
  it('should render with default props', () => {
    render(<LoadingSpinner />);
    
    expect(screen.getByText('Loading...')).toBeInTheDocument();
    expect(document.querySelector('.loading-spinner--medium')).toBeInTheDocument();
    expect(document.querySelector('.loading-spinner__spinner')).toBeInTheDocument();
  });

  it('should render with custom message', () => {
    render(<LoadingSpinner message="Custom loading message" />);
    
    expect(screen.getByText('Custom loading message')).toBeInTheDocument();
  });

  it('should render without message when message is empty', () => {
    render(<LoadingSpinner message="" />);
    
    expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    expect(document.querySelector('.loading-spinner__message')).not.toBeInTheDocument();
  });

  it('should render with small size', () => {
    render(<LoadingSpinner size="small" />);
    
    expect(document.querySelector('.loading-spinner--small')).toBeInTheDocument();
    expect(document.querySelector('.loading-spinner--medium')).not.toBeInTheDocument();
  });

  it('should render with large size', () => {
    render(<LoadingSpinner size="large" />);
    
    expect(document.querySelector('.loading-spinner--large')).toBeInTheDocument();
    expect(document.querySelector('.loading-spinner--medium')).not.toBeInTheDocument();
  });

  it('should apply custom className', () => {
    render(<LoadingSpinner className="custom-spinner" />);
    
    expect(document.querySelector('.custom-spinner')).toBeInTheDocument();
  });

  it('should have spinner animation element', () => {
    render(<LoadingSpinner />);
    
    const spinner = document.querySelector('.loading-spinner__spinner');
    expect(spinner).toBeInTheDocument();
    // Note: CSS animations are not fully supported in jsdom, so we just check the element exists
  });

  it('should render all size variants correctly', () => {
    const { rerender } = render(<LoadingSpinner size="small" />);
    expect(document.querySelector('.loading-spinner--small')).toBeInTheDocument();

    rerender(<LoadingSpinner size="medium" />);
    expect(document.querySelector('.loading-spinner--medium')).toBeInTheDocument();

    rerender(<LoadingSpinner size="large" />);
    expect(document.querySelector('.loading-spinner--large')).toBeInTheDocument();
  });
});