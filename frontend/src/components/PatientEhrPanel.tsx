import React from 'react';
import { FileText } from 'lucide-react';

export interface PatientEhrData {
  patient: {
    id: string;
    name: string;
    gender: string;
    birthDate: string;
    age: number;
    phone: string;
  };
  conditions: Array<{ code: string; display: string; status: string }>;
  allergies: Array<{ substance: string; criticality: 'high' | 'medium' | 'low' }>;
  vitals: Record<string, string>;
  labs: Array<{ name: string; value: string; time: string }>;
  medications: Array<{ name: string; instructions: string; status: string }>;
  shiftNote: {
    title: string;
    content: string;
  };
}

interface PatientEhrPanelProps {
  ehrData: PatientEhrData | null;
  isLoading: boolean;
}

export const PatientEhrPanel: React.FC<PatientEhrPanelProps> = ({ ehrData, isLoading }) => {
  if (isLoading) {
    return (
      <div className="card-panel panel-container" style={{ position: 'relative' }}>
        <div className="spinner" style={{ margin: 'auto' }} aria-hidden="true"></div>
        <div style={{ position: 'absolute', bottom: '2rem', left: 0, right: 0, textAlign: 'center', color: 'var(--text-secondary)' }} aria-live="polite">
          Retrieving EHR records...
        </div>
      </div>
    );
  }

  if (!ehrData) {
    return (
      <div className="card-panel panel-container" style={{ justifyContent: 'center', alignItems: 'center', padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
        <FileText size={48} color="var(--text-muted)" style={{ marginBottom: '1rem' }} aria-hidden="true" />
        <h3>No Patient Selected</h3>
        <p style={{ fontSize: '0.9rem', marginTop: '0.5rem', color: 'var(--text-muted)' }}>
          Select a patient from the census board to display their Electronic Health Record (EHR) profile.
        </p>
      </div>
    );
  }

  const { patient, conditions, allergies, vitals, labs, medications, shiftNote } = ehrData;

  return (
    <div className="card-panel panel-container">
      <div className="panel-header">
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>{patient.name}</h2>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
            MRN: {patient.id} &bull; DOB: {patient.birthDate} ({patient.gender}, {patient.age}yo)
          </div>
        </div>
        <span className="badge badge-pending" style={{ background: 'var(--bg-card-active)', color: 'var(--accent-primary)', borderColor: 'var(--border-focus)' }}>
          Active EHR
        </span>
      </div>

      <div className="panel-body">
        {/* Vitals Section */}
        <section aria-labelledby="vitals-heading">
          <h3 id="vitals-heading" style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Current Vital Signs (Shift End)
          </h3>
          <div className="vitals-grid" role="list" aria-label="Patient vital signs">
            {Object.entries(vitals).map(([name, value]) => {
              // Highlight out-of-range vitals slightly (e.g. high heart rate, lower SpO2)
              const isAbnormal = 
                (name.includes('Heart Rate') && parseInt(value) > 100) ||
                (name.includes('Oxygen Saturation') && parseInt(value) < 95);
                
              return (
                <div key={name} className="vital-card" style={isAbnormal ? { borderColor: 'var(--border-danger-subtle)', background: 'var(--bg-danger-subtle)' } : {}} role="listitem">
                  <div className="vital-label">{name}</div>
                  <div className="vital-value" style={isAbnormal ? { color: 'var(--accent-danger)' } : {}}>{value}</div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Clinical Diagnostics (Conditions & Allergies) */}
        <div className="clinical-diagnostics-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <section aria-labelledby="conditions-heading">
            <h3 id="conditions-heading" style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Active Conditions
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }} role="list" aria-label="Active medical conditions">
              {conditions.map((c, i) => (
                <div key={i} style={{ background: 'var(--bg-canvas)', border: '1px solid var(--border-subtle)', padding: '0.5rem 0.75rem', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem' }} role="listitem">
                  {c.display}
                </div>
              ))}
            </div>
          </section>

          <section aria-labelledby="allergies-heading">
            <h3 id="allergies-heading" style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Allergies & Intolerances
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }} role="list" aria-label="Patient allergies and intolerances">
              {allergies.length === 0 ? (
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', padding: '0.5rem' }}>No known drug allergies</div>
              ) : (
                allergies.map((a, i) => (
                  <div
                    key={i}
                    style={{
                      background: a.criticality === 'high' ? 'var(--bg-danger-subtle)' : 'var(--bg-warning-subtle)',
                      border: a.criticality === 'high' ? '1px solid var(--border-danger-subtle)' : '1px solid var(--border-warning-subtle)',
                      color: a.criticality === 'high' ? 'var(--accent-danger)' : 'var(--accent-warning)',
                      padding: '0.5rem 0.75rem',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '0.85rem',
                      fontWeight: 600
                    }}
                    role="listitem"
                    aria-label={`${a.substance} allergy - ${a.criticality} criticality`}
                  >
                    {a.substance} ({a.criticality.toUpperCase()})
                  </div>
                ))
              )}
            </div>
          </section>
        </div>

        {/* Labs & Meds */}
        <div className="labs-meds-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <section aria-labelledby="labs-heading">
            <h3 id="labs-heading" style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Recent Laboratory Results
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }} role="list" aria-label="Recent laboratory results">
              {labs.length === 0 ? (
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', padding: '0.5rem' }}>No lab values logged this shift</div>
              ) : (
                labs.map((l, i) => (
                  <div key={i} style={{ background: 'var(--bg-canvas)', border: '1px solid var(--border-subtle)', padding: '0.5rem 0.75rem', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem', display: 'flex', justifyContent: 'space-between' }} role="listitem">
                    <span>{l.name}</span>
                    <span style={{ color: 'var(--accent-primary)', fontWeight: 600 }}>{l.value}</span>
                  </div>
                ))
              )}
            </div>
          </section>

          <section aria-labelledby="medications-heading">
            <h3 id="medications-heading" style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Active Scheduled Medications
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }} role="list" aria-label="Active scheduled medications">
              {medications.map((m, i) => (
                <div key={i} style={{ background: 'var(--bg-canvas)', border: '1px solid var(--border-subtle)', padding: '0.5rem 0.75rem', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem' }} role="listitem">
                  <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{m.name}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>{m.instructions}</div>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Unstructured Progress Note */}
        <section aria-labelledby="shift-note-heading">
          <h3 id="shift-note-heading" style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Outgoing Shift Progress Note (Raw)
          </h3>
          <div style={{
            background: 'var(--bg-canvas)',
            border: '1px solid var(--border-medium)',
            borderRadius: 'var(--radius-sm)',
            padding: '1rem',
            fontSize: '0.875rem',
            lineHeight: 1.6,
            color: 'var(--text-secondary)',
            whiteSpace: 'pre-line',
            maxHeight: '220px',
            overflowY: 'auto',
            fontFamily: 'monospace'
          }} role="region" aria-label="Shift progress note">
            {shiftNote.content}
          </div>
        </section>
      </div>
    </div>
  );
};
