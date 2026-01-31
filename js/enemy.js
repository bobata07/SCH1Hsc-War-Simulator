import FSM from './fsm.js';

export default class Enemy {
  constructor(path) {
    this.path = path;
    this.pathIndex = 0;
    this.x = path[0].x;
    this.y = path[0].y;
    this.health = 100;
    this.speed = 1.5;

    this.fsm = new FSM('SPAWN', {
      SPAWN: {
        update: () => this.fsm.change('WALK')
      },
      WALK: {
        update: ({ towerInRange }) => {
          this.move();
          if (towerInRange) this.fsm.change('ATTACK_TOWER');
          if (this.atEnd()) this.fsm.change('REACH_BASE');
        }
      },
      ATTACK_TOWER: {
        update: ({ towerDestroyed }) => {
          if (towerDestroyed) this.fsm.change('WALK');
        }
      },
      REACH_BASE: {
        enter: () => console.log('Base damaged'),
        update: () => {}
      },
      DEAD: {
        update: () => {}
      }
    });
  }

  move() {
    const target = this.path[this.pathIndex + 1];
    if (!target) return;

    const dx = target.x - this.x;
    const dy = target.y - this.y;
    const dist = Math.hypot(dx, dy);

    if (dist < 2) this.pathIndex++;
    else {
      this.x += (dx / dist) * this.speed;
      this.y += (dy / dist) * this.speed;
    }
  }

  atEnd() {
    return this.pathIndex >= this.path.length - 1;
  }

  update(ctx) {
    if (this.health <= 0) this.fsm.change('DEAD');
    this.fsm.update(ctx);
  }
}
