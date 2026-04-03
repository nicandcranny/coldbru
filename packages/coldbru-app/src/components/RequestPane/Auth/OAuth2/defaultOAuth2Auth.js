const defaultOAuth2Auth = {
  grantType: 'authorization_code',
  callbackUrl: '',
  authorizationUrl: '',
  accessTokenUrl: '',
  username: '',
  password: '',
  clientId: '',
  clientSecret: '',
  scope: '',
  credentialsPlacement: 'body',
  credentialsId: 'credentials',
  tokenPlacement: 'header',
  tokenHeaderPrefix: 'Bearer',
  tokenQueryKey: 'access_token',
  tokenSource: 'access_token',
  state: '',
  pkce: false,
  refreshTokenUrl: '',
  autoRefreshToken: false,
  autoFetchToken: false
};

export default defaultOAuth2Auth;
