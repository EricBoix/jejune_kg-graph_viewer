import { ReactNode } from 'react';
import { GraphDataProvider } from './GraphDataContext';
import { ViewSettingsProvider } from './ViewSettingsContext';
import { SceneProvider } from './SceneContext';

export function GraphProvider({ children }: { children: ReactNode }) {
  return (
    <GraphDataProvider>
      <ViewSettingsProvider>
        <SceneProvider>
          {children}
        </SceneProvider>
      </ViewSettingsProvider>
    </GraphDataProvider>
  );
}
