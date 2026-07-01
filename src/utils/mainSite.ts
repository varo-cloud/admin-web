/** 当前 admin 应用完整路径（含 base path），用于登录后跳回。 */
export function currentAppPath(): string {
  return `${window.location.pathname}${window.location.search}${window.location.hash}`
}

/** 主站登录页 URL（同域部署，共享 session）。 */
export function mainSiteAuthUrl(redirectPath?: string): string {
  const redirect = redirectPath ?? currentAppPath()
  return `/auth?${new URLSearchParams({ redirect }).toString()}`
}

export function mainSiteHomeUrl(): string {
  return '/'
}
