import V from './V';

interface ActorDump {
  /** Id */
  i: number;
  /** Position */
  p: V;
  /** Direction */
  d: number;
}

export interface SourcerDump extends ActorDump {
  /** sHield */
  h: number;
  /** Temperature */
  t: number;
  /** MissileAmmo */
  a: number;
  /** Fuel */
  f: number;
}

export interface ShotDump extends ActorDump {
  /** Owner id */
  o: number;
  /** Shot type */
  s: string;
}

export interface FxDump {
  /** Id */
  i: number;
  /** Position */
  p: V;
  /** Frame */
  f: number;
  /** Length */
  l: number;
}

export interface FieldDump {
  /** Frame */
  f: number;
  /** Sourcers */
  s: SourcerDump[];
  /** shots (Bullets) */
  b: ShotDump[];
  /** fXs */
  x: FxDump[];
}

export interface GameDump {
  /** Result */
  result: ResultDump;
  /** Frames */
  players: PlayersDump;
  /** Frames */
  frames: FieldDump[];
}

export interface PlayersDump {
  [id: number]: ProfileDump;
}

export interface ProfileDump {
  name: string;
  account: string;
  color: string;
}

export interface ResultDump {
  isSoloDemo: boolean;
  isDraw?: boolean;
  winnerId?: number;
  frame: number;
}
