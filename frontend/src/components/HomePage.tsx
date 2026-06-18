import React from 'react';
import { Stethoscope, Sparkles, CheckSquare, Shield, ArrowRight, Activity } from 'lucide-react';

interface HomePageProps {
  onLaunch: () => void;
}

export const HomePage: React.FC<HomePageProps> = ({ onLaunch }) => {
  return (
    <div className="homepage-container">
      <header className="homepage-header">
        <div className="app-title">
          <Stethoscope className="app-logo-icon" size={24} style={{ color: 'var(--accent-blue)' }} />
          <span>Handover</span>
        </div>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <span className="badge badge-info">v1.0.0 Stable</span>
          <button className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 1rem' }} onClick={onLaunch}>
            Launch App <ArrowRight size={14} />
          </button>
        </div>
      </header>

      <main className="homepage-hero">
        <div className="hero-content">
          <div className="hero-left">
            <div className="hero-badge">
              <Sparkles size={12} /> CLINICAL AI WORKFLOW
            </div>
            <h1 className="hero-title">
              Where patient care <br />
              meets intelligence.
            </h1>
            <p className="hero-text">
              Transform unstructured nursing notes and complex EHR charts into clear, structured, and audit-ready SBAR summaries in seconds. Reduce handover time from minutes to seconds, and keep patient transitions safe.
            </p>
            <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
              <button className="btn btn-primary btn-lg" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.6rem', padding: '0.75rem 1.5rem', fontSize: '1rem' }} onClick={onLaunch}>
                Get Started <ArrowRight size={16} />
              </button>
            </div>
          </div>
          <div className="hero-right">
            <div className="hero-image-wrapper">
              <img src="/medical_ai_hero.png" alt="Clinical AI Handoff Illustration" className="hero-image" />
              <div className="floating-metric-card">
                <Activity size={16} style={{ color: 'var(--accent-blue)' }} />
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>AI Confidence</div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-h)' }}>99.4% Verified</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <section className="homepage-stats">
        <div className="stats-inner">
          <div className="stat-card">
            <div className="stat-number">32s</div>
            <div className="stat-label">Avg Handoff Documentation Time</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">85%</div>
            <div className="stat-label">Reduction in Administrative Workload</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">0</div>
            <div className="stat-label">Critical Safety Handoff Discrepancies</div>
          </div>
        </div>
      </section>

      <section className="homepage-features">
        <div className="features-header">
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.75rem', color: 'var(--text-h)', textAlign: 'center' }}>
            Built for clinical efficiency and safety.
          </h2>
          <p style={{ color: 'var(--text-secondary)', textAlign: 'center', maxWidth: '600px', margin: '0.5rem auto 2.5rem' }}>
            A workflow-integrated handoff tool designed with Google-backed architecture to support front-line nursing staff.
          </p>
        </div>

        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon-wrapper" style={{ background: 'var(--accent-blue-bg)', color: 'var(--accent-blue)' }}>
              <Sparkles size={20} />
            </div>
            <h3 className="feature-card-title">SBAR Summary Generation</h3>
            <p className="feature-card-text">
              Directly parses conditions, vitals, medications, and labs from patient bundles, merging them with raw notes to construct valid SBAR JSON reports.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon-wrapper" style={{ background: 'var(--accent-cyan-bg)', color: 'var(--accent-cyan)' }}>
              <CheckSquare size={20} />
            </div>
            <h3 className="feature-card-title">Interactive Sign-off Checklist</h3>
            <p className="feature-card-text">
              Interactive checks and custom incoming task lists ensure incoming shifts are perfectly oriented to priority responsibilities.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon-wrapper" style={{ background: 'var(--accent-emerald-bg)', color: 'var(--accent-emerald)' }}>
              <Shield size={20} />
            </div>
            <h3 className="feature-card-title">Handoff Audit Trails</h3>
            <p className="feature-card-text">
              Every approved handoff logs the nurse signature, timestamp, and content state directly to local session logs for clinical transparency and audits.
            </p>
          </div>
        </div>
      </section>

      <footer className="homepage-footer">
        <div className="footer-content">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-h)', fontWeight: 600 }}>
            <Stethoscope size={16} style={{ color: 'var(--accent-blue)' }} /> Handover
          </div>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
            &copy; 2026 Handover. Designed for hospital deployment and EHR integration demo.
          </p>
        </div>
      </footer>
    </div>
  );
};
