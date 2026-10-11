export const SceneKey = {
  boot: 'Boot',
  cabinet: 'Cabinet',
  logo: 'Logo',
  home: 'Home',
  options: 'Options',
  lobby: 'Lobby',
  fight: 'Fight',
  result: 'Result',
  transition: 'Transition',
} as const;

/** Scenes drawn on the monitor (stopped and started by SceneFlow). */
export const MONITOR_SCENES = [
  SceneKey.logo,
  SceneKey.home,
  SceneKey.options,
  SceneKey.lobby,
  SceneKey.fight,
  SceneKey.result,
] as const;
