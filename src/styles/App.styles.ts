import { colors } from './theme';
export const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
    fontFamily: 'system-ui, -apple-system, sans-serif',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 24px',
    backgroundColor: colors.primary,
    color: 'white',
  },
  title: {
    margin: 0,
    fontSize: '20px',
    fontWeight: 600,
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  repoLink: {
    display: 'flex',
    alignItems: 'center',
    opacity: 0.75,
    transition: 'opacity 0.15s',
  },
  repoIcon: {
    width: '24px',
    height: '24px',
    filter: 'brightness(0) invert(1)',
  },
  toolbar: {
    display: 'flex',
    gap: '8px',
  },
  main: {
    display: 'flex',
    flex: 1,
    overflow: 'hidden',
  },
  canvasContainer: {
    flex: 1,
    position: 'relative',
  },
} satisfies Record<string, React.CSSProperties>;
