class EnemySubmarine extends Submarine {
    constructor(width, height) {
        super(width - 80, 90 + Math.random() * Math.max(120, height - 180), { isEnemy: true });
    }
}
