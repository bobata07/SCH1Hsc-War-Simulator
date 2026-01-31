export default class Tower {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.range = 100;
    this.damage = 1;
  }

  inRange(enemy) {
    return Math.hypot(this.x - enemy.x, this.y - enemy.y) < this.range;
  }
}
