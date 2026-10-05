import { PortalHost } from '@rn-primitives/portal';

/**
 * Renders a host for the player's settings sheet wherever you place it, usually at the app root
 * after your navigator, so the sheet can cover tab bars and headers. Give it a name and pass the
 * same name to `<VideoProvider portalHost>`; one host can serve every player in the app.
 *
 * @param {{ name: string }} props - The host name.
 * @returns {React.ReactElement} The portal host.
 */
export const VideoPortalHost = ({ name }: { name: string }): React.ReactElement => <PortalHost name={name} />;
