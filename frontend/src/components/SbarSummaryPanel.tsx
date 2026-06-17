import React, { useState, useEffect } from 'react';

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
  const [editedSbar, setEditedSbar] = useState<SbarContent | null>(null);
  const [nurseSignature, setNurseSignature] = useState('');
  const [localSaving, setLocalSaving] = useState(false);

  // Sync state with prop updates
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
    <div className="glass-panel panel-container" style={{ position: 'relative' }}>
      {isGenerating && (
        <div className="loading-overlay">
          <div className="spinner"></div>
          <h3 style={{ fontFamily: 'var(--font-display)', color: 'var(--accent-cyan)' }}>Generating AI SBAR Summary</h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Analyzing progress notes and clinical data...</p>
        </div>
      )}

      <div className="panel-header">
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ color: 'var(--accent-cyan)' }}>⚡</span> AI-Assisted Shift Summary
          </h2>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>
            Drafting for MRN: {patientId}
          </div>
        </div>
        {localSaving && (
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
            Saving draft...
          </span>
        )}
      </div>

      <div className="panel-body">
        {!editedSbar ? (
          <div style={{ margin: 'auto', textAlign: 'center', padding: '2rem' }}>
            <span style={{ fontSize: '3.5rem', marginBottom: '1rem', display: 'block', animation: 'pulse-glow 2s infinite alternate' }}>✨</span>
            <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 600 }}>Create Shift Handoff</h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: '0.5rem', marginBottom: '1.5rem', maxWidth: '350px', marginLeft: 'auto', marginRight: 'auto' }}>
              Compile EHR charts and generate a structured SBAR handoff report in seconds using Azure OpenAI.
            </p>
            <button className="btn btn-primary" onClick={onGenerate}>
              🚀 Generate SBAR Handoff
            </button>
          </div>
        ) : (
          <>
            {/* SBAR Sections */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              
              {/* Situation */}
              <div className="sbar-section sbar-s">
                <div className="sbar-title" style={{ color: 'var(--accent-cyan)' }}>
                  <span>S</span> Situation
                </div>
                <textarea
                  className="sbar-textarea"
                  rows={2}
                  value={editedSbar.situation}
                  onChange={(e) => handleFieldChange('situation', e.target.value)}
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
                />
              </div>
            </div>

            {/* Critical Alerts */}
            {editedSbar.criticalAlerts.length > 0 && (
              <div>
                <h4 style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--accent-rose)', marginBottom: '0.5rem' }}>
                  ⚠️ Critical Safety Alerts
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {editedSbar.criticalAlerts.map((alertText, idx) => (
                    <div key={idx} className="alert-box">
                      <span className="alert-icon">🚨</span>
                      <span className="alert-message">{alertText}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* To Do Checklist */}
            {editedSbar.incomingTasks.length > 0 && (
              <div>
                <h4 style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--accent-cyan)', marginBottom: '0.5rem' }}>
                  ☑️ Incoming Nurse Checklist
                </h4>
                <div style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-glass)', borderRadius: 'var(--radius-sm)', padding: '0.75rem 1rem' }}>
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
                        />
                        <span style={isChecked ? { textDecoration: 'line-through', color: 'var(--text-muted)' } : { color: '#cbd5e1' }}>
                          {cleanText}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Approval Workflow */}
            <div style={{ borderTop: '1px solid var(--border-glass)', paddingTop: '1.25rem', marginTop: '0.5rem' }}>
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
                />
                <button
                  className="btn btn-success"
                  onClick={handleApproveClick}
                  disabled={isApproving}
                >
                  {isApproving ? 'Logging...' : 'Approve & Handover'}
                </button>
              </div>
            </div>
          </>
        )}

        {/* Handover Audit Trail */}
        {history.length > 0 && (
          <div style={{ borderTop: '1px solid var(--border-glass)', paddingTop: '1rem', marginTop: '1rem' }}>
            <h4 style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
              📜 Handover Audit Trail
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {history.map((log, idx) => (
                <div key={idx} style={{ background: 'rgba(255,255,255,0.01)', border: '1px dashed var(--border-glass)', padding: '0.5rem 0.75rem', borderRadius: 'var(--radius-sm)', fontSize: '0.75rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600, color: 'var(--accent-emerald)' }}>
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
