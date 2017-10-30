import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { FABButton, Icon, Slider, Grid, Cell, Card, CardTitle, CardText, ProgressBar } from 'react-mdl';

import Configs from '../../../core/Configs';

import FieldTag from '../core/FieldTag';
import HudTag from '../core/HudTag';
import { GameDump, FieldDump, ResultDump, ProfileDump, SourcerDump, PlayersDump } from '../../../core/Dump';
import ComponentExplorer from '../../utils/ComponentExplorer';
import { strings } from '../resources/Strings';

interface ReplayerProps {
  gameDump: GameDump;
  width?: number;
  height?: number;
  scale: number;
  onReload?: () => void;
}

interface ReplayerStats {
  playing?: boolean;
  frame: number;
  dynamicWidth?: number;
}

export default class Replayer extends React.Component<ReplayerProps, ReplayerStats> {
  private animationFrameHandler: number | null;

  // private static propTypes = {
  // };

  private static defaultProps = {
    gameDump: {},
    width: -1,
    height: 384,
    scale: 1.0
  };

  constructor(props: ReplayerProps) {
    super();
    this.state = {
      playing: false,
      frame: 0
    };
  }

  private onPlayPauseToggle() {
    if (this.state.playing) {
      this.onPause();
    } else {
      this.onPlay();
    }
  }

  private onPlay() {
    this.setState({ playing: true });
    if (!this.animationFrameHandler) {
      this.animationFrameHandler = requestAnimationFrame(() => this.tick());
    }
  }

  private onPause() {
    this.setState({ playing: false });
    if (this.animationFrameHandler) {
      cancelAnimationFrame(this.animationFrameHandler);
      this.animationFrameHandler = null;
    }
  }

  private onReload() {
    if (this.props.onReload) {
      this.props.onReload();
    } else {
      this.setState({ frame: 0 });
    }
  }

  private onFrameChanged(frameEvent: any) {
    this.setState({
      frame: ComponentExplorer.extractSliderOnChange(frameEvent)
    });
  }

  public render() {
    const scale = this.props.scale;
    const width = (this.props.width !== -1 ? this.props.width : this.state.dynamicWidth) || 512;
    const height = this.props.height || 384;
    const scaledWidth = width / scale;
    const scaledHeight = height / scale;

    if (this.props.gameDump.frames) {
      const result = this.props.gameDump.result;
      const players = this.props.gameDump.players;
      const frame = this.props.gameDump.frames[this.state.frame];
      const demo = this.props.gameDump.isDemo;

      const playOrPause = this.state.playing ?
        (<FABButton mini colored ripple onClick={this.onPause.bind(this)}><Icon name="pause" /></FABButton>) :
        (<FABButton mini colored ripple onClick={this.onPlay.bind(this)}><Icon name="play_arrow" /></FABButton>);

      const statuses = demo || !frame ? null : this.statuses(frame, players);

      const field = !frame ? null : <FieldTag field={frame} players={players} width={scaledWidth} height={scaledHeight} scale={scale} />;

      let hudTag: JSX.Element | null = null;
      if (!demo) {
        hudTag = <HudTag result={result} players={players} screenHeight={height} frame={this.state.frame} />;
      }

      return (
        <div ref="root">
          <div className="mdl-card mdl-shadow--2dp" style={{ width: '100%', marginBottom: '8px' }} onClick={this.onPlayPauseToggle.bind(this)}>
            <svg width={width} height={height} viewBox={`${-width / 2} 0 ${width} ${height}`}>
              <g transform={`scale(${scale}, ${scale})`}>
                {field}
                {hudTag}
              </g>
            </svg>
          </div>
          <div className="replay-controller">
            <div className="replay-controller-button"><FABButton mini colored ripple onClick={this.onReload.bind(this)}><Icon name="replay" /></FABButton></div>
            <div className="replay-controller-button">{playOrPause}</div>
            <div className="replay-slider">
              <Slider min={0} max={this.props.gameDump.frames.length - 1} value={this.state.frame} onChange={this.onFrameChanged.bind(this)} />
            </div>
            <div className="replay-controller-frame">{this.state.frame} <span>(frame) </span></div>
          </div>
          {statuses}
        </div>
      );
    } else {
      return null;
    }
  }

  private adjustWidth() {
    const refs = this.refs as any;
    const node = ReactDOM.findDOMNode(refs.root);

    if (this.props.width === -1) {
      this.setState({ dynamicWidth: node.clientWidth });
    }
  }

  private tick() {
    this.animationFrameHandler = requestAnimationFrame(() => this.tick());

    this.adjustWidth();

    if (this.props.gameDump.frames && this.state.playing) {
      const nextFrame = this.state.frame + 1;
      if (nextFrame < this.props.gameDump.frames.length) {
        this.setState({ frame: nextFrame });
      } else {
        if (this.props.gameDump.isDemo) {
          this.setState({ frame: 0 });
        }
      }
    }
  }

  private statuses(frame: FieldDump, players: PlayersDump) {
    const player1Status = this.status(frame.s[0], players[frame.s[0].i]);
    const player2Status = this.status(frame.s[1], players[frame.s[1].i]);

    return (
      <Grid>
        <Cell col={6} tablet={12} phone={12}>{player1Status}</Cell>
        <Cell col={6} tablet={12} phone={12}>{player2Status}</Cell>
      </Grid>
    );
  }

  private status(model: SourcerDump, profile: ProfileDump) {
    const resource = strings();

    const shield = (model.h / Configs.INITIAL_SHIELD) * 100;

    let backgroundColor: string;
    if (50 < shield) {
      backgroundColor = '#fff';
    } else if (25 < shield) {
      backgroundColor = '#ff8';
    } else {
      backgroundColor = '#f44';
    }

    return (
      <Card shadow={0} style={{ backgroundColor, width: '100%', margin: 'auto' }}>
        <CardTitle><div style={{ height: '32px', width: '16px', marginRight: '8px', backgroundColor: profile.color }} /> {profile.name}</CardTitle>
        <CardText style={{ paddingTop: '0px' }}>
          <div>
            <div className="status"><span className="title">{resource.shield}</span><span className="main">{model.h}</span> / {Configs.INITIAL_SHIELD}</div>
            <div><ProgressBar className="progress-status progress-shield" progress={(model.h / Configs.INITIAL_SHIELD) * 100} /></div>
          </div>
          <div>
            <div className="status"><span className="title">{resource.fuel}</span><span className="main">{model.f}</span> / {Configs.INITIAL_FUEL}</div>
            <div><ProgressBar className="progress-status progress-fuel" progress={(model.f / Configs.INITIAL_FUEL) * 100} /></div>
          </div>
          <div>
            <div className="status">
              <span className="title">{resource.temperature}</span><span className="main">{model.t}</span> / {Configs.OVERHEAT_BORDER}
            </div>
            <div><ProgressBar className="progress-status progress-temperature" progress={(model.t / Configs.OVERHEAT_BORDER) * 100} /></div>
          </div>
          <div>
            <div className="status"><span className="title">{resource.ammo}</span><span className="main">{model.a}</span> / {Configs.INITIAL_MISSILE_AMMO}</div>
            <div><ProgressBar className="progress-status progress-ammo" progress={(model.a / Configs.INITIAL_MISSILE_AMMO) * 100} /></div>
          </div>
        </CardText>
      </Card>
    );
  }

  public componentDidMount() {
    this.adjustWidth();
  }

  public componentWillUnmount() {
    if (this.animationFrameHandler) {
      cancelAnimationFrame(this.animationFrameHandler);
    }
  }
}