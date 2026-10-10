export const SceneKey = {
  boot: 'Boot',
  cabinet: 'Cabinet',
  logo: 'Logo',
  home: 'Home',
  fight: 'Fight',
  result: 'Result',
  transition: 'Transition',
} as const;

/** Scenes drawn on the monitor (stopped and started by SceneFlow). */
export const MONITOR_SCENES = [SceneKey.logo, SceneKey.home, SceneKey.fight, SceneKey.result] as const;
