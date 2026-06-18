import React, { useState, useEffect } from 'react';
import { Zap, Sparkles, Rocket, AlertTriangle, CheckSquare, ScrollText } from 'lucide-react';

export interface SbarContent {
  situation: string;
  background: string;
  assessment: string;
  recommendation: string;
  criticalAlerts: string[];
  incomingTasks: string[];
}

export interface HandoverLog {
  timestamp: string;
  approvedBy: string;
  content: SbarContent;
}

interface SbarSummaryPanelProps {
  patientId: string;
  sbar: SbarContent | null;
  onGenerate: () => void;
  onSaveDraft: (sbar: SbarContent) => Promise<void>;
  onApprove: (nurseName: string, sbar: SbarContent) => void;
  isGenerating: boolean;
  isApproving: boolean;
  history: HandoverLog[];
}

export const SbarSummaryPanel: React.FC<SbarSummaryPanelProps> = ({
  patientId,
  sbar,
  onGenerate,
  onSaveDraft,
  onApprove,
  isGenerating,
  isApproving,
  history
}) => {
  const [nurseSignature, setNurseSignature] = useState('');
  const [localSaving, setLocalSaving] = useState(false);

  // Initialize editedSbar with sbar prop
  const [editedSbar, setEditedSbar] = useState<SbarContent | null>(sbar);
  
  // Update editedSbar when sbar prop changes
  useEffect(() => {
    setEditedSbar(sbar);
  }, [sbar]);

  const handleFieldChange = (field: keyof SbarContent, value: string | string[]) => {
    if (!editedSbar) return;
    const updated = { ...editedSbar, [field]: value };
    setEditedSbar(updated);
    
    // Auto-save draft triggers
    triggerAutoSave(updated);
  };

  // Debounce auto-save
  const triggerAutoSave = (() => {
    let timeoutId: number;
    return (updatedSbar: SbarContent) => {
      clearTimeout(timeoutId);
      setLocalSaving(true);
      timeoutId = window.setTimeout(async () => {
        try {
          await onSaveDraft(updatedSbar);
        } catch (e) {
          console.error("Auto-save failed", e);
        } finally {
          setLocalSaving(false);
        }
      }, 1500); // Save after 1.5s of typing inactivity
    };
  })();

  const handleTaskCheckboxChange = (index: number, checked: boolean) => {
    if (!editedSbar) return;
    const updatedTasks = [...editedSbar.incomingTasks];
    if (checked) {
      // Mark as done or format differently
      updatedTasks[index] = `[x] ${updatedTasks[index].replace(/^\[[ x]\]\s*/, '')}`;
    } else {
      updatedTasks[index] = `[ ] ${updatedTasks[index].replace(/^\[[ x]\]\s*/, '')}`;
    }
    handleFieldChange('incomingTasks', updatedTasks);
  };

  const handleApproveClick = () => {
    if (!editedSbar) return;
    if (!nurseSignature.trim()) {
      alert("Please sign your name to authorize the handover.");
      return;
    }
    onApprove(nurseSignature, editedSbar);
    setNurseSignature('');
  };

  return (
    <div className="card-panel panel-container" style={{ position: 'relative' }}>
      {isGenerating && (
        <div className="loading-overlay" role="status" aria-live="polite">
          <div className="spinner" aria-hidden="true"></div>
          <h3 style={{ fontWeight: 600, color: 'var(--accent-primary)' }}>Generating AI SBAR Summary</h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Analyzing progress notes and clinical data...</p>
        </div>
      )}

      <div className="panel-header">
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-primary)' }}>
            <Zap color="var(--accent-primary)" size={20} /> AI-Assisted Shift Summary
          </h2>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>
            Drafting for MRN: {patientId}
          </div>
        </div>
        {localSaving && (
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic' }} aria-live="polite">
            Saving draft...
          </span>
        )}
      </div>

      <div className="panel-body">
        {!editedSbar ? (
          <div style={{ margin: 'auto', textAlign: 'center', padding: '2rem' }}>
            <Sparkles size={48} color="var(--accent-primary)" style={{ margin: '0 auto 1rem' }} />
            <h3 style={{ fontWeight: 600 }}>Create Shift Handoff</h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: '0.5rem', marginBottom: '1.5rem', maxWidth: '350px', marginLeft: 'auto', marginRight: 'auto' }}>
              Compile EHR charts and generate a structured SBAR handoff report in seconds using Azure OpenAI.
            </p>
            <button 
              className="btn btn-primary" 
              onClick={onGenerate}
              aria-label="Generate SBAR handoff report"
            >
              <Rocket size={18} /> Generate SBAR Handoff
            </button>
          </div>
        ) : (
          <>
            {/* SBAR Sections */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              
              {/* Situation */}
              <div className="sbar-section sbar-s">
                <div className="sbar-title" style={{ color: 'var(--accent-primary)' }}>
                  <span>S</span> Situation
                </div>
                <textarea
                  className="sbar-textarea"
                  rows={2}
                  value={editedSbar.situation}
                  onChange={(e) => handleFieldChange('situation', e.target.value)}
                  aria-label="Situation description"
                />
              </div>

              {/* Background */}
              <div className="sbar-section sbar-b">
                <div className="sbar-title" style={{ color: 'var(--accent-blue)' }}>
                  <span>B</span> Background
                </div>
                <textarea
                  className="sbar-textarea"
                  rows={3}
                  value={editedSbar.background}
                  onChange={(e) => handleFieldChange('background', e.target.value)}
                  aria-label="Background information"
                />
              </div>

              {/* Assessment */}
              <div className="sbar-section sbar-a">
                <div className="sbar-title" style={{ color: 'var(--accent-amber)' }}>
                  <span>A</span> Assessment
                </div>
                <textarea
                  className="sbar-textarea"
                  rows={4}
                  value={editedSbar.assessment}
                  onChange={(e) => handleFieldChange('assessment', e.target.value)}
                  aria-label="Clinical assessment"
                />
              </div>

              {/* Recommendation */}
              <div className="sbar-section sbar-r">
                <div className="sbar-title" style={{ color: 'var(--accent-emerald)' }}>
                  <span>R</span> Recommendation
                </div>
                <textarea
                  className="sbar-textarea"
                  rows={4}
                  value={editedSbar.recommendation}
                  onChange={(e) => handleFieldChange('recommendation', e.target.value)}
                  aria-label="Recommendation"
                />
              </div>
            </div>

            {/* Critical Alerts */}
            {editedSbar.criticalAlerts.length > 0 && (
              <div>
                <h4 style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--accent-danger)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <AlertTriangle size={16} /> Critical Safety Alerts
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }} role="list" aria-label="Critical safety alerts">
                  {editedSbar.criticalAlerts.map((alertText, idx) => (
                    <div key={idx} className="alert-box" role="listitem">
                      <AlertTriangle className="alert-icon" size={16} aria-hidden="true" />
                      <span className="alert-message">{alertText}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* To Do Checklist */}
            {editedSbar.incomingTasks.length > 0 && (
              <div>
                <h4 style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--accent-primary)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <CheckSquare size={16} /> Incoming Nurse Checklist
                </h4>
                <div style={{ background: 'var(--bg-canvas)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', padding: '0.75rem 1rem' }} role="group" aria-label="Incoming nurse checklist">
                  {editedSbar.incomingTasks.map((taskText, idx) => {
                    const isChecked = taskText.startsWith('[x]');
                    const cleanText = taskText.replace(/^\[[ x]\]\s*/, '');
                    return (
                      <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.35rem 0', fontSize: '0.85rem' }}>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => handleTaskCheckboxChange(idx, e.target.checked)}
                          style={{ cursor: 'pointer' }}
                          id={`task-${idx}`}
                          aria-label={`Task: ${cleanText}`}
                        />
                        <label htmlFor={`task-${idx}`} style={isChecked ? { textDecoration: 'line-through', color: 'var(--text-muted)', cursor: 'pointer' } : { color: 'var(--text-primary)', cursor: 'pointer' }}>
                          {cleanText}
                        </label>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Approval Workflow */}
            <div className="approval-workflow" style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '1.25rem', marginTop: '0.5rem' }}>
              <h4 style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.75rem' }}>
                Handover Authorization
              </h4>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <input
                  type="text"
                  placeholder="Type Outgoing Nurse Signature..."
                  className="sbar-textarea"
                  style={{ flex: 1, height: '40px', padding: '0.5rem 0.75rem' }}
                  value={nurseSignature}
                  onChange={(e) => setNurseSignature(e.target.value)}
                  aria-label="Nurse signature for handover authorization"
                />
                <button
                  className="btn btn-success"
                  onClick={handleApproveClick}
                  disabled={isApproving}
                  aria-label={isApproving ? 'Processing handover approval' : 'Approve and complete handover'}
                >
                  {isApproving ? 'Logging...' : 'Approve & Handover'}
                </button>
              </div>
            </div>
          </>
        )}

        {/* Handover Audit Trail */}
        {history.length > 0 && (
          <div className="audit-trail" style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '1rem', marginTop: '1rem' }}>
            <h4 style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <ScrollText size={16} /> Handover Audit Trail
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }} role="list" aria-label="Handover audit trail">
              {history.map((log, idx) => (
                <div key={idx} style={{ background: 'var(--bg-canvas)', border: '1px dashed var(--border-medium)', padding: '0.5rem 0.75rem', borderRadius: 'var(--radius-sm)', fontSize: '0.75rem' }} role="listitem">
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600, color: 'var(--accent-success)' }}>
                    <span>Approved By: RN {log.approvedBy}</span>
                    <span>{new Date(log.timestamp).toLocaleString()}</span>
                  </div>
                  <div style={{ color: 'var(--text-muted)', marginTop: '0.25rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    S: {log.content.situation}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
