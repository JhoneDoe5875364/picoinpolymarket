export function hasPiSDK(): boolean {
  return typeof window !== "undefined" && !!(window as any).Pi;
}

export function isPiBrowserUA(): boolean {
  return true;
  if (typeof navigator === "undefined") 
    return false;
  return /\bPiBrowser\b/i.test(navigator.userAgent);
}
