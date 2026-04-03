import cn from 'classnames';
import InfoTip from 'components/InfoTip/index';
import ToolHint from 'components/ToolHint/index';
import get from 'lodash/get';
import { updateItemSettings } from 'providers/ReduxStore/slices/collections';
import { saveRequest } from 'providers/ReduxStore/slices/collections/actions';
import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import debounce from 'lodash/debounce';
import isEqual from 'lodash/isEqual';
import StyledWrapper from './StyledWrapper';

/**
 * @param {string} propertyKey
 * @param {{draft?:Record<string,unknown>}} item
 * @returns
 */
const getPropertyFromDraftOrRequest = (propertyKey, item) =>
  item.draft ? get(item, `draft.${propertyKey}`, {}) : get(item, propertyKey, {});

const ERRORS = {
  timeout: {
    invalid: `Timeout needs to be a valid number`
  },
  keepAliveInterval: {
    invalid: `Timeout needs to be a valid number`
  }
};

const WSSettingsPane = ({ item, collection }) => {
  const dispatch = useDispatch();
  const requestPreferences = useSelector((state) => state.app.preferences.request);

  const { timeout: _connectionTimeout, keepAliveInterval = 0 } = getPropertyFromDraftOrRequest('settings', item);

  const connectionTimeout = _connectionTimeout ?? requestPreferences.timeout;
  const [localSettings, setLocalSettings] = useState({
    timeout: connectionTimeout,
    keepAliveInterval
  });
  const localSettingsRef = useRef(localSettings);
  const sourceSettingsRef = useRef({ timeout: connectionTimeout, keepAliveInterval });
  const dirtyRef = useRef(false);
  const debouncedSyncRef = useRef(null);

  useEffect(() => {
    localSettingsRef.current = localSettings;
  }, [localSettings]);

  useEffect(() => {
    sourceSettingsRef.current = { timeout: connectionTimeout, keepAliveInterval };
    if (!dirtyRef.current) {
      setLocalSettings({ timeout: connectionTimeout, keepAliveInterval });
    } else if (isEqual(localSettingsRef.current, sourceSettingsRef.current)) {
      dirtyRef.current = false;
    }
  }, [connectionTimeout, keepAliveInterval]);

  const syncSettings = useCallback((settings) => {
    dispatch(updateItemSettings({
      collectionUid: collection.uid,
      itemUid: item.uid,
      settings
    }));
  }, [dispatch, collection.uid, item.uid]);

  useEffect(() => {
    debouncedSyncRef.current = debounce(syncSettings, 400);
    return () => {
      debouncedSyncRef.current?.cancel();
    };
  }, [syncSettings]);

  const flushSettings = useCallback((settings = localSettingsRef.current) => {
    debouncedSyncRef.current?.cancel();
    if (!isEqual(settings, sourceSettingsRef.current)) {
      syncSettings(settings);
    } else {
      dirtyRef.current = false;
    }
  }, [syncSettings]);

  useEffect(() => {
    return () => {
      flushSettings();
    };
  }, [flushSettings]);

  const updateSetting = useCallback((key, value) => {
    setLocalSettings((current) => {
      const next = { ...current, [key]: value };
      dirtyRef.current = true;
      debouncedSyncRef.current?.(next);
      return next;
    });
  }, []);

  const handleKeyDown = useCallback((event) => {
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 's') {
      event.preventDefault();
      flushSettings();
      dispatch(saveRequest(item.uid, collection.uid));
    }
  }, [flushSettings, dispatch, item.uid, collection.uid]);

  const formErrors = {
    timeout: isNaN(Number(localSettings.timeout)) && ERRORS.timeout.invalid,
    keepAliveInterval: isNaN(Number(localSettings.keepAliveInterval)) && ERRORS.keepAliveInterval.invalid
  };

  return (
    <StyledWrapper className="flex flex-col gap-4 w-full">
      <section className="grid gap-4 items-center grid-cols-2">
        <div>
          <label className="font-medium mb-2">Timeout</label>
          <InfoTip
            infotipId="setting-connection-timeout"
            className="tooltip-mod max-w-lg"
            content={(
              <div>
                <p>
                  <span>Timeout in milliseconds</span>
                </p>
              </div>
            )}
          />
        </div>
        <div>
          <div className={cn('single-line-editor-wrapper', {
            error: formErrors.timeout
          })}
          >
            <ToolHint
              key="timeout"
              toolhintId="ws-settings-timeout"
              place="top"
              text={formErrors.timeout ? formErrors.timeout : ''}
            >
              <input
                type="text"
                className="mousetrap w-full bg-transparent"
                value={localSettings.timeout ?? ''}
                onChange={(event) => updateSetting('timeout', event.target.value)}
                onBlur={() => flushSettings()}
                onKeyDown={handleKeyDown}
              />
            </ToolHint>
          </div>
        </div>

        <div>
          <label className="font-medium mb-2">Keep Alive Interval</label>
          <InfoTip
            infotipId="setting-keep-alive"
            className="tooltip-mod max-w-lg"
            content={(
              <div>
                <p>
                  <span>
                    Keep the websocket alive by sending ping requests to the server at every interval (in millseconds)
                  </span>
                </p>
                <p className="mt-2">0 (zero) = off</p>
              </div>
            )}
          />
        </div>
        <div>
          <div className={cn('single-line-editor-wrapper', {
            error: formErrors.keepAliveInterval
          })}
          >
            <ToolHint
              key="timeout"
              toolhintId="ws-settings-keepAliveInterval"
              place="top"
              text={formErrors.keepAliveInterval ? formErrors.keepAliveInterval : ''}
            >
              <input
                type="text"
                className="mousetrap w-full bg-transparent"
                value={localSettings.keepAliveInterval ?? ''}
                onChange={(event) => updateSetting('keepAliveInterval', event.target.value)}
                onBlur={() => flushSettings()}
                onKeyDown={handleKeyDown}
              />
            </ToolHint>
          </div>
        </div>
      </section>
    </StyledWrapper>
  );
};

export default WSSettingsPane;
