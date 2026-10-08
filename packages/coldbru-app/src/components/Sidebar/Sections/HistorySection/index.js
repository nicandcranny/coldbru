import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { IconHistory, IconTrash } from '@tabler/icons';
import toast from 'react-hot-toast';
import { clearRequestHistory, loadRequestHistory, openRequestHistoryEntry } from 'providers/ReduxStore/slices/request-history';
import SidebarSection from 'components/Sidebar/SidebarSection';
import ActionIcon from 'ui/ActionIcon';
import MethodBadge from 'ui/MethodBadge';
import StatusBadge from 'ui/StatusBadge';
import StyledWrapper from './StyledWrapper';

const getStatusType = ({ status, isError }) => {
  if (isError) return 'danger';
  if (typeof status !== 'number' || status < 300) return 'success';
  if (status < 400) return 'info';
  if (status < 500) return 'warning';
  return 'danger';
};

// Path first so entries to the same host stay distinguishable in a narrow sidebar;
// URLs that don't parse (e.g. starting with {{baseUrl}}) are shown whole
const splitUrl = (url = '') => {
  try {
    const { host, pathname, search } = new URL(url);
    return { primary: `${pathname}${search}`, host };
  } catch {
    return { primary: url, host: null };
  }
};

// Time only for today's entries, date only for older ones; the full timestamp is in the tooltip
const formatTime = (timestamp) => {
  const date = new Date(timestamp);
  return date.toDateString() === new Date().toDateString()
    ? date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    : date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
};

const HistorySection = ({ collapsible = true }) => {
  const dispatch = useDispatch();
  const entries = useSelector((state) => state.requestHistory.entries);

  useEffect(() => {
    if (!entries) {
      dispatch(loadRequestHistory()).catch((err) => toast.error(err?.message || 'Failed to load history'));
    }
  }, [entries, dispatch]);

  const openEntry = (id) => {
    dispatch(openRequestHistoryEntry(id)).catch((err) => toast.error(err?.message || 'Failed to open history entry'));
  };

  const clearHistory = () => {
    dispatch(clearRequestHistory()).catch((err) => toast.error(err?.message || 'Failed to clear history'));
  };

  const sectionActions = (
    <ActionIcon onClick={clearHistory} label="Clear History" size="sm" data-testid="request-history-clear">
      <IconTrash size={14} stroke={1.5} />
    </ActionIcon>
  );

  return (
    <SidebarSection id="history" title="History" icon={IconHistory} actions={sectionActions} collapsible={collapsible}>
      <StyledWrapper>
        <div className="history-list" data-testid="request-history-list">
          {entries?.map((entry) => {
            const { primary, host } = splitUrl(entry.url);
            return (
              <button
                key={entry.id}
                type="button"
                className="history-item"
                title={entry.url}
                data-testid="request-history-item"
                onClick={() => openEntry(entry.id)}
              >
                <div className="history-item-row">
                  <MethodBadge method={entry.method} size="sm" />
                  <span className="history-item-url">{primary}</span>
                </div>
                <div className="history-item-row history-item-meta">
                  <StatusBadge status={getStatusType(entry)} size="xs">{entry.status}</StatusBadge>
                  {host && <span className="history-item-host">{host}</span>}
                  <span className="history-item-time" title={new Date(entry.timestamp).toLocaleString()}>{formatTime(entry.timestamp)}</span>
                </div>
              </button>
            );
          })}
          {entries?.length === 0 && <div className="history-empty">Requests you send will appear here</div>}
        </div>
      </StyledWrapper>
    </SidebarSection>
  );
};

export default HistorySection;
