import V = require('./V');
import Actor = require('./Actor');
import Sourcer = require('./Sourcer');
import Shot = require('./Shot');
import Fx = require('./Fx');
import Utils = require('./Utils');
import TickEventListener = require('./TickEventListener');

class Field {
  private id = 0;
  public sourcers: Sourcer[];
  public shots: Shot[];
  public fxs: Fx[];
  public actorCounter: number;
  public frame: number;
  public finishedFrame: number;
  public center: number;
  public result: GameResult;

  constructor() {
    this.frame = 0;
    this.sourcers = [];
    this.shots = [];
    this.fxs = [];
  }

  public addSourcer(sourcer: Sourcer) {
    sourcer.id = "sourcer" + (this.id++);
    this.sourcers.push(sourcer);
  }

  public addShot(shot: Shot) {
    shot.id = "shot" + (this.id++);
    this.shots.push(shot);
  }

  public removeShot(target: Shot) {
    for (var i = 0; i < this.shots.length; i++) {
      var actor = this.shots[i];
      if (actor === target) {
        this.shots.splice(i, 1);
        return;
      }
    }
  }

  public addFx(fx: Fx) {
    fx.id = "fx" + (this.id++);
    this.fxs.push(fx);
  }

  public removeFx(target: Fx) {
    for (var i = 0; i < this.fxs.length; i++) {
      var fx = this.fxs[i];
      if (fx === target) {
        this.fxs.splice(i, 1);
        return;
      }
    }
  }

  public tick(listener: TickEventListener) {
    // To be used in the invisible hand.
    this.center = this.computeCenter();

    this.sourcers.forEach((sourcer: Sourcer) => {
      listener.onPreThink(sourcer.id);
      sourcer.think();
      listener.onPostThink(sourcer.id);
    });
    this.shots.forEach((shot: Shot) => {
      listener.onPreThink(shot.owner.id);
      shot.think();
      listener.onPostThink(shot.owner.id);
    });

    this.sourcers.forEach((actor: Actor) => {
      actor.action();
    });
    this.shots.forEach((actor: Actor) => {
      actor.action();
    });
    this.fxs.forEach((fx: Fx) => {
      fx.action();
    });

    this.sourcers.forEach((actor: Actor) => {
      actor.move();
    });
    this.shots.forEach((actor: Actor) => {
      actor.move();
    });
    this.fxs.forEach((fx: Fx) => {
      fx.move();
    });

    this.checkResult();

    this.frame++;
  }

  public checkResult() {
    if (this.result) {
      return;
    }

    var survived: Sourcer = null;
    for (var i = 0; i < this.sourcers.length; i++) {
      var sourcer = this.sourcers[i];
      if (sourcer.shield <= 0) {
        sourcer.alive = false;
      } else if (!survived) {
        survived = sourcer;
      } else {
        return;
      }
    }
    this.result = new GameResult(survived, this.frame);
  }

  public scanEnemy(owner: Sourcer, radar: ((t: V) => boolean)): boolean {
    for (var i = 0; i < this.sourcers.length; i++) {
      var sourcer = this.sourcers[i];
      if (sourcer.alive && sourcer !== owner && radar(sourcer.position)) {
        return true;
      }
    }
    return false;
  }

  public scanAttack(owner: Sourcer, radar: ((t: V) => boolean)): boolean {
    var ownerPosition = owner.position;
    for (var i = 0; i < this.shots.length; i++) {
      var shot = this.shots[i];
      var actorPosition = shot.position;
      if (shot.owner !== owner && radar(actorPosition)) {
        var currentDistance = ownerPosition.distance(actorPosition);
        var nextDistance = ownerPosition.distance(actorPosition.add(shot.speed));
        if (nextDistance < currentDistance) {
          return true;
        }
      }
    }
    return false;
  }

  public checkCollision(shot: Shot): Actor {
    var f = shot.position;
    var t = shot.position.add(shot.speed);

    for (var i = 0; i < this.shots.length; i++) {
      var actor = this.shots[i];
      if (actor.breakable && actor.owner !== shot.owner) {
        var distance = Utils.calcDistance(f, t, actor.position);
        if (distance < shot.size + actor.size) {
          return actor;
        }
      }
    }

    for (var i = 0; i < this.sourcers.length; i++) {
      var sourcer = this.sourcers[i];
      if (sourcer.alive && sourcer !== shot.owner) {
        var distance = Utils.calcDistance(f, t, sourcer.position);
        if (distance < shot.size + actor.size) {
          return sourcer;
        }
      }
    }

    return null;
  }

  public checkCollisionEnviroment(shot: Shot): boolean {
    return shot.position.y < 0;
  }

  private computeCenter(): number {
    var count = 0;
    var sumX = 0;
    this.sourcers.forEach((sourcer: Sourcer) => {
      if (sourcer.alive) {
        sumX += sourcer.position.x;
        count++;
      }
    });
    return sumX / count;
  }

  public isFinish(): boolean {
    var finished = false;

    if (!this.finishedFrame) {
      for (var i = 0; i < this.sourcers.length; i++) {
        var sourcer = this.sourcers[i];
        if (!sourcer.alive) {
          finished = true;
          this.finishedFrame = this.frame;
        }
      }
      return false;
    }

    if (this.finishedFrame < this.frame - 90) {
      return true;
    }

    return false;
  }

  public dump(): any {
    var sourcersDump: any[] = [];
    var shotsDump: any[] = [];
    var fxDump: any[] = [];
    var resultDump: any = null;

    this.sourcers.forEach((actor: Actor) => {
      sourcersDump.push(actor.dump());
    });
    this.shots.forEach((actor: Actor) => {
      shotsDump.push(actor.dump());
    });
    this.fxs.forEach((fx: Fx) => {
      fxDump.push(fx.dump());
    });
    if (this.result) {
      resultDump = this.result.dump();
    }

    return {
      frame: this.frame,
      sourcers: sourcersDump,
      shots: shotsDump,
      fxs: fxDump,
      result: resultDump
    };
  }
}

class GameResult {
  constructor(public winner: Sourcer, public frame: number) {
  }
  public isDraw() {
    return this.winner == null;
  }
  public dump() {
    var dump: any = null;
    if (this.winner) {
      dump = this.winner.dump()
    }
    return {
      winner: dump,
      isDraw: this.isDraw(),
      frame: this.frame
    };
  }
}

export = Field;
