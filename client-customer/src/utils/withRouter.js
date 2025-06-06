import React from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';

function withRouter(Component) {
  function ComponentWithRouterProp(props) {
    let location = useLocation();
    let navigate = useNavigate();
    let params = useParams();
    return (
      <Component
        {...props}
        location={location}
        navigate={navigate}
        params={params}
        router={{ location, navigate, params }}
      />
    );
  }

  return ComponentWithRouterProp;
}

// Export both default and named export to support both import syntaxes
export { withRouter };
export default withRouter;