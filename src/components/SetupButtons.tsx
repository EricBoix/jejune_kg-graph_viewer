import { colors } from '../styles/theme';
import { useRef } from 'react';
import { useScene } from '../context/SceneContext';

export function SetupButtons() {
  const { saveSetup, loadSetupFromFile } = useScene();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      loadSetupFromFile(file);
    }
    // Allow picking the same file again.
    event.target.value = '';
  };

  return (
    <>
      <input
        type="file"
        accept=".yaml,.yml"
        onChange={handleFileUpload}
        ref={fileInputRef}
        style={{ display: 'none' }}
      />
      <button onClick={() => fileInputRef.current?.click()} style={styles.button}>
        Load setup
      </button>
      <button onClick={saveSetup} style={styles.button}>
        Save setup
      </button>
    </>
  );
}

const styles = {
  button: {
    backgroundColor: 'white',
    color: colors.primary,
    border: 'none',
    padding: '8px 16px',
    borderRadius: '4px',
    cursor: 'pointer',
    fontWeight: 500,
  },
} satisfies Record<string, React.CSSProperties>;
