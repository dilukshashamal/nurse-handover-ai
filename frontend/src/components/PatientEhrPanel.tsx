import React from 'react';

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
      <div className="glass-panel panel-container" style={{ position: 'relative' }}>
        <div className="spinner" style={{ margin: 'auto' }}></div>
        <div style={{ position: 'absolute', bottom: '2rem', left: 0, right: 0, textAlign: 'center', color: 'var(--text-secondary)' }}>
          Retrieving EHR records...
        </div>
      </div>
    );
  }

  if (!ehrData) {
    return (
      <div className="glass-panel panel-container" style={{ justifyContent: 'center', alignItems: 'center', padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
        <span style={{ fontSize: '3rem', marginBottom: '1rem' }}>🏥</span>
        <h3>No Patient Selected</h3>
        <p style={{ fontSize: '0.9rem', marginTop: '0.5rem', color: 'var(--text-muted)' }}>
          Select a patient from the census board to display their Electronic Health Record (EHR) profile.
        </p>
      </div>
    );
  }

  const { patient, conditions, allergies, vitals, labs, medications, shiftNote } = ehrData;

  return (
    <div className="glass-panel panel-container">
      <div className="panel-header">
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>{patient.name}</h2>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
            MRN: {patient.id} &bull; DOB: {patient.birthDate} ({patient.gender}, {patient.age}yo)
          </div>
        </div>
        <span className="badge badge-pending" style={{ background: 'rgba(0, 114, 255, 0.15)', color: 'var(--accent-cyan)', borderColor: 'rgba(0, 242, 254, 0.25)' }}>
          Active EHR
        </span>
      </div>

      <div className="panel-body">
        {/* Vitals Section */}
        <div>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Current Vital Signs (Shift End)
          </h3>
          <div className="vitals-grid">
            {Object.entries(vitals).map(([name, value]) => {
              // Highlight out-of-range vitals slightly (e.g. high heart rate, lower SpO2)
              const isAbnormal = 
                (name.includes('Heart Rate') && parseInt(value) > 100) ||
                (name.includes('Oxygen Saturation') && parseInt(value) < 95);
                
              return (
                <div key={name} className="vital-card" style={isAbnormal ? { borderColor: 'var(--accent-rose)', background: 'rgba(244, 63, 94, 0.05)' } : {}}>
                  <div className="vital-label">{name}</div>
                  <div className="vital-value" style={isAbnormal ? { color: 'var(--accent-rose)' } : {}}>{value}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Clinical Diagnostics (Conditions & Allergies) */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Active Conditions
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              {conditions.map((c, i) => (
                <div key={i} style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-glass)', padding: '0.5rem 0.75rem', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem' }}>
                  {c.display}
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Allergies & Intolerances
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              {allergies.length === 0 ? (
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', padding: '0.5rem' }}>No known drug allergies</div>
              ) : (
                allergies.map((a, i) => (
                  <div
                    key={i}
                    style={{
                      background: a.criticality === 'high' ? 'rgba(244, 63, 94, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                      border: a.criticality === 'high' ? '1px solid rgba(244, 63, 94, 0.3)' : '1px solid rgba(245, 158, 11, 0.3)',
                      color: a.criticality === 'high' ? 'var(--accent-rose)' : 'var(--accent-amber)',
                      padding: '0.5rem 0.75rem',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '0.85rem',
                      fontWeight: 600
                    }}
                  >
                    {a.substance} ({a.criticality.toUpperCase()})
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Labs & Meds */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Recent Laboratory Results
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              {labs.length === 0 ? (
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', padding: '0.5rem' }}>No lab values logged this shift</div>
              ) : (
                labs.map((l, i) => (
                  <div key={i} style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-glass)', padding: '0.5rem 0.75rem', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem', display: 'flex', justifyContent: 'space-between' }}>
                    <span>{l.name}</span>
                    <span style={{ color: 'var(--accent-cyan)', fontWeight: 600 }}>{l.value}</span>
                  </div>
                ))
              )}
            </div>
          </div>

          <div>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Active Scheduled Medications
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              {medications.map((m, i) => (
                <div key={i} style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-glass)', padding: '0.5rem 0.75rem', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem' }}>
                  <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{m.name}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>{m.instructions}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Unstructured Progress Note */}
        <div>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Outgoing Shift Progress Note (Raw)
          </h3>
          <div style={{
            background: 'rgba(27, 36, 64, 0.4)',
            border: '1px solid var(--border-glass)',
            borderRadius: 'var(--radius-sm)',
            padding: '1rem',
            fontSize: '0.875rem',
            lineHeight: 1.6,
            color: '#cbd5e1',
            whiteSpace: 'pre-line',
            maxHeight: '220px',
            overflowY: 'auto',
            fontFamily: 'monospace'
          }}>
            {shiftNote.content}
          </div>
        </div>
      </div>
    </div>
  );
};
