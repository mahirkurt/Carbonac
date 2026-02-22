import React from 'react';
import { Tile, Button } from '@carbon/react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[ErrorBoundary]', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <Tile className="error-boundary-fallback" style={{ padding: '2rem', margin: '1rem 0' }}>
          <h4 style={{ marginBottom: '0.5rem' }}>Bir hata olustu</h4>
          <p style={{ color: 'var(--cds-text-secondary)', marginBottom: '1rem' }}>
            {this.state.error?.message || 'Beklenmeyen bir hata meydana geldi.'}
          </p>
          <Button size="sm" kind="tertiary" onClick={this.handleReset}>
            Tekrar Dene
          </Button>
        </Tile>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
