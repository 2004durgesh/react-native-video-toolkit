import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

const DEFAULT_PORTAL_HOST = 'INTERNAL_PRIMITIVE_DEFAULT_HOST_NAME';

type PortalMap = Map<string, ReactNode>;
type PortalHostMap = Map<string, PortalMap>;

// Context to share portal state
const PortalContext = createContext<{
  portals: PortalHostMap;
  updatePortal: (hostName: string, name: string, children: ReactNode) => void;
  removePortal: (hostName: string, name: string) => void;
} | null>(null);

/**
 * The PortalProvider component provides a way to render components into a different part of the component tree.
 *
 * @param {object} props - The props for the component.
 * @param {ReactNode} props.children - The children to render.
 * @returns {React.ReactElement} The PortalProvider component.
 */
export function PortalProvider({ children }: { children: ReactNode }): React.ReactElement {
  const [portals, setPortals] = useState<PortalHostMap>(() =>
    new Map().set(DEFAULT_PORTAL_HOST, new Map<string, ReactNode>())
  );

  const updatePortal = useCallback((hostName: string, name: string, children: ReactNode) => {
    setPortals((prev) => {
      const next = new Map(prev);
      const portal = next.get(hostName) ?? new Map<string, ReactNode>();
      portal.set(name, children);
      next.set(hostName, portal);
      return next;
    });
  }, []);

  const removePortal = useCallback((hostName: string, name: string) => {
    setPortals((prev) => {
      const next = new Map(prev);
      const portal = next.get(hostName) ?? new Map<string, ReactNode>();
      portal.delete(name);
      next.set(hostName, portal);
      return next;
    });
  }, []);

  const value = useMemo(
    () => ({
      portals,
      updatePortal,
      removePortal,
    }),
    [portals, updatePortal, removePortal]
  );

  return <PortalContext.Provider value={value}>{children}</PortalContext.Provider>;
}

/**
 * A hook to access the portal context.
 *
 * @returns An object with the following properties:
 * - `portals`: A map of portals.
 * - `updatePortal`: A function to update a portal.
 * - `removePortal`: A function to remove a portal.
 */
function usePortalContext() {
  const context = useContext(PortalContext);
  if (!context) {
    throw new Error('Portal components must be used within a PortalProvider');
  }
  return context;
}

/**
 * The PortalHost component is where the portals are rendered.
 *
 * @param {object} props - The props for the component.
 * @param {string} props.name - The name of the portal host.
 * @returns {React.ReactElement | null} The PortalHost component.
 */
export function PortalHost({ name = DEFAULT_PORTAL_HOST }: { name?: string }): React.ReactElement | null {
  const { portals } = usePortalContext();
  const portalMap = portals.get(name) ?? new Map<string, ReactNode>();

  if (portalMap.size === 0) return null;

  return <>{Array.from(portalMap.values())}</>;
}

/**
 * The Portal component is used to render content into a PortalHost.
 *
 * @param {object} props - The props for the component.
 * @param {string} props.name - The name of the portal.
 * @param {string} props.hostName - The name of the portal host.
 * @param {ReactNode} props.children - The children to render.
 * @returns {null} The Portal component.
 */
export function Portal({
  name,
  hostName = DEFAULT_PORTAL_HOST,
  children,
}: {
  name: string;
  hostName?: string;
  children: ReactNode;
}): null {
  const { updatePortal, removePortal } = usePortalContext();

  useEffect(() => {
    updatePortal(hostName, name, children);
  }, [hostName, name, children, updatePortal]);

  useEffect(() => {
    return () => {
      removePortal(hostName, name);
    };
  }, [hostName, name, removePortal]);

  return null;
}
