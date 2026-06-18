import React, { useState, useMemo } from 'react';
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
  const [searchTerm, setSearchTerm] = useState('');

  const filteredPatients = useMemo(() => {
    if (!searchTerm.trim()) return patients;
    
    const term = searchTerm.toLowerCase();
    return patients.filter(patient => 
      patient.name.toLowerCase().includes(term) ||
      patient.conditions.some(condition => 
        condition.toLowerCase().includes(term)
      ) ||
      patient.id.toLowerCase().includes(term)
    );
  }, [patients, searchTerm]);

  return (
    <div className="card-panel" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem', height: '100%' }}>
      <h2 style={{ fontSize: '1.125rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-primary)' }}>
        <ClipboardList size={20} color="var(--accent-primary)" /> Patient Census Board
      </h2>
      
      {/* Search Input */}
      <input
        type="text"
        className="search-input"
        placeholder="Search patients by name, condition, or MRN..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        aria-label="Search patients"
      />
      
      {isLoading && patients.length === 0 ? (
        <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
          Loading patients...
        </div>
      ) : filteredPatients.length === 0 ? (
        <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          No patients found matching "{searchTerm}"
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {filteredPatients.map((patient) => {
            const isActive = selectedPatientId === patient.id;
            const isApproved = patient.status === 'Approved';
            
            return (
              <div
                key={patient.id}
                className={`patient-card ${isActive ? 'active' : ''}`}
                onClick={() => onSelectPatient(patient.id)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onSelectPatient(patient.id);
                  }
                }}
                aria-pressed={isActive}
                aria-label={`Select patient ${patient.name}`}
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
                    <div style={{ fontSize: '0.75rem', color: 'var(--accent-success)', marginTop: '0.25rem' }}>
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
