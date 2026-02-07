import { useState } from 'react';
import { aiRecommendations } from '@/data/mockData';
import { AIRecommendation } from '@/types/machine';
import { Button } from '@/components/ui/button';
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Brain, 
  ChevronRight,
  Play,
  ArrowRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface DecisionsExplainabilityProps {
  onResimulate: () => void;
}

export function DecisionsExplainability({ onResimulate }: DecisionsExplainabilityProps) {
  const [recommendations, setRecommendations] = useState<AIRecommendation[]>(aiRecommendations);
  const [approvedAction, setApprovedAction] = useState<string | null>(null);

  const handleApprove = (id: string) => {
    setRecommendations(prev => 
      prev.map(r => r.id === id ? { ...r, approved: true } : r)
    );
    setApprovedAction(id);
    toast.success('Action approved. Monitoring system response...');
  };

  const handleReject = (id: string) => {
    setRecommendations(prev => 
      prev.map(r => r.id === id ? { ...r, approved: false } : r)
    );
    toast.info('Action rejected. Consider re-simulating alternatives.');
  };

  const getImpactColor = (impact: 'high' | 'medium' | 'low') => {
    switch (impact) {
      case 'high': return 'bg-destructive/20 text-destructive border-destructive/30';
      case 'medium': return 'bg-warning/20 text-warning border-warning/30';
      case 'low': return 'bg-success/20 text-success border-success/30';
    }
  };

  const getUrgencyConfig = (urgency: 'high' | 'medium' | 'low') => {
    switch (urgency) {
      case 'high': return { color: 'text-destructive', bg: 'bg-destructive/10', label: 'Urgent' };
      case 'medium': return { color: 'text-warning', bg: 'bg-warning/10', label: 'Moderate' };
      case 'low': return { color: 'text-success', bg: 'bg-success/10', label: 'Low Priority' };
    }
  };

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Header */}
      <div>
        <h2 className="text-xl font-semibold mb-1 flex items-center gap-2">
          <Brain className="w-6 h-6 text-primary" />
          AI Recommendations
        </h2>
        <p className="text-sm text-muted-foreground">
          Review explainable AI recommendations and approve maintenance actions
        </p>
      </div>

      {/* Approved Action Confirmation */}
      {approvedAction && (
        <div className="card-glow rounded-lg p-5 border-success/30 bg-success/5 animate-slide-up">
          <div className="flex items-center gap-3 mb-3">
            <CheckCircle className="w-5 h-5 text-success" />
            <span className="font-semibold text-success">Action Approved</span>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            Monitoring system response. Changes will be applied and tracked.
          </p>
          <Button variant="outline" size="sm" className="gap-2">
            <ArrowRight className="w-4 h-4" />
            View Post-Action Sensor Data
          </Button>
        </div>
      )}

      {/* Recommendations */}
      <div className="space-y-4">
        {recommendations.map((rec) => {
          const urgencyConfig = getUrgencyConfig(rec.urgency);
          
          return (
            <div 
              key={rec.id} 
              className={cn(
                'card-glow rounded-lg overflow-hidden',
                rec.approved === true && 'border-success/30',
                rec.approved === false && 'opacity-50'
              )}
            >
              {/* Recommendation Header */}
              <div className="p-5">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={cn(
                        'text-xs font-medium px-2 py-1 rounded',
                        urgencyConfig.bg,
                        urgencyConfig.color
                      )}>
                        {urgencyConfig.label}
                      </span>
                      <span className="text-xs text-muted-foreground font-mono">{rec.id}</span>
                    </div>
                    <h3 className="font-semibold text-lg">{rec.action}</h3>
                  </div>
                  
                  {rec.approved === true && (
                    <CheckCircle className="w-6 h-6 text-success flex-shrink-0" />
                  )}
                  {rec.approved === false && (
                    <XCircle className="w-6 h-6 text-muted-foreground flex-shrink-0" />
                  )}
                </div>

                {/* Explanation Box */}
                <div className="bg-secondary/50 rounded-lg p-4 mb-4">
                  <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-warning" />
                    Why this decision?
                  </h4>
                  <ul className="space-y-2">
                    {rec.reasoning.map((reason, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <ChevronRight className="w-4 h-4 mt-0.5 text-primary flex-shrink-0" />
                        {reason}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Feature Importance */}
                <div className="mb-4">
                  <h4 className="text-sm font-semibold mb-3">Feature Importance</h4>
                  <div className="flex flex-wrap gap-2">
                    {rec.featureImportance.map((fi, idx) => (
                      <span
                        key={idx}
                        className={cn(
                          'text-xs font-medium px-3 py-1.5 rounded-full border',
                          getImpactColor(fi.impact)
                        )}
                      >
                        {fi.feature} → {fi.impact.charAt(0).toUpperCase() + fi.impact.slice(1)}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Action Buttons */}
                {rec.approved === undefined && (
                  <div className="flex flex-wrap gap-3">
                    <Button 
                      onClick={() => handleApprove(rec.id)}
                      className="gap-2"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Approve Recommendation
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => handleReject(rec.id)}
                      className="gap-2"
                    >
                      <XCircle className="w-4 h-4" />
                      Reject / Override
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={onResimulate}
                      className="gap-2"
                    >
                      <Play className="w-4 h-4" />
                      Re-simulate Alternative
                    </Button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
