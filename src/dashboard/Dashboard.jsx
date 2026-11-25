import { useEffect, useId, useState } from 'react';
import { Avatar, Button } from '@mui/material';
import {
  AccountBalanceWalletOutlined, AddRounded, EventRepeatOutlined,
  LightbulbOutlined, SubscriptionsOutlined,
} from '@mui/icons-material';
import { buildDashboard, formatCalendarDate, formatMoney } from './dashboardModel.js';
import { getSubscriptionIcon } from '../subscriptions/presetIcons.js';
import './dashboard.css';

const formatDate = (date) => date.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });

function RenewalBadge({ status, date }) {
  return (
    <span className={`renewal-badge renewal-badge--${status.tone}`}>
      <span className="renewal-dot" aria-hidden="true" />
      {date && <><time dateTime={formatCalendarDate(date)}>{formatDate(date)}</time><span aria-hidden="true"> · </span></>}
      {status.label}
    </span>
  );
}

function SpendChart({ categories, total }) {
  const titleId = useId();
  const circumference = 2 * Math.PI * 70;
  return (
    <section className="dashboard-card dashboard-panel" aria-labelledby={`${titleId}-heading`} id="spending">
      <h2 id={`${titleId}-heading`}>Spend by category</h2>
      <div className="spend-chart">
        <svg viewBox="0 0 190 190" role="img" aria-labelledby={titleId}>
          <title id={titleId}>Monthly spending by category. Exact amounts are listed below.</title>
          <circle cx="95" cy="95" r="70" fill="none" stroke="#f1f5f4" strokeWidth="22" />
          {categories.map((category, index) => {
            const length = total > 0 ? category.cost / total * circumference : 0;
            const offset = total > 0 ? categories.slice(0, index).reduce((sum, item) => sum + item.cost, 0) / total * circumference : 0;
            return (
              <circle key={category.name} cx="95" cy="95" r="70" fill="none" stroke={category.color} strokeWidth="22"
                strokeDasharray={`${Math.max(length - 4, 0)} ${circumference}`} strokeDashoffset={-offset} transform="rotate(-90 95 95)" />
            );
          })}
        </svg>
        <div className="spend-chart-center" aria-hidden="true"><strong>{formatMoney(total)}</strong><span>per month</span></div>
      </div>
      {categories.length ? (
        <ul className="category-legend">
          {categories.map((category) => (
            <li key={category.name}>
              <span className="category-name"><i style={{ background: category.color }} aria-hidden="true" />{category.name}</span>
              <span className="category-amount">{formatMoney(category.cost)} <span>· {total > 0 ? Math.round(category.cost / total * 100) : 0}%</span></span>
            </li>
          ))}
        </ul>
      ) : <p className="dashboard-empty">Add a subscription to see your spending breakdown.</p>}
    </section>
  );
}

