import styled from 'styled-components';
import { rgba } from 'polished';

const StyledWrapper = styled.div`
  position: fixed;
  inset: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.55);

  .welcome-card {
    background: ${(props) => props.theme.modal.body.bg};
    border: 1px solid ${(props) => props.theme.border.border1};
    border-radius: ${(props) => props.theme.border.radius.xl};
    box-shadow: ${(props) => props.theme.shadow.lg};
    width: 660px;
    max-width: 92vw;
    max-height: 90vh;
    overflow-y: auto;
    animation: welcomeSlideIn 0.4s cubic-bezier(0.16, 1, 0.3, 1);
  }

  @keyframes welcomeSlideIn {
    from {
      opacity: 0;
      transform: translateY(12px) scale(0.98);
    }
    to {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }

  .welcome-header {
    text-align: center;
    padding: 2.25rem 2.5rem 0 2.5rem;
  }

  .logo-container {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 0.75rem;
  }

  .welcome-heading {
    font-size: 1.375rem;
    font-weight: 700;
    color: ${(props) => props.theme.text};
    margin: 0;
    line-height: 1.3;
  }

  .welcome-tagline {
    color: ${(props) => props.theme.colors.text.subtext1};
    font-size: 0.875rem;
    margin-top: 0.25rem;
    line-height: 1.5;
  }

  .step-body {
    padding: 1.5rem 2.5rem;
  }

  .step-label {
    font-size: 0.6875rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: ${(props) => props.theme.primary.text};
    margin-bottom: 0.375rem;
  }

  .step-title {
    font-size: 1.05rem;
    font-weight: 600;
    color: ${(props) => props.theme.text};
    margin-bottom: 0.25rem;
  }

  .step-description {
    color: ${(props) => props.theme.colors.text.subtext1};
    font-size: 0.8125rem;
    line-height: 1.5;
    margin-bottom: 1.25rem;
  }

  .workspace-form-field {
    margin-bottom: 1rem;
  }

  .workspace-form-label {
    display: block;
    font-size: 0.8125rem;
    font-weight: 600;
    color: ${(props) => props.theme.text};
    margin-bottom: 0.5rem;
  }

  .workspace-form-input {
    width: 100%;
    min-height: 40px;
    padding: 0.625rem 0.75rem;
    border: 1px solid ${(props) => props.theme.input.border};
    border-radius: ${(props) => props.theme.border.radius.md};
    background: ${(props) => props.theme.input.bg};
    color: ${(props) => props.theme.text};

    &:focus {
      outline: none;
      border-color: ${(props) => props.theme.input.focusBorder};
      box-shadow: 0 0 0 2px ${(props) => rgba(props.theme.primary.solid, 0.18)};
    }

    &:disabled {
      opacity: 0.7;
      cursor: not-allowed;
    }
  }

  .location-input-group {
    display: flex;
    gap: 0.75rem;
    align-items: center;
  }

  .location-input {
    flex: 1;
  }

  .browse-button {
    min-height: 40px;
    padding: 0 0.9rem;
    border: 1px solid ${(props) => props.theme.border.border1};
    border-radius: ${(props) => props.theme.border.radius.md};
    background: ${(props) => props.theme.modal.body.bg};
    color: ${(props) => props.theme.primary.text};
    cursor: pointer;

    &:disabled {
      opacity: 0.7;
      cursor: not-allowed;
    }
  }

  .workspace-form-error {
    margin-top: 0.375rem;
    font-size: 0.75rem;
    color: ${(props) => props.theme.status.danger.text};
  }

  .location-hint {
    color: ${(props) => props.theme.colors.text.subtext1};
    font-size: 0.75rem;
    line-height: 1.5;
    margin-top: 0.5rem;
  }

  .welcome-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.75rem 2.5rem 1.75rem 2.5rem;
  }

  .progress-dots {
    display: flex;
    gap: 6px;
    align-items: center;

    .dot {
      width: 8px;
      height: 8px;
      padding: 0;
      border: none;
      border-radius: 50%;
      background: ${(props) => props.theme.border.border2};
      transition: all 0.25s ease;
      cursor: pointer;

      &.active {
        background: ${(props) => props.theme.primary.solid};
        width: 20px;
        border-radius: 4px;
      }

      &.completed {
        background: ${(props) => rgba(props.theme.primary.solid, 0.45)};
      }
    }
  }

  .footer-buttons {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
`;

export default StyledWrapper;
