import { useState, useEffect } from 'react';
import { PatientSelector } from './components/PatientSelector';
import type { PatientSummary } from './components/PatientSelector';
import { PatientEhrPanel } from './components/PatientEhrPanel';
import type { PatientEhrData } from './components/PatientEhrPanel';
import { SbarSummaryPanel } from './components/SbarSummaryPanel';
import type { SbarContent, HandoverLog } from './components/SbarSummaryPanel';

// Read API URL from Vite env or fallback to local port 8000
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

function App() {
  const [patients, setPatients] = useState<PatientSummary[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  
  const [patientData, setPatientData] = useState<PatientEhrData | null>(null);
  const [sbarDraft, setSbarDraft] = useState<SbarContent | null>(null);
  const [history, setHistory] = useState<HandoverLog[]>([]);

  // Loading States
  const [loadingPatients, setLoadingPatients] = useState(true);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [generatingSbar, setGeneratingSbar] = useState(false);
  const [approvingHandover, setApprovingHandover] = useState(false);
  
  // Connection Error State
  const [apiError, setApiError] = useState<string | null>(null);

  // Load Patient List on startup
  useEffect(() => {
    fetchPatients();
  }, []);

  // Load patient details whenever the selected patient changes
  useEffect(() => {
    if (selectedPatientId) {
      loadPatientDetails(selectedPatientId);
    } else {
      setPatientData(null);
      setSbarDraft(null);
      setHistory([]);
    }
  }, [selectedPatientId]);

  const fetchPatients = async () => {
    try {
      setLoadingPatients(true);
      setApiError(null);
      const res = await fetch(`${API_URL}/api/patients`);
      if (!res.ok) throw new Error("Failed to retrieve patient index.");
      const data = await res.json();
      setPatients(data);
      
      // Auto-select first patient if none selected
      if (data.length > 0 && !selectedPatientId) {
        setSelectedPatientId(data[0].id);
      }
    } catch (e: any) {
      setApiError(`Backend connection failed. Make sure the FastAPI server is running at ${API_URL}. Details: ${e.message}`);
    } finally {
      setLoadingPatients(false);
    }
  };

  const loadPatientDetails = async (patientId: string) => {
    try {
      setLoadingDetails(true);
      
      // 1. Fetch Patient EHR
      const ehrRes = await fetch(`${API_URL}/api/patients/${patientId}`);
      if (!ehrRes.ok) throw new Error("Failed to fetch EHR records.");
      const ehrData = await ehrRes.json();
      setPatientData(ehrData);

      // 2. Fetch Handover Audit Logs
      const historyRes = await fetch(`${API_URL}/api/patients/${patientId}/history`);
      if (historyRes.ok) {
        const historyData = await historyRes.json();
        setHistory(historyData);
      }

      // 3. Fetch Active SBAR Draft
      const draftRes = await fetch(`${API_URL}/api/patients/${patientId}/draft`);
      if (draftRes.ok) {
        const draftData = await draftRes.json();
        setSbarDraft(draftData.sbar);
      }
    } catch (e: any) {
      console.error(e);
      alert(`Error loading patient records: ${e.message}`);
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleGenerateSbar = async () => {
    if (!selectedPatientId) return;
    try {
      setGeneratingSbar(true);
      const res = await fetch(`${API_URL}/api/patients/${selectedPatientId}/generate-sbar`, {
        method: 'POST'
      });
      if (!res.ok) throw new Error("AI Summarization failed.");
      const sbarData = await res.json();
      setSbarDraft(sbarData);
    } catch (e: any) {
      alert(`AI summary generation failed: ${e.message}`);
    } finally {
      setGeneratingSbar(false);
    }
  };

  const handleSaveDraft = async (updatedSbar: SbarContent) => {
    if (!selectedPatientId) return;
    try {
      await fetch(`${API_URL}/api/patients/${selectedPatientId}/draft`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sbar: updatedSbar })
      });
      setSbarDraft(updatedSbar);
    } catch (e) {
      console.error("Draft saving error", e);
    }
  };

  const handleApproveHandover = async (nurseName: string, approvedSbar: SbarContent) => {
    if (!selectedPatientId) return;
    try {
      setApprovingHandover(true);
      const res = await fetch(`${API_URL}/api/patients/${selectedPatientId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nurseName, sbar: approvedSbar })
      });
      
      if (!res.ok) throw new Error("Approval processing failed.");
      
      // Refresh Census and details
      await fetchPatients();
      await loadPatientDetails(selectedPatientId);
      
      alert(`Handover signed and logged successfully by RN ${nurseName}.`);
    } catch (e: any) {
      alert(`Failed to approve handover: ${e.message}`);
    } finally {
      setApprovingHandover(false);
    }
  };

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <header className="app-header">
        <div className="app-title">
          <span className="app-logo">🩺</span> Clinical Handoff Assistant
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            EHR Integration: <span style={{ color: 'var(--accent-emerald)', fontWeight: 600 }}>Active (Synthetic FHIR)</span>
          </span>
          <button className="btn btn-secondary" onClick={fetchPatients} style={{ padding: '0.5rem 0.75rem' }}>
            🔄 Refresh
          </button>
        </div>
      </header>

      {apiError && (
        <div style={{ background: 'rgba(244, 63, 94, 0.15)', borderBottom: '1px solid rgba(244, 63, 94, 0.3)', color: 'var(--accent-rose)', padding: '0.75rem 2rem', fontSize: '0.9rem', textAlign: 'center' }}>
          ⚠️ {apiError}
        </div>
      )}

      <main className="dashboard-container">
        <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '1.5rem', flex: 1, minHeight: 0 }}>
          {/* Left panel: Census Board */}
          <PatientSelector
            patients={patients}
            selectedPatientId={selectedPatientId}
            onSelectPatient={setSelectedPatientId}
            isLoading={loadingPatients}
          />

          {/* Right panel split screen: Patient EHR and SBAR Summarizer */}
          <div className="split-screen">
            <PatientEhrPanel
              ehrData={patientData}
              isLoading={loadingDetails}
            />

            <SbarSummaryPanel
              patientId={selectedPatientId || ''}
              sbar={sbarDraft}
              onGenerate={handleGenerateSbar}
              onSaveDraft={handleSaveDraft}
              onApprove={handleApproveHandover}
              isGenerating={generatingSbar}
              isApproving={approvingHandover}
              history={history}
            />
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