export default function Dashboard({ subscriptions, onAddSubscription, onEditSubscription, onDeleteSubscription }) {
  const [today, setToday] = useState(() => new Date());
  useEffect(() => {
    // Refresh relative dates at local midnight, including daylight-saving changes.
    const nextDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
    const timer = window.setTimeout(() => setToday(new Date()), Math.max(1000, nextDay.getTime() - Date.now()));
    return () => window.clearTimeout(timer);
  }, [today]);
  const { entries, upcoming, overdueCount, totalMonthly, nextUpcoming, categories, largest } = buildDashboard(subscriptions, today);

  return (
    <div className="dashboard">
      <header className="dashboard-heading">
        <div>
          <p className="dashboard-eyebrow">{today.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
          <h1>Dashboard Overview</h1>
          <p className="dashboard-subtitle">Track your active subscriptions, monthly costs, and upcoming renewals.</p>
        </div>
        <Button className="add-subscription-button" variant="contained" startIcon={<AddRounded />} onClick={onAddSubscription}>Add Subscription</Button>
      </header>

      <section className="dashboard-stats" aria-label="Subscription overview">
        <article className="dashboard-card dashboard-stat expense-hero">
          <div className="stat-label"><h2>Total Monthly Expense</h2><span className="stat-icon"><AccountBalanceWalletOutlined fontSize="small" /></span></div>
          <p className="stat-value">{formatMoney(totalMonthly)}</p>
          <div className="stat-footer"><span className="yearly-estimate">{formatMoney(totalMonthly * 12)} / year</span><span>Estimated recurring spend</span></div>
        </article>
        <article className="dashboard-card dashboard-stat">
          <div className="stat-label"><h2>Active Subscriptions</h2><span className="stat-icon"><SubscriptionsOutlined fontSize="small" /></span></div>
          <p className="stat-value">{entries.length}</p>
          <p className="stat-footer">All services currently active</p>
        </article>
        <article className="dashboard-card dashboard-stat next-renewal">
          <div className="stat-label"><h2>Next Renewal</h2><span className={`stat-icon${nextUpcoming ? ` stat-icon--${nextUpcoming.status.tone}` : ''}`}><EventRepeatOutlined fontSize="small" /></span></div>
          <p className="next-renewal-date">{nextUpcoming ? formatDate(nextUpcoming.date) : 'No upcoming renewals'}</p>
          {nextUpcoming && <div className="next-renewal-status"><RenewalBadge status={nextUpcoming.status} /></div>}
          <p className="stat-footer">{nextUpcoming ? `${nextUpcoming.name} (${formatMoney(nextUpcoming.cost)})` : 'New renewal dates will appear here.'}</p>
        </article>
      </section>

      <div className="dashboard-body">
        <section aria-labelledby="subscriptions-heading" id="subscriptions">
          <div className="dashboard-section-heading"><h2 id="subscriptions-heading">Your Subscriptions</h2><span className="active-count">{entries.length} Active</span></div>
          <div className="subscription-grid">
            {entries.map((sub) => (
              <article key={sub.id} className="dashboard-card subscription-card" style={{ '--category-color': sub.color }}>
                <div className="subscription-card-top">
                  <Avatar src={getSubscriptionIcon(sub)} alt="" variant="rounded" className={`subscription-avatar${sub.icon ? '' : ' subscription-avatar--preset'}`}>{sub.name.charAt(0).toUpperCase()}</Avatar>
                  <div className="subscription-details"><h3>{sub.name}</h3><span className="subscription-category">{sub.category}</span></div>
                  <div className="subscription-price"><strong>{formatMoney(sub.cost)}</strong><span>{sub.billingCycle === 'Yearly' ? 'per year' : 'per month'}</span></div>
                </div>
                <div className="subscription-renewal"><span>Renewal date</span><RenewalBadge status={sub.status} date={sub.date} /></div>
                <div className="subscription-actions">
                  <Button size="small" color="inherit" aria-label={`Edit ${sub.name}`} onClick={() => onEditSubscription(sub)}>Edit</Button>
                  <Button size="small" color="error" aria-label={`Delete ${sub.name}`} onClick={() => onDeleteSubscription(sub)}>Delete</Button>
                </div>
              </article>
            ))}
          </div>
          {!entries.length && <div className="dashboard-card dashboard-empty">No subscriptions yet. Add your first one to start tracking your spend.</div>}
        </section>

        <aside className="dashboard-sidebar" aria-label="Spending insights and renewals">
          <SpendChart categories={categories} total={totalMonthly} />
          <section className="dashboard-card dashboard-panel" aria-labelledby="renewals-heading">
            <h2 id="renewals-heading">Upcoming renewals</h2>
            {upcoming.length ? (
              <ul className="renewal-timeline">
                {upcoming.slice(0, 4).map((sub) => (
                  <li key={sub.id} style={{ '--category-color': sub.color }}><strong>{sub.name}</strong><span>{formatDate(sub.date)} · {sub.status.label.toLowerCase()} · {formatMoney(sub.cost)}</span></li>
                ))}
              </ul>
            ) : <p className="dashboard-empty">No upcoming renewals scheduled.</p>}
            {overdueCount > 0 && <p className="overdue-note">{overdueCount} {overdueCount === 1 ? 'renewal date has' : 'renewal dates have'} passed. Check the dates on your subscription cards.</p>}
          </section>
          {largest && totalMonthly > 0 && (
            <div className="spending-insight"><LightbulbOutlined fontSize="small" /><p><strong>{largest.name}</strong> accounts for <strong>{Math.round(largest.monthlyCost / totalMonthly * 100)}%</strong> of your monthly spend. Review your plan to see if it still fits your needs.</p></div>
          )}
        </aside>
      </div>
    </div>
  );
}
