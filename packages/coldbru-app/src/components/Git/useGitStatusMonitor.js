import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { refreshCollectionGitStatus } from 'providers/ReduxStore/slices/git';
import { getGitTarget } from 'utils/git/target';

const useGitStatusMonitor = (collectionUid, options = {}) => {
  const dispatch = useDispatch();
  const gitTarget = useSelector((state) => getGitTarget(state, collectionUid));
  const { enabled = true, intervalMs = 4000 } = options;

  useEffect(() => {
    if (!enabled || !collectionUid || !window.ipcRenderer) {
      return;
    }

    dispatch(refreshCollectionGitStatus(collectionUid, { preserveOperation: true }));

    const intervalId = window.setInterval(() => {
      dispatch(refreshCollectionGitStatus(collectionUid, { preserveOperation: true }));
    }, intervalMs);

    const handleFocus = () => {
      dispatch(refreshCollectionGitStatus(collectionUid, { preserveOperation: true }));
    };

    window.addEventListener('focus', handleFocus);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener('focus', handleFocus);
    };
  }, [collectionUid, dispatch, enabled, gitTarget?.scopeId, intervalMs]);
};

export default useGitStatusMonitor;
