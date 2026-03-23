import SwaggerUI from 'swagger-ui-react';
import StyledWrapper from './StyledWrapper';

const Swagger = ({ spec }) => {
  if (!spec?.trim()) {
    return (
      <StyledWrapper>
        <div className="swagger-root swagger-empty-state">
          <div className="swagger-empty-state-copy">
            <div className="swagger-empty-state-title">No API definition provided yet.</div>
            <div className="swagger-empty-state-description">Supports OpenAPI v3 in JSON or YAML format.</div>
          </div>
        </div>
      </StyledWrapper>
    );
  }

  return (
    <StyledWrapper>
      <div className="swagger-root w-full">
        <SwaggerUI spec={spec} />
      </div>
    </StyledWrapper>
  );
};

export default Swagger;
