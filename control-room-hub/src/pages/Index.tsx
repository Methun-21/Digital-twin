import { useState } from 'react';
import { Navigation } from '@/components/Navigation';
import { OverviewDashboard } from '@/components/OverviewDashboard';
import { MachineDetails } from '@/components/MachineDetails';
import { DigitalTwinSimulation } from '@/components/DigitalTwinSimulation';
import { DecisionsExplainability } from '@/components/DecisionsExplainability';

const Index = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedMachineId, setSelectedMachineId] = useState('B1');

  const handleViewMachine = (machineId: string) => {
    setSelectedMachineId(machineId);
    setActiveTab('machine');
  };

  const handleViewSimulation = () => {
    setActiveTab('simulation');
  };

  const handleViewDecisions = () => {
    setActiveTab('decisions');
  };

  return (
    <div className="min-h-screen">
      <Navigation activeTab={activeTab} onTabChange={setActiveTab} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'dashboard' && (
          <OverviewDashboard
            onViewMachine={handleViewMachine}
            onViewSimulation={handleViewSimulation}
            onViewDecisions={handleViewDecisions}
          />
        )}

        {activeTab === 'machine' && (
          <MachineDetails
            selectedMachineId={selectedMachineId}
            onMachineChange={setSelectedMachineId}
            onSimulate={handleViewSimulation}
            onViewExplanation={handleViewDecisions}
          />
        )}

        {activeTab === 'simulation' && (
          <DigitalTwinSimulation
            selectedMachineId={selectedMachineId}
            onMachineChange={setSelectedMachineId}
          />
        )}

        {activeTab === 'decisions' && (
          <DecisionsExplainability
            onResimulate={handleViewSimulation}
          />
        )}
      </main>
    </div>
  );
};

export default Index;
