import React, { useState, useEffect } from 'react';
import { Sparkles, AlertTriangle, AlertOctagon, CheckSquare, History } from 'lucide-react';

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
          <h3 style={{ fontFamily: 'var(--font-display)', color: 'var(--text-h)' }}>Generating AI SBAR Summary</h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Analyzing progress notes and clinical data...</p>
        </div>
      )}

      <div className="panel-header">
        <div>
          <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-h)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Sparkles size={18} style={{ color: 'var(--accent-blue)' }} /> AI-Assisted Shift Summary
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
          <div className="empty-state">
            <Sparkles size={48} style={{ color: 'var(--accent-blue)', margin: '0 auto 1.25rem', display: 'block', animation: 'pulse-glow 2s infinite alternate' }} />
            <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 600, color: 'var(--text-h)' }}>Create Shift Handoff</h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: '0.5rem', marginBottom: '1.5rem' }}>
              Compile EHR charts and generate a structured SBAR handoff report in seconds using Azure OpenAI.
            </p>
            <button className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }} onClick={onGenerate}>
              <Sparkles size={16} /> Generate SBAR Handoff
            </button>
          </div>
        ) : (
          <>
            {/* SBAR Sections */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

              {/* Situation */}
              <div className="sbar-section sbar-s">
                <div className="sbar-title">
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
                <div className="sbar-title">
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
                <div className="sbar-title">
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
                <div className="sbar-title">
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
                <h4 className="section-label" style={{ color: 'var(--accent-rose)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <AlertTriangle size={18} /> Critical Safety Alerts
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {editedSbar.criticalAlerts.map((alertText, idx) => (
                    <div key={idx} className="alert-box">
                      <AlertOctagon className="alert-icon" size={16} style={{ flexShrink: 0 }} />
                      <span className="alert-message">{alertText}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* To Do Checklist */}
            {editedSbar.incomingTasks.length > 0 && (
              <div>
                <h4 className="section-label" style={{ color: 'var(--accent-cyan)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <CheckSquare size={18} /> Incoming Nurse Checklist
                </h4>
                <div className="checklist-box">
                  {editedSbar.incomingTasks.map((taskText, idx) => {
                    const isChecked = taskText.startsWith('[x]');
                    const cleanText = taskText.replace(/^\[[ x]\]\s*/, '');
                    return (
                      <div key={idx} className="checklist-item">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => handleTaskCheckboxChange(idx, e.target.checked)}
                        />
                        <span className={isChecked ? 'checklist-item-done' : 'checklist-item-pending'}>
                          {cleanText}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Approval Workflow */}
            <div className="approval-section">
              <h4 className="section-label" style={{ marginBottom: '0.75rem' }}>
                Handover Authorization
              </h4>
              <div className="approval-row">
                <input
                  type="text"
                  placeholder="Type Outgoing Nurse Signature..."
                  className="sbar-textarea"
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
          <div className="audit-trail">
            <h4 className="section-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <History size={18} /> Handover Audit Trail
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {history.map((log, idx) => (
                <div key={idx} className="audit-item">
                  <div className="audit-item-head">
                    <span>Approved By: RN {log.approvedBy}</span>
                    <span>{new Date(log.timestamp).toLocaleString()}</span>
                  </div>
                  <div className="audit-item-summary">
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