import Actor from './Actor';
import Shot from './Shot';
import Field from './Field';
import Sourcer from './Sourcer';
import Utils from './Utils';
import V from './V';
import Fx from './Fx';
import Configs from './Configs';
import MissileCommand from './MissileCommand';
import MissileController from './MissileController';
import Consts from './Consts';

export default class Missile extends Shot {
  public temperature = 10;
  public damage = () => 10 + this.speed.length() * 2;
  public fuel = 100;
  public breakable = true;

  public command: MissileCommand;
  public controller: MissileController;

  constructor(field: Field, owner: Sourcer, public ai: (controller: MissileController) => void) {
    super(field, owner, 'Missile');
    this.ai = ai;
    this.direction = owner.direction === Consts.DIRECTION_RIGHT ? 0 : 180;
    this.speed = owner.speed;
    this.command = new MissileCommand(this);
    this.command.reset();
    this.controller = new MissileController(this);
  }

  public onThink() {
    this.command.reset();

    if (this.fuel <= 0) { // Cancel thinking
      return;
    }

    try {
      this.command.accept();
      this.controller.preThink();
      this.ai(this.controller);
      this.command.unaccept();
    } catch (error) {
      this.command.reset();
    }
  }

  public onAction() {
    this.speed = this.speed.multiply(Configs.SPEED_RESISTANCE);
    this.command.execute();
    this.command.reset();
  }

  public onHit(attack: Shot) {
    this.field.removeShot(this);
    this.field.removeShot(attack);
  }

  public opposite(direction: number): number {
    return this.direction + direction;
  }
}
