import React from 'react';

export interface PatientSummary {
  id: string;
  name: string;
  age: number;
  gender: string;
  conditions: string[];
  status: 'Approved' | 'Pending Handoff';
  lastHandoffBy?: string;
  lastHandoffTime?: string;
}

interface PatientSelectorProps {
  patients: PatientSummary[];
  selectedPatientId: string | null;
  onSelectPatient: (id: string) => void;
  isLoading: boolean;
}

export const PatientSelector: React.FC<PatientSelectorProps> = ({
  patients,
  selectedPatientId,
  onSelectPatient,
  isLoading
}) => {
  return (
    <div className="glass-panel" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <span style={{ color: 'var(--accent-cyan)' }}>📋</span> Patient Census Board
      </h2>
      
      {isLoading && patients.length === 0 ? (
        <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
          Loading patients...
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {patients.map((patient) => {
            const isActive = selectedPatientId === patient.id;
            const isApproved = patient.status === 'Approved';
            
            return (
              <div
                key={patient.id}
                className={`patient-card ${isActive ? 'active' : ''}`}
                onClick={() => onSelectPatient(patient.id)}
              >
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {patient.name}
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 400 }}>
                      ({patient.gender.charAt(0)}, {patient.age}yo)
                    </span>
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: '300px' }}>
                    {patient.conditions.join(', ')}
                  </div>
                  {isApproved && (
                    <div style={{ fontSize: '0.75rem', color: 'var(--accent-emerald)', marginTop: '0.25rem' }}>
                      Approved by {patient.lastHandoffBy}
                    </div>
                  )}
                </div>
                <div>
                  <span className={`badge ${isApproved ? 'badge-approved' : 'badge-pending'}`}>
                    {patient.status}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
