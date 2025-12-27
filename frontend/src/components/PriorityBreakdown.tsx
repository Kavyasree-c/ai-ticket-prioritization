
import React from 'react';

interface PriorityBreakdownProps {
  breakdown: {
    effective_urgency: number;
    sla_risk: number;
    customer_tier_weight: number;
    final_score: number;
    urgency_contribution: number;
    sla_contribution: number;
    tier_contribution: number;
  };
}

const PriorityBreakdown: React.FC<PriorityBreakdownProps> = ({ breakdown }) => {
  const components = [
    {
      name: 'AI Urgency Analysis',
      value: breakdown.effective_urgency,
      weight: 0.4,
      contribution: breakdown.urgency_contribution,
      color: 'bg-blue-500',
      description: 'AI-determined urgency × confidence level',
    },
    {
      name: 'SLA Risk',
      value: breakdown.sla_risk,
      weight: 0.4,
      contribution: breakdown.sla_contribution,
      color: 'bg-orange-500',
      description: 'Time-based urgency (< 4hrs = high risk)',
    },
    {
      name: 'Customer Tier',
      value: breakdown.customer_tier_weight,
      weight: 0.2,
      contribution: breakdown.tier_contribution,
      color: 'bg-purple-500',
      description: 'Tier-1 > Tier-2 > Tier-3 > Tier-4',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Final Score */}
      <div className="text-center p-6 bg-gradient-to-r from-primary-50 to-primary-100 rounded-lg border-2 border-primary-200">
        <div className="text-sm font-medium text-primary-700 mb-2">
          Final Priority Score
        </div>
        <div className="text-5xl font-bold text-primary-900">
          {(breakdown.final_score * 100).toFixed(0)}%
        </div>
        <div className="text-sm text-primary-600 mt-2">
          Calculated: {new Date().toLocaleString()}
        </div>
      </div>

      {/* Formula */}
      <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
        <p className="text-xs font-mono text-gray-600 mb-2">Formula:</p>
        <p className="text-sm font-mono text-gray-800">
          Priority = (0.4 × Urgency) + (0.4 × SLA) + (0.2 × Tier)
        </p>
      </div>

      {/* Components Breakdown */}
      <div className="space-y-4">
        <h3 className="font-semibold text-gray-900">Score Components:</h3>
        
        {components.map((component, index) => (
          <div key={index} className="bg-white rounded-lg border border-gray-200 p-4">
            {/* Component Header */}
            <div className="flex items-center justify-between mb-3">
              <div>
                <h4 className="font-medium text-gray-900">{component.name}</h4>
                <p className="text-xs text-gray-500">{component.description}</p>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold text-gray-900">
                  {(component.value * 100).toFixed(0)}%
                </div>
                <div className="text-xs text-gray-500">
                  Weight: {(component.weight * 100).toFixed(0)}%
                </div>
              </div>
            </div>

            {/* Visual Bar */}
            <div className="space-y-2">
              {/* Component Value Bar */}
              <div>
                <div className="flex justify-between text-xs text-gray-600 mb-1">
                  <span>Component Value</span>
                  <span>{(component.value * 100).toFixed(0)}%</span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${component.color} transition-all duration-500`}
                    style={{ width: `${component.value * 100}%` }}
                  />
                </div>
              </div>

              {/* Contribution Bar */}
              <div>
                <div className="flex justify-between text-xs text-gray-600 mb-1">
                  <span>Contribution to Final Score</span>
                  <span>{(component.contribution * 100).toFixed(1)}%</span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${component.color} opacity-60 transition-all duration-500`}
                    style={{ width: `${(component.contribution / breakdown.final_score) * 100}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Calculation */}
            <div className="mt-2 p-2 bg-gray-50 rounded text-xs font-mono text-gray-600">
              {(component.value * 100).toFixed(0)}% × {(component.weight * 100).toFixed(0)}% = {(component.contribution * 100).toFixed(1)}%
            </div>
          </div>
        ))}
      </div>

      {/* Key Insight */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex gap-2">
          <span className="text-blue-600 text-lg">💡</span>
          <div className="text-sm text-blue-900">
            <p className="font-medium mb-1">Key Design Decision:</p>
            <p className="text-blue-800">
              AI urgency is weighted at 40% (max), so even a "critical" AI assessment 
              at 100% confidence can only contribute 40% to the final score. This ensures 
              SLA requirements and customer tier are always respected, demonstrating 
              responsible AI design with human oversight.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PriorityBreakdown;