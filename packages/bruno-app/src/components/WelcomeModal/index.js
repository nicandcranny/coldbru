import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import get from 'lodash/get';
import toast from 'react-hot-toast';
import Bruno from 'components/Bruno';
import Button from 'ui/Button';
import { useTheme } from 'providers/Theme';
import { browseDirectory } from 'providers/ReduxStore/slices/collections/actions';
import { savePreferences } from 'providers/ReduxStore/slices/app';
import { createWorkspaceAction } from 'providers/ReduxStore/slices/workspaces/actions';
import { multiLineMsg } from 'utils/common';
import { formatIpcError } from 'utils/common/error';
import { sanitizeName, validateName, validateNameError } from 'utils/common/regex';
import WelcomeStep from './WelcomeStep';
import ThemeStep from './ThemeStep';
import StorageStep from './StorageStep';
import GetStartedStep from './GetStartedStep';
import StyledWrapper from './StyledWrapper';

const TOTAL_STEPS = 4;

const WelcomeModal = ({ onDismiss, onImportCollection, onCreateCollection, onOpenCollection, onStartRequest }) => {
  const dispatch = useDispatch();
  const preferences = useSelector((state) => state.app.preferences);
  const workspaces = useSelector((state) => state.workspaces.workspaces);
  const defaultLocation = get(preferences, 'general.defaultLocation', '');
  const {
    storedTheme,
    setStoredTheme,
    themeVariantLight,
    setThemeVariantLight,
    themeVariantDark,
    setThemeVariantDark
  } = useTheme();

  const [step, setStep] = useState(1);
  const [workspaceName, setWorkspaceName] = useState('');
  const [workspaceLocation, setWorkspaceLocation] = useState(defaultLocation);
  const [workspaceNameTouched, setWorkspaceNameTouched] = useState(false);
  const [workspaceLocationTouched, setWorkspaceLocationTouched] = useState(false);
  const [isCreatingWorkspace, setIsCreatingWorkspace] = useState(false);
  const [hasCreatedWorkspace, setHasCreatedWorkspace] = useState(false);

  const trimmedWorkspaceName = workspaceName.trim();
  const workspaceFolderName = sanitizeName(trimmedWorkspaceName);
  const workspaceNameError = !trimmedWorkspaceName
    ? 'Workspace title is required'
    : trimmedWorkspaceName.length > 255
      ? 'Must be 255 characters or less'
      : workspaces.some((workspace) => workspace.name?.toLowerCase() === trimmedWorkspaceName.toLowerCase())
        ? 'A workspace with this name already exists'
        : null;
  const workspaceLocationError = !workspaceLocation ? 'Parent folder location is required' : null;

  const handleBrowse = () => {
    dispatch(browseDirectory())
      .then((dirPath) => {
        if (typeof dirPath === 'string') {
          setWorkspaceLocation(dirPath);
          setWorkspaceLocationTouched(true);
        }
      })
      .catch(() => {});
  };

  const persistPreferences = () => {
    if (workspaceLocation && workspaceLocation !== defaultLocation) {
      const updatedPreferences = {
        ...preferences,
        general: {
          ...preferences.general,
          defaultLocation: workspaceLocation
        }
      };

      return dispatch(savePreferences(updatedPreferences)).catch(() => {
        toast.error('Failed to save preferences');
      });
    }

    return Promise.resolve();
  };

  const createWorkspace = async () => {
    setWorkspaceNameTouched(true);
    setWorkspaceLocationTouched(true);

    if (hasCreatedWorkspace) {
      return true;
    }

    if (workspaceNameError || workspaceLocationError) {
      return false;
    }

    if (!validateName(workspaceFolderName)) {
      toast.error(validateNameError(workspaceFolderName));
      return false;
    }

    try {
      setIsCreatingWorkspace(true);
      await dispatch(createWorkspaceAction(trimmedWorkspaceName, workspaceFolderName, workspaceLocation));
      await persistPreferences();
      setHasCreatedWorkspace(true);
      toast.success('Workspace created!');
      return true;
    } catch (error) {
      toast.error(multiLineMsg('An error occurred while creating the workspace', formatIpcError(error)));
      return false;
    } finally {
      setIsCreatingWorkspace(false);
    }
  };

  const handleSaveAndDismiss = () => {
    persistPreferences().finally(() => {
      onDismiss();
    });
  };

  const handleActionAndDismiss = (action) => () => {
    persistPreferences().finally(() => {
      onDismiss();
      action();
    });
  };

  const goTo = (s) => setStep(s);

  const handleNext = async () => {
    if (step === 3) {
      const created = await createWorkspace();
      if (!created) {
        return;
      }
    }

    goTo(step + 1);
  };

  const handleStepDotClick = (targetStep) => {
    if (targetStep > 3 && !hasCreatedWorkspace) {
      goTo(3);
      return;
    }

    goTo(targetStep);
  };

  const steps = [
    <WelcomeStep key="welcome" />,
    <ThemeStep
      key="theme"
      storedTheme={storedTheme}
      setStoredTheme={setStoredTheme}
      themeVariantLight={themeVariantLight}
      setThemeVariantLight={setThemeVariantLight}
      themeVariantDark={themeVariantDark}
      setThemeVariantDark={setThemeVariantDark}
    />,
    <StorageStep
      key="workspace"
      workspaceName={workspaceName}
      workspaceLocation={workspaceLocation}
      workspaceNameError={workspaceNameTouched ? workspaceNameError : null}
      workspaceLocationError={workspaceLocationTouched ? workspaceLocationError : null}
      onWorkspaceNameChange={(value) => {
        setWorkspaceName(value);
        setWorkspaceNameTouched(true);
      }}
      onWorkspaceLocationChange={(value) => {
        setWorkspaceLocation(value);
        setWorkspaceLocationTouched(true);
      }}
      onBrowse={handleBrowse}
      isWorkspaceCreated={hasCreatedWorkspace}
      workspaceFolderName={workspaceFolderName}
    />,
    <GetStartedStep
      key="getstarted"
      onCreateCollection={handleActionAndDismiss(onCreateCollection)}
      onImportCollection={handleActionAndDismiss(onImportCollection)}
      onOpenCollection={handleActionAndDismiss(onOpenCollection)}
      onStartRequest={handleActionAndDismiss(onStartRequest)}
    />
  ];

  const isLastStep = step === TOTAL_STEPS;

  return (
    <StyledWrapper data-testid="welcome-modal">
      <div className="welcome-card">
        <div className="welcome-header">
          <div className="logo-container">
            <Bruno width={48} />
          </div>
          <h1 className="welcome-heading">
            {step === 1 ? 'Welcome to ColdBru' : step === 4 ? 'Ready to go!' : 'Set up ColdBru'}
          </h1>
          {step === 1 && (
            <p className="welcome-tagline">
              A fast, Git-friendly, and open-source API client.
            </p>
          )}
        </div>

        {steps[step - 1]}

        <div className="welcome-footer">
          <div className="progress-dots">
            {Array.from({ length: TOTAL_STEPS }, (_, i) => (
              <button
                type="button"
                key={i}
                className={`dot ${i + 1 === step ? 'active' : ''} ${i + 1 < step ? 'completed' : ''}`}
                onClick={() => handleStepDotClick(i + 1)}
                aria-label={`Go to step ${i + 1}`}
                aria-current={i + 1 === step ? 'step' : undefined}
              />
            ))}
          </div>

          <div className="footer-buttons">
            <Button type="button" color="secondary" variant="ghost" onClick={handleSaveAndDismiss}>
              Skip
            </Button>
            {step > 1 && (
              <Button type="button" color="secondary" variant="ghost" onClick={() => goTo(step - 1)}>
                Back
              </Button>
            )}
            {!isLastStep && (
              <Button
                type="button"
                onClick={handleNext}
                loading={step === 3 && isCreatingWorkspace}
                disabled={step === 3 && !hasCreatedWorkspace && (!!workspaceNameError || !!workspaceLocationError)}
              >
                {step === 1 ? 'Get Started' : step === 3 ? (hasCreatedWorkspace ? 'Continue' : 'Create Workspace') : 'Next'}
              </Button>
            )}
            {isLastStep && (
              <Button type="button" color="secondary" onClick={handleSaveAndDismiss}>
                I'll explore on my own
              </Button>
            )}
          </div>
        </div>
      </div>
    </StyledWrapper>
  );
};

export default WelcomeModal;
