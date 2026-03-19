class EnemyAircraftCarrier extends AircraftCarrier {
    constructor(width, height) {
        super(width - 120, 110 + Math.random() * Math.max(120, height - 220), { isEnemy: true });
    }
}
