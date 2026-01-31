

class WalkState extends State {
    constructor() {
        super('WALK');
    }

    execute(enemy) {
        // Simple movement logic towards next waypoint
        const target = enemy.path[enemy.currentPathIndex];
        const dx = target.x - enemy.x;
        const dy = target.y - enemy.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < 5) {
            enemy.currentPathIndex++;
            if (enemy.currentPathIndex >= enemy.path.length) {
                enemy.reachBase();
                return;
            }
        }

        enemy.x += (dx / dist) * enemy.speed;
        enemy.y += (dy / dist) * enemy.speed;

        // Transition Checks
        if (enemy.health < enemy.maxHealth * 0.2) {
            enemy.fsm.changeState(new FleeState());
        }
        // TODO: check for towers to ATTACK
    }
}

class FleeState extends State {
    constructor() {
        super('FLEE');
    }

    execute(enemy) {
        // Move BACKWARDS along the path
        if (enemy.currentPathIndex > 0) {
            const target = enemy.path[enemy.currentPathIndex - 1];
            const dx = target.x - enemy.x;
            const dy = target.y - enemy.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            enemy.x += (dx / dist) * (enemy.speed * 1.5); // Flee faster
            enemy.y += (dy / dist) * (enemy.speed * 1.5);

            if (dist < 5) {
                enemy.currentPathIndex--;
            }
        } else {
            // Reached start, maybe despawn or heal? For now, just heal and return
            enemy.health += 0.1;
            if (enemy.health > enemy.maxHealth * 0.5) {
                enemy.fsm.changeState(new WalkState());
            }
        }
    }
}

class DeadState extends State {
    constructor() {
        super('DEAD');
    }

    enter(enemy) {
        console.log("Enemy Died");
        enemy.markedForDeletion = true;

        // Play death sound
        new Audio('assets/sounds/soldier_die.wav').play().catch(e => console.error("Sound error:", e));
    }
}

class Enemy {
    constructor(path) {
        this.path = path;
        this.x = path[0].x;
        this.y = path[0].y;
        this.currentPathIndex = 1;
        this.speed = 2;
        this.maxHealth = 100;
        this.health = this.maxHealth;
        this.radius = 15;
        this.markedForDeletion = false;
        this.color = 'red';

        this.fsm = new StateMachine(this);
        this.fsm.changeState(new WalkState());
    }

    update() {
        this.fsm.update();
        // Visual indicator of state
        if (this.fsm.currentState.name === 'FLEE') this.color = 'purple';
        else if (this.fsm.currentState.name === 'WALK') this.color = 'red';
    }

    draw(ctx) {
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();

        // State Label
        ctx.fillStyle = 'white';
        ctx.font = '10px Arial';
        ctx.fillText(this.fsm.currentState.name, this.x - 10, this.y - 20);

        // Health Bar
        ctx.fillStyle = 'black';
        ctx.fillRect(this.x - 15, this.y - 20, 30, 4);
        ctx.fillStyle = 'green';
        ctx.fillRect(this.x - 15, this.y - 20, 30 * (this.health / this.maxHealth), 4);
    }

    takeDamage(amount) {
        this.health -= amount;
        if (this.health <= 0) {
            this.fsm.changeState(new DeadState());
        }
    }

    reachBase() {
        this.markedForDeletion = true;
        // Logic to damage player base will be handled by Game class checking this flag
    }
}
