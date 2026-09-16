import { useGame } from "@/lib/GameContext";
import { formatMoney, formatCompact, formatDays } from "@/lib/formatters";
import { JOBS, BUSINESSES, INVESTMENTS, DAYS_PER_YEAR } from "@/lib/gameData";
import { getBusinessEffectiveROI, getBusinessNetworkBonus } from "@/lib/GameContext";

export default function LedgerPanel() {
  const { state, derived } = useGame();
  const s = state.stats;
  const days = Math.max(1, state.day);

  const earned =
    s.salaryEarned + s.shiftEarned + s.businessEarned + s.investmentGains + s.eventGains;
  const spent =
    s.livingSpent + s.trainingSpent + s.managerSpent + s.retainerSpent + s.assetSpent +
    s.businessSpent + s.educationSpent + s.consultantSpent + s.loanInterestPaid +
    s.ccInterestPaid + s.eventLosses + s.taxesPaid;

  return (
    <div className="space-y-6">
      <div className="surface-card rounded-xl p-4">
        <h3 className="text-xs uppercase tracking-widest text-muted-foreground mb-3">
          Lifetime · {formatDays(state.day)}
        </h3>
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div>
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Earned</p>
            <p className="font-mono-nums text-lg text-primary">{formatMoney(earned)}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Spent</p>
            <p className="font-mono-nums text-lg text-destructive">{formatMoney(spent)}</p>
          </div>
        </div>
        <p className="text-[11px] text-muted-foreground">
          Averaging {formatMoney(earned / days)}/day earned against {formatMoney(spent / days)}/day out.
        </p>
      </div>

      <Section title="Where the money came from">
        <Line label="Salary" value={s.salaryEarned} days={days} />
        <Line label="Extra shifts" value={s.shiftEarned} days={days} />
        <Line label="Businesses" value={s.businessEarned} days={days} />
        <Line label="Investments" value={s.investmentGains} days={days} />
        <Line label="Luck and events" value={s.eventGains} days={days} />
      </Section>

      <Section title="Where it went">
        <Line label="Tax" value={-s.taxesPaid} days={days} />
        <Line label="Lifestyle" value={-s.livingSpent} days={days} />
        <Line label="Training" value={-s.trainingSpent} days={days} />
        <Line label="Tuition" value={-s.educationSpent} days={days} />
        <Line label="Managers" value={-s.managerSpent} days={days} />
        <Line label="Consultant retainers" value={-s.retainerSpent} days={days} />
        <Line label="Consultant hiring" value={-s.consultantSpent} days={days} />
        <Line label="Business purchases" value={-s.businessSpent} days={days} />
        <Line label="Loan interest" value={-s.loanInterestPaid} days={days} />
        <Line label="Card interest" value={-s.ccInterestPaid} days={days} />
        <Line label="Bad luck" value={-s.eventLosses} days={days} />
      </Section>

      <Section title="Career history">
        {state.jobHistory.map((h, i) => {
          const id = JOBS[Math.min(i, JOBS.length - 1)].id;
          const isCurrent = i === state.jobHistory.length - 1;
          return (
            <div key={`${h.title}-${h.startDay}-${i}`} className="flex justify-between gap-3 text-sm">
              <span className="text-muted-foreground min-w-0">
                {h.title}
                <span className="block text-[10px]">
                  {h.employer} · from day {h.startDay} · {formatMoney(h.dailyPay)}/day
                </span>
                <span className="block text-[10px]">
                  {Math.round(s.jobDays[id] || 0)} days worked · {s.shifts[id] || 0} extra shifts
                  {isCurrent ? " · current" : ""}
                </span>
              </span>
              <span className="font-mono-nums text-primary shrink-0">{formatCompact(s.jobEarned[id] || 0)}</span>
            </div>
          );
        })}
      </Section>

      <Section title="Return on what you own">
        {BUSINESSES.filter((b) => (state.businesses[b.id]?.level || 0) > 0).map((b) => {
          const capital = derived.businessCapital;
          const lifetime = s.businessEarnedById[b.id] || 0;
          return (
            <div key={b.id} className="flex justify-between text-sm">
              <span className="text-muted-foreground">
                {b.name}
                <span className="block text-[10px]">
                  {(getBusinessEffectiveROI(state, b.id) * 100).toFixed(0)}% effective return
                  {getBusinessNetworkBonus(state, b.id) > 0
                    ? ` · +${(getBusinessNetworkBonus(state, b.id) * 100).toFixed(0)}% network`
                    : ""}
                </span>
              </span>
              <span className="font-mono-nums text-primary">{formatCompact(lifetime)}</span>
            </div>
          );
        })}
        {INVESTMENTS.filter((i) => (state.investments[i.id]?.value || 0) > 0 || (s.investEarnedById[i.id] || 0) !== 0).map((i) => {
          const inv = state.investments[i.id] || { value: 0, basis: 0 };
          const lifetime = s.investEarnedById[i.id] || 0;
          const realised = inv.basis > 0 ? (lifetime / inv.basis) * (DAYS_PER_YEAR / days) : 0;
          return (
            <div key={i.id} className="flex justify-between text-sm">
              <span className="text-muted-foreground">
                {i.name}
                <span className="block text-[10px]">
                  holding {formatCompact(inv.value)} · realised {(realised * 100).toFixed(1)}%/yr
                </span>
              </span>
              <span className={`font-mono-nums ${lifetime >= 0 ? "text-primary" : "text-destructive"}`}>
                {formatCompact(lifetime)}
              </span>
            </div>
          );
        })}
      </Section>

      <Section title="What happened to you">
        {state.events.length === 0 && (
          <p className="text-[11px] text-muted-foreground">Quiet so far.</p>
        )}
        {state.events.map((e, i) => (
          <div key={i} className="text-sm">
            <p className={e.tone === "good" ? "text-primary" : e.tone === "bad" ? "text-destructive" : ""}>
              {e.title}
              <span className="text-[10px] text-muted-foreground ml-2">Day {e.day + 1}</span>
            </p>
            <p className="text-[11px] text-muted-foreground">{e.text}</p>
          </div>
        ))}
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-xs uppercase tracking-widest text-muted-foreground mb-3 px-1">{title}</h3>
      <div className="surface-card rounded-xl p-4 space-y-2">{children}</div>
    </div>
  );
}

function Line({ label, value, days }: { label: string; value: number; days: number }) {
  if (Math.abs(value) < 0.5) return null;
  return (
    <div className="flex justify-between text-sm">
      <span className="text-muted-foreground">
        {label}
        <span className="block text-[10px]">{formatMoney(Math.abs(value) / days)}/day average</span>
      </span>
      <span className={`font-mono-nums ${value >= 0 ? "text-primary" : "text-destructive"}`}>
        {formatCompact(Math.abs(value))}
      </span>
    </div>
  );
}
