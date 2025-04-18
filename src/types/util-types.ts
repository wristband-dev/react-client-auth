/**
 * Configuration options for customizing the login redirect behavior.
 */
export interface LoginRedirectConfig {
  /**
   * Optional hint to pre-fill the Tenant Login Page form with a specific username or email.
   *
   * When provided, this value will be sent as the "login_hint" query parameter, which can be used by your
   * authentication endpoint to pre-populate the login form, improving the user experience by reducing manual input.
   *
   * @example "user@example.com"
   */
  loginHint?: string;
  /**
   * Optional URL to redirect back to after successful authentication.
   *
   * This URL will be sent as the "return_url" query parameter to your Login Endpoint. After successful login, your
   * auth flow should redirect users back to this URL. If not provided, the current page URL will be used as the
   * return destination.
   *
   * @example "https://app.example.com/dashboard"
   */
  returnUrl?: string;
  /**
   * Optional tenant domain name for directing users to the correct Tenant Login Page.
   *
   * When provided, this value is sent as the "tenant_domain" query parameter to your backend server's Login Ednpoint,
   * enabling automatic tenant routing during login.
   *
   * This parameter is primarily useful when:
   * - All tenants in your application share a common app URL (i.e. no subdomains, no custom domains)
   * - You want to avoid tenant discovery during login
   *
   * @example "acme-corp" // Directs to Acme Corporation's Tenant Login Page
   */
  tenantDomain?: string;
  /**
   * Optional tenant custom domain for directing users to the correct Tenant Login Page.
   *
   * When provided, this value is sent as the "tenant_custom_domain" query parameter to your
   * backend server's Login Endpoint, allowing routing to tenant custom domains.
   *
   * This parameter is useful when:
   * - Tenants have their own custom domains
   * - You want to avoid tenant discovery during login
   *
   * @example "auth.acme.com" // Directs to Acme's tenant custom domain
   */
  tenantCustomDomain?: string;
}

/**
 * Configuration options for redirecting to your server's logout endpoint.
 * @interface LogoutRedirectConfig
 */
export interface LogoutRedirectConfig {
  /**
   * Optional tenant domain name for directing users to the correct Tenant Login Page.
   *
   * When provided, this value is sent as the "tenant_domain" query parameter to your backend server's Logout Ednpoint,
   * enabling automatic tenant routing during logout.
   *
   * This parameter is primarily useful when:
   * - All tenants in your application share a common app URL (i.e. no subdomains, no custom domains)
   * - You want to avoid tenant discovery during login
   *
   * @example "acme-corp" // Directs to Acme Corporation's Tenant Login Page
   */
  tenantDomain?: string;

  /**
   * Optional tenant custom domain for directing users to the correct Tenant Login Page.
   *
   * When provided, this value is sent as the "tenant_custom_domain" query parameter to your
   * backend server's Login Endpoint, allowing routing to tenant custom domains.
   *
   * This parameter is useful when:
   * - Tenants have their own custom domains
   * - You want to avoid tenant discovery during login
   *
   * @example "auth.acme.com" // Directs to Acme's tenant custom domain
   */
  tenantCustomDomain?: string;
}
