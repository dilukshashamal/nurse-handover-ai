import React from 'react';
import { ClipboardList } from 'lucide-react';

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
      <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.15rem', fontWeight: 600, color: 'var(--text-h)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <ClipboardList size={18} style={{ color: 'var(--accent-blue)' }} /> Patient Census Board
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
                <div className="patient-card-info">
                  <div className="patient-card-name">
                    {patient.name}
                    <span className="patient-card-meta">
                      ({patient.gender.charAt(0)}, {patient.age}yo)
                    </span>
                  </div>
                  <div className="patient-card-conditions">
                    {patient.conditions.join(', ')}
                  </div>
                  {isApproved && (
                    <div className="patient-card-approved">
                      Approved by {patient.lastHandoffBy}
                    </div>
                  )}
                </div>
                <div className="patient-card-status">
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