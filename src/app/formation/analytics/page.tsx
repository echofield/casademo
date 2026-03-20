import { getCurrentUser } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { AppShell, PageHeader, StatCard } from '@/components'
import {
  LearnerProfile,
  CompetencyRadar,
  LearningMomentum,
  InsightCapture,
  CostROIChart,
  EnvironmentalImpact,
} from '@/components/formation'

/**
 * Formation Analytics Dashboard
 * EdTech dashboard with Aura-inspired instrument aesthetic
 * Fuses Casa One's editorial clarity with dynamic data visualization
 */

// Mock data - replace with real API calls
const MOCK_LEARNER_PROFILE = {
  engagement: 78,
  comprehension: 85,
  retention: 72,
  initiative: 64,
  gaps: 23,
}

const MOCK_COMPETENCY_FIELD = {
  technical: 0.75,
  soft_skills: 0.68,
  methodology: 0.82,
  autonomy: 0.55,
  collaboration: 0.71,
  adaptability: 0.63,
}

const MOCK_MOMENTUM_DATA = {
  engagement: 0.72,
  progress: 0.65,
  consistency: 0.58,
}

export default async function FormationAnalyticsPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  // Only supervisors can access formation analytics
  if (user.profile.role !== 'supervisor') {
    redirect('/queue')
  }

  return (
    <AppShell userRole={user.profile.role} userName={user.profile.full_name}>
      <div className="mx-auto max-w-6xl animate-fade-in">
        <PageHeader
          title="Formation Analytics"
          subtitle="Vue d'ensemble et tendances d'apprentissage"
        />

        {/* KPI Row - Casa One MiniStat style */}
        <div className="mb-10 grid grid-cols-2 gap-3 md:grid-cols-4">
          <StatCard label="Apprenants actifs" value="847" />
          <StatCard label="Taux completion" value="86%" tone="success" />
          <StatCard label="NPS Moyen" value="+67" tone="gold" />
          <StatCard label="Heures économisées" value="1.2k" />
        </div>

        {/* This Week Summary - Casa One hero block */}
        <section
          className="mb-10 border bg-surface p-6 md:p-8"
          style={{ borderColor: 'rgba(28, 27, 25, 0.08)' }}
        >
          <p className="label mb-4 text-text-muted">Cette semaine</p>
          <h2 className="heading-2 mb-3 max-w-3xl text-text">
            L'engagement progresse de <span className="text-success">+12%</span> sur l'ensemble des cohortes.
          </h2>
          <p className="body max-w-2xl text-text-muted">
            Les modules techniques montrent une rétention forte. L'initiative individuelle reste un axe de développement.
          </p>
        </section>

        {/* Aura-inspired instruments row */}
        <div className="mb-10 grid gap-6 md:grid-cols-2">
          <LearnerProfile data={MOCK_LEARNER_PROFILE} />
          <CompetencyRadar field={MOCK_COMPETENCY_FIELD} />
        </div>

        {/* Momentum wave - full width */}
        <div className="mb-10">
          <LearningMomentum data={MOCK_MOMENTUM_DATA} />
        </div>

        {/* Department breakdown table - Casa One style */}
        <section
          className="mb-10 border bg-surface p-6"
          style={{ borderColor: 'rgba(28, 27, 25, 0.08)' }}
        >
          <h2 className="label mb-6 text-text-muted">Progression par département</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(28, 27, 25, 0.08)' }}>
                  <th className="label py-3 pr-4 text-left font-semibold text-text-muted">Département</th>
                  <th className="label py-3 px-3 text-center font-semibold text-text-muted">Apprenants</th>
                  <th className="label py-3 px-3 text-center font-semibold text-text-muted">Completion</th>
                  <th className="label py-3 pl-3 text-center font-semibold text-text-muted">Tendance</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { name: 'Commercial', learners: 234, completion: 92, trend: 'up' },
                  { name: 'Technique', learners: 189, completion: 78, trend: 'up' },
                  { name: 'Support', learners: 156, completion: 85, trend: 'stable' },
                  { name: 'RH', learners: 89, completion: 71, trend: 'down' },
                  { name: 'Finance', learners: 67, completion: 88, trend: 'up' },
                ].map((dept) => (
                  <tr key={dept.name} style={{ borderBottom: '1px solid rgba(28, 27, 25, 0.05)' }}>
                    <td className="py-4 pr-4">
                      <span className="table-value text-text">{dept.name}</span>
                    </td>
                    <td className="py-4 px-3 text-center">
                      <span className="text-sm text-text-muted">{dept.learners}</span>
                    </td>
                    <td className="py-4 px-3 text-center">
                      <span className={`metric-small ${dept.completion >= 85 ? 'text-success' : dept.completion >= 75 ? 'text-gold' : 'text-text'}`}>
                        {dept.completion}%
                      </span>
                    </td>
                    <td className="py-4 pl-3 text-center">
                      <TrendBadge trend={dept.trend as 'up' | 'down' | 'stable'} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Bottom row - Recharts visualizations */}
        <div className="mb-10 grid gap-6 md:grid-cols-2">
          <CostROIChart />
          <EnvironmentalImpact />
        </div>

        {/* Insight capture - subtle footer action */}
        <div className="flex justify-center pb-8">
          <InsightCapture moduleId="analytics-dashboard" />
        </div>
      </div>
    </AppShell>
  )
}

function TrendBadge({ trend }: { trend: 'up' | 'down' | 'stable' }) {
  const styles = {
    up: 'bg-success-soft text-success',
    down: 'bg-overdue-soft text-danger',
    stable: 'bg-gold-soft text-gold',
  }

  const labels = {
    up: '↑ En hausse',
    down: '↓ En baisse',
    stable: '→ Stable',
  }

  return (
    <span className={`inline-block px-2 py-1 text-xs font-medium ${styles[trend]}`}>
      {labels[trend]}
    </span>
  )
}

