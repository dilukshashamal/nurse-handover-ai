import React from 'react';
import { HeartPulse } from 'lucide-react';

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
      <div className="glass-panel panel-container" style={{ justifyContent: 'center', alignItems: 'center' }}>
        <div className="empty-state">
          <HeartPulse size={48} style={{ color: 'var(--text-muted)', margin: '0 auto 1.25rem', display: 'block' }} />
          <h3 style={{ fontFamily: 'var(--font-display)', color: 'var(--text-h)' }}>No Patient Selected</h3>
          <p style={{ fontSize: '0.9rem', marginTop: '0.5rem', color: 'var(--text-muted)' }}>
            Select a patient from the census board to display their Electronic Health Record (EHR) profile.
          </p>
        </div>
      </div>
    );
  }

  const { patient, conditions, allergies, vitals, labs, medications, shiftNote } = ehrData;

  return (
    <div className="glass-panel panel-container">
      <div className="panel-header">
        <div>
          <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-h)' }}>{patient.name}</h2>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
            MRN: {patient.id} &bull; DOB: {patient.birthDate} ({patient.gender}, {patient.age}yo)
          </div>
        </div>
        <span className="badge badge-info">Active EHR</span>
      </div>

      <div className="panel-body">
        {/* Vitals Section */}
        <div>
          <h3 className="section-label">Current Vital Signs (Shift End)</h3>
          <div className="vitals-grid">
            {Object.entries(vitals).map(([name, value]) => {
              // Highlight out-of-range vitals slightly (e.g. high heart rate, lower SpO2)
              const isAbnormal =
                (name.includes('Heart Rate') && parseInt(value) > 100) ||
                (name.includes('Oxygen Saturation') && parseInt(value) < 95);

              return (
                <div key={name} className="vital-card" style={isAbnormal ? { borderColor: 'var(--accent-rose)', background: 'var(--accent-rose-bg)' } : {}}>
                  <div className="vital-label">{name}</div>
                  <div className="vital-value" style={isAbnormal ? { color: 'var(--accent-rose)' } : {}}>{value}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Clinical Diagnostics (Conditions & Allergies) */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
          <div>
            <h3 className="section-label">Active Conditions</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              {conditions.map((c, i) => (
                <div key={i} className="info-chip">
                  {c.display}
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="section-label">Allergies &amp; Intolerances</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              {allergies.length === 0 ? (
                <div className="empty-note">No known drug allergies</div>
              ) : (
                allergies.map((a, i) => (
                  <div key={i} className={`allergy-chip ${a.criticality === 'high' ? 'allergy-high' : 'allergy-low'}`}>
                    {a.substance} ({a.criticality.toUpperCase()})
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Labs & Meds */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
          <div>
            <h3 className="section-label">Recent Laboratory Results</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              {labs.length === 0 ? (
                <div className="empty-note">No lab values logged this shift</div>
              ) : (
                labs.map((l, i) => (
                  <div key={i} className="info-chip info-chip-row">
                    <span>{l.name}</span>
                    <span className="info-chip-value">{l.value}</span>
                  </div>
                ))
              )}
            </div>
          </div>

          <div>
            <h3 className="section-label">Active Scheduled Medications</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              {medications.map((m, i) => (
                <div key={i} className="info-chip">
                  <div className="med-name">{m.name}</div>
                  <div className="med-instructions">{m.instructions}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Unstructured Progress Note */}
        <div>
          <h3 className="section-label">Outgoing Shift Progress Note (Raw)</h3>
          <div className="raw-note-box">
            {shiftNote.content}
          </div>
        </div>
      </div>
    </div>
  );
};