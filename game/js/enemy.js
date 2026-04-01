class EnemySpawnState extends State {
    constructor() {
        super('SPAWN');
    }

    enter(entity) {
        entity.color = '#d96a6a';
    }

    execute(entity) {
        entity.x -= entity.moveSpeed * 1.1;
        if (entity.x <= entity.fieldWidth - 40) {
            entity.stateMachine.changeState(Enemy.states.PATROL);
        }
    }
}

class EnemyPatrolState extends State {
    constructor() {
        super('PATROL');
    }

    enter(entity) {
        entity.color = '#d94f4f';
        entity.walkTarget = entity.createWalkTarget();
    }

    execute(entity) {
        if (entity.health <= entity.maxHealth * 0.2) {
            entity.stateMachine.changeState(Enemy.states.RETREAT);
            return;
        }

        if (entity.currentTarget && entity.distanceTo(entity.currentTarget) <= entity.visionRange) {
            entity.stateMachine.changeState(Enemy.states.CHASE);
            return;
        }

        entity.advance(entity.fieldWidth, entity.fieldHeight);
    }
}

class EnemyChaseState extends State {
    constructor() {
        super('CHASE');
    }

    enter(entity) {
        entity.color = '#ff7a45';
    }

    execute(entity) {
        if (entity.health <= entity.maxHealth * 0.2) {
            entity.stateMachine.changeState(Enemy.states.RETREAT);
            return;
        }

        if (!entity.currentTarget || entity.currentTarget.markedForDeletion) {
            entity.stateMachine.changeState(Enemy.states.PATROL);
            return;
        }

        const targetDistance = entity.distanceTo(entity.currentTarget);
        if (targetDistance <= entity.range) {
            entity.stateMachine.changeState(Enemy.states.ATTACK);
            return;
        }

        if (targetDistance > entity.visionRange * 1.2) {
            entity.stateMachine.changeState(Enemy.states.PATROL);
            return;
        }

        entity.moveToward(entity.currentTarget.x, entity.currentTarget.y, entity.range - 10);
    }
}

class EnemyAttackState extends State {
    constructor() {
        super('ATTACK');
    }

    enter(entity) {
        entity.color = '#ffd166';
    }

    execute(entity) {
        if (entity.health <= entity.maxHealth * 0.2) {
            entity.stateMachine.changeState(Enemy.states.RETREAT);
            return;
        }

        if (!entity.currentTarget || entity.currentTarget.markedForDeletion) {
            entity.stateMachine.changeState(Enemy.states.PATROL);
            return;
        }

        const targetDistance = entity.distanceTo(entity.currentTarget);
        if (targetDistance > entity.range + 12) {
            entity.stateMachine.changeState(Enemy.states.CHASE);
            return;
        }

        entity.tryShoot(entity.currentTarget);
    }
}

class EnemyRetreatState extends State {
    constructor() {
        super('RETREAT');
    }

    enter(entity) {
        entity.color = '#8ecae6';
        entity.retreatTimer = 75;
    }

    execute(entity) {
        entity.retreatTimer--;

        const retreatPoint = entity.currentTarget
            ? {
                x: entity.x + Math.max(50, (entity.x - entity.currentTarget.x)),
                y: entity.y + Math.sign(entity.y - entity.currentTarget.y || 1) * 26
            }
            : {
                x: entity.x + 70,
                y: entity.y - 20
            };

        entity.moveToward(retreatPoint.x, retreatPoint.y, 2);
        entity.clampToBattlefield();

        if (entity.health <= 0) {
            entity.stateMachine.changeState(Enemy.states.DEAD);
            return;
        }

        const targetDistance = entity.currentTarget ? entity.distanceTo(entity.currentTarget) : Infinity;
        if (entity.retreatTimer <= 0 || targetDistance > entity.visionRange * 1.4) {
            entity.stateMachine.changeState(Enemy.states.PATROL);
        }
    }
}

class EnemyDeadState extends State {
    constructor() {
        super('DEAD');
    }

    enter(entity) {
        entity.color = '#5e3023';
        entity.markedForDeletion = true;
    }
}

class Enemy {
    static states = {
        SPAWN: new EnemySpawnState(),
        PATROL: new EnemyPatrolState(),
        CHASE: new EnemyChaseState(),
        ATTACK: new EnemyAttackState(),
        RETREAT: new EnemyRetreatState(),
        DEAD: new EnemyDeadState()
    };

    constructor(width, height) {
        this.x = width + 30;
        this.fieldWidth = width;
        this.fieldHeight = height;
        this.y = this.randomSpawnY();
        this.spawnX = this.x;
        this.spawnY = this.y;
        this.baseMoveSpeed = 1.4;
        this.moveSpeed = this.baseMoveSpeed;
        this.range = 95;
        this.visionRange = 170;
        this.cooldown = 0;
        this.fireRate = 24;
        this.maxHealth = 100;
        this.health = this.maxHealth;
        this.radius = 15;
        this.markedForDeletion = false;
        this.reachedBase = false;
        this.color = 'red';
        this.projectiles = [];
        this.shootSound = new Audio('assets/sounds/shotgun-shot-sound-effect.mp3');
        this.walkTarget = this.createWalkTarget();
        this.currentTarget = null;
        this.retreatTimer = 0;
        this.stateMachine = new StateMachine(this);
        this.stateMachine.changeState(Enemy.states.SPAWN);
    }

