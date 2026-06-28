import React from 'react';
import './ErrorBoundary.css';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <main className="fatal-shell" role="alert" aria-live="assertive">
          <section className="fatal-card">
            <span className="eyebrow">Application error</span>
            <h1>upayinfoPVT could not load this page.</h1>
            <p>{this.state.error.message}</p>
            <a className="primary-button" href="/" aria-label="Return to the upayinfoPVT home page">Return home</a>
          </section>
        </main>
      );
    }

    return this.props.children;
  }
}