    update(playerTargets, fieldWidth, fieldHeight) {
        this.fieldWidth = fieldWidth;
        this.fieldHeight = fieldHeight;
        this.moveSpeed = this.baseMoveSpeed;
        if (this.cooldown > 0) this.cooldown--;

        this.projectiles.forEach(projectile => projectile.update());
        this.projectiles = this.projectiles.filter(projectile => !projectile.markedForDeletion);
        this.currentTarget = this.findTarget(playerTargets, this.visionRange);

        if (this.health <= 0 && this.stateMachine.currentState !== Enemy.states.DEAD) {
            this.stateMachine.changeState(Enemy.states.DEAD);
        } else {
            this.stateMachine.update();
        }

        this.clampToBattlefield();

        if (this.x < -this.radius) {
            this.reachedBase = true;
            this.markedForDeletion = true;
        }
    }

    findTarget(playerTargets, maxRange) {
        let closest = null;
        let minDist = Infinity;

        for (const target of playerTargets) {
            if (!target || target.markedForDeletion) continue;
            const dist = Math.hypot(target.x - this.x, target.y - this.y);
            if (dist < maxRange && dist < minDist) {
                minDist = dist;
                closest = target;
            }
        }

        return closest;
    }

    createWalkTarget() {
        const bounds = this.getBattleBounds();
        return {
            x: this.x - (80 + Math.random() * 120),
            y: this.clampY(this.spawnY + (Math.random() * 120 - 60), bounds)
        };
    }

    advance(fieldWidth, fieldHeight) {
        this.moveToward(this.walkTarget.x, this.walkTarget.y, 2);

        const bounds = this.getBattleBounds(fieldWidth, fieldHeight);
        const offVerticalBounds = this.walkTarget.y < bounds.top || this.walkTarget.y > bounds.bottom;
        if (Math.hypot(this.walkTarget.x - this.x, this.walkTarget.y - this.y) < 8 || offVerticalBounds) {
            this.walkTarget = this.createWalkTarget();
            this.walkTarget.y = this.clampY(this.walkTarget.y, bounds);
        }
    }

    moveToward(targetX, targetY, stopDistance = 0) {
        const dx = targetX - this.x;
        const dy = targetY - this.y;
        const dist = Math.hypot(dx, dy);

        if (dist <= stopDistance || dist === 0) return;

        const travel = Math.min(this.moveSpeed, dist - stopDistance);
        this.x += (dx / dist) * travel;
        this.y += (dy / dist) * travel;
        this.clampToBattlefield();
    }

    isMobileBattlefield(width = this.fieldWidth) {
        return width <= 900;
    }

    getBattleBounds(width = this.fieldWidth, height = this.fieldHeight) {
        const fallbackTop = this.isMobileBattlefield(width) ? 48 : 60;
        const fallbackBottom = this.isMobileBattlefield(width) ? height - 132 : height - 60;
        let top = fallbackTop;
        let bottom = fallbackBottom;

        if (typeof document !== 'undefined') {
            const hud = document.getElementById('hud');
            const controls = document.getElementById('controls');
            const toggle = document.getElementById('mobile-controls-toggle');

            if (hud && !hud.classList.contains('hidden')) {
                const hudRect = hud.getBoundingClientRect();
                top = Math.max(top, hudRect.bottom + this.radius);
            }

            if (controls && !controls.classList.contains('hidden') && !controls.classList.contains('mobile-collapsed')) {
                const controlsRect = controls.getBoundingClientRect();
                bottom = Math.min(bottom, controlsRect.top - this.radius - 6);
            } else if (toggle && !toggle.classList.contains('hidden')) {
                const toggleRect = toggle.getBoundingClientRect();
                bottom = Math.min(bottom, toggleRect.top - this.radius - 6);
            }
        }

        bottom = Math.max(top + 40, bottom);
        return { top, bottom };
    }

    clampY(y, bounds = this.getBattleBounds()) {
        return Math.max(bounds.top, Math.min(bounds.bottom, y));
    }

    randomSpawnY() {
        const bounds = this.getBattleBounds();
        return bounds.top + Math.random() * Math.max(10, bounds.bottom - bounds.top);
    }

    clampToBattlefield() {
        const bounds = this.getBattleBounds();
        this.y = this.clampY(this.y, bounds);
    }

    distanceTo(target) {
        return Math.hypot(target.x - this.x, target.y - this.y);
    }

    tryShoot(target) {
        if (this.cooldown > 0 || !target) return;
        this.projectiles.push(new Projectile(this.x, this.y, target));
        const shotSound = this.shootSound.cloneNode();
        shotSound.currentTime = 0;
        shotSound.play().catch(() => {});
        this.cooldown = this.fireRate;
    }

    draw(ctx) {
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = 'black';
        ctx.fillRect(this.x - 15, this.y - 20, 30, 4);
        ctx.fillStyle = 'green';
        ctx.fillRect(this.x - 15, this.y - 20, 30 * (this.health / this.maxHealth), 4);

        if (this.stateMachine.currentState) {
            ctx.fillStyle = '#f3f5f7';
            ctx.font = '10px Segoe UI';
            ctx.textAlign = 'center';
            ctx.fillText(this.stateMachine.currentState.name, this.x, this.y - 26);
        }

        this.projectiles.forEach(projectile => projectile.draw(ctx));
    }

    takeDamage(amount) {
        this.health -= amount;
        if (this.health <= 0) {
            this.health = 0;
            this.stateMachine.changeState(Enemy.states.DEAD);
            new Audio('assets/sounds/soldier_die.wav').play().catch(() => {});
        }
    }
}
